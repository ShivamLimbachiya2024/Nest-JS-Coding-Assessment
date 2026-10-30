import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ContractsService, MessageType } from 'contracts'
import { NotificationEntity } from 'database/notification-service'
import { StoryLogger } from 'logger'
import { MessageProcessingError, RabbitErrorCode } from 'rabbitmq'
import { ConsumeMessage } from 'amqplib'
import get from 'lodash/get.js'
import { QueryFailedError, Repository } from 'typeorm'

@Injectable()
export class TaskCompletedHandler {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notifications: Repository<NotificationEntity>,
    private readonly contracts: ContractsService,
    private readonly logger: StoryLogger,
  ) {}

  async handle(value: unknown, _delivery: ConsumeMessage): Promise<void> {
    let envelope
    let event

    try {
      envelope = this.contracts.parseEnvelope(value)

      if (envelope.messageType !== MessageType.TASK_COMPLETED) {
        throw new Error('Unexpected task completion message type')
      }

      event = this.contracts.parseTaskCompleted(envelope.payload)
    } catch {
      throw new MessageProcessingError(
        'Task completion contract validation failed',
        false,
        RabbitErrorCode.MESSAGE_CONTRACT_INVALID,
      )
    }

    const notification = this.notifications.create({
      userId: event.assignedUserId,
      message: `Task ${event.taskTitle} was completed`,
      isRead: false,
      sourceMessageId: envelope.messageId,
    })

    try {
      await this.notifications.insert(notification)
      this.logger.info(
        `Task completed notification committed correlationId=${envelope.correlationId} operation=store-notification outcome=completed messageId=${envelope.messageId} taskId=${event.taskId} userId=${event.assignedUserId}`,
      )
    } catch (error: unknown) {
      const driverCode: unknown =
        error instanceof QueryFailedError
          ? get(error.driverError, 'code')
          : undefined

      if (driverCode === '23505') {
        this.logger.info(
          `Duplicate task completed event recognized correlationId=${envelope.correlationId} operation=store-notification outcome=duplicate messageId=${envelope.messageId} taskId=${event.taskId}`,
        )
        return
      }

      throw new MessageProcessingError(
        'Notification persistence failed',
        true,
        RabbitErrorCode.NOTIFICATION_PERSISTENCE_FAILED,
      )
    }
  }
}
