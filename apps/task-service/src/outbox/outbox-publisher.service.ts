import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { TaskflowConfigService } from '@taskflow/config'
import { ContractsService, OutboxStatus } from '@taskflow/contracts'
import { OutboxMessageEntity } from '@taskflow/database/task-service'
import { StoryLogger } from '@taskflow/logger'
import { MessageProcessingError, RabbitmqService } from '@taskflow/rabbitmq'
import { WorkerQueue } from '@taskflow/contracts'
import map from 'lodash/map.js'
import { DataSource, Repository } from 'typeorm'

enum OutboxErrorCode {
  PUBLISH_FAILED = 'OUTBOX_PUBLISH_FAILED',
}

@Injectable()
export class OutboxPublisherService implements OnModuleDestroy {
  private timer: NodeJS.Timeout | undefined
  private polling = false
  private stopping = false
  private inFlightPoll: Promise<void> | undefined

  constructor(
    private readonly dataSource: DataSource,
    private readonly rabbitmq: RabbitmqService,
    private readonly contracts: ContractsService,
    private readonly config: TaskflowConfigService,
    private readonly logger: StoryLogger,
  ) {}

  async start(): Promise<void> {
    await this.poll()
    const intervalMs = this.config.integer(
      'OUTBOX_POLL_INTERVAL_MS',
      1_000,
      100,
      60_000,
    )
    this.timer = setInterval(() => {
      void this.poll()
    }, intervalMs)
    this.logger.info(
      `Task outbox publisher ready correlationId=outbox-startup operation=start-outbox outcome=ready intervalMs=${intervalMs}`,
    )
  }

  async poll(): Promise<void> {
    if (this.stopping || this.polling) {
      return
    }

    this.polling = true
    const currentPoll = this.pollBatch()
      .catch((error: unknown) => {
        const errorType = error instanceof Error ? error.name : 'UnknownError'
        this.logger.error(
          `Task outbox polling failed correlationId=outbox-poller operation=poll-outbox outcome=failed errorType=${errorType}`,
        )
      })
      .finally(() => {
        this.polling = false
        this.inFlightPoll = undefined
      })
    this.inFlightPoll = currentPoll
    await currentPoll
  }

  private async pollBatch(): Promise<void> {
    const messages = await this.claimBatch()
    await Promise.all(map(messages, (message) => this.publish(message)))
  }

  async onModuleDestroy(): Promise<void> {
    this.stopping = true
    if (this.timer !== undefined) {
      clearInterval(this.timer)
      this.timer = undefined
    }

    await this.inFlightPoll
  }

  private claimBatch(): Promise<OutboxMessageEntity[]> {
    const batchSize = this.config.integer('OUTBOX_BATCH_SIZE', 20, 1, 100)
    const now = new Date()
    const leaseUntil = new Date(now.getTime() + 30_000)

    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(OutboxMessageEntity)
      const messages = await repository
        .createQueryBuilder('outbox')
        .where(
          '(outbox.status = :pending OR outbox.status = :processing) AND outbox.availableAt <= :now',
          {
            pending: OutboxStatus.PENDING,
            processing: OutboxStatus.PROCESSING,
            now,
          },
        )
        .orderBy('outbox.createdAt', 'ASC')
        .setLock('pessimistic_write')
        .setOnLocked('skip_locked')
        .take(batchSize)
        .getMany()

      map(messages, (message) => {
        message.status = OutboxStatus.PROCESSING
        message.availableAt = leaseUntil
        return message
      })
      await repository.save(messages)
      return messages
    })
  }

  private async publish(message: OutboxMessageEntity): Promise<void> {
    const envelope = this.contracts.createEnvelope(
      message.messageType,
      'task-service',
      message.messageId,
      message.payload,
      message.messageId,
      message.occurredAt.toISOString(),
    )

    try {
      await this.rabbitmq.sendToQueue({
        queue: WorkerQueue.NOTIFICATION_TASK_COMPLETED,
        payload: envelope,
      })
      await this.dataSource.getRepository(OutboxMessageEntity).update(
        { id: message.id, status: OutboxStatus.PROCESSING },
        {
          status: OutboxStatus.PUBLISHED,
          publishedAt: new Date(),
          lastErrorCode: null,
        },
      )
      this.logger.info(
        `Task completed event published correlationId=${message.messageId} operation=publish-outbox outcome=published messageId=${message.messageId} taskId=${message.aggregateId}`,
      )
    } catch (error: unknown) {
      await this.reschedule(message, error)
    }
  }

  private async reschedule(
    message: OutboxMessageEntity,
    error: unknown,
  ): Promise<void> {
    const attempts = message.attempts + 1
    const failed = attempts >= 5
    const errorCode =
      error instanceof MessageProcessingError
        ? error.code
        : OutboxErrorCode.PUBLISH_FAILED
    const delayMs = Math.min(2 ** attempts * 1_000, 60_000)
    const repository: Repository<OutboxMessageEntity> =
      this.dataSource.getRepository(OutboxMessageEntity)

    await repository.update(
      { id: message.id, status: OutboxStatus.PROCESSING },
      {
        attempts,
        status: failed ? OutboxStatus.FAILED : OutboxStatus.PENDING,
        availableAt: new Date(Date.now() + delayMs),
        lastErrorCode: errorCode,
      },
    )
    this.logger.warn(
      `Task outbox publication failed correlationId=${message.messageId} operation=publish-outbox outcome=${failed ? 'exhausted' : 'retry'} messageId=${message.messageId} taskId=${message.aggregateId} attempt=${attempts} errorCode=${errorCode}`,
    )
  }
}
