import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { TaskflowConfigService } from '@taskflow/config'
import { MessageEnvelope, WorkerQueue } from '@taskflow/contracts'
import { StoryLogger } from '@taskflow/logger'
import {
  AmqpConnectionManager,
  Channel,
  ChannelWrapper,
  connect,
} from 'amqp-connection-manager'
import { ConsumeMessage } from 'amqplib'
import get from 'lodash/get.js'
import isNumber from 'lodash/isNumber.js'
import toNumber from 'lodash/toNumber.js'
import { MessageProcessingError } from './message-processing-error.js'
import {
  ExchangeName,
  InternalQueue,
  MAX_MESSAGE_BYTES,
  MAX_NOTIFICATION_ATTEMPTS,
  RabbitErrorCode,
  RoutingKey,
} from './topology.js'

interface PendingReply {
  readonly resolve: (value: unknown) => void
  readonly reject: (error: Error) => void
  readonly timeout: NodeJS.Timeout
}

export type MessageHandler = (
  message: unknown,
  delivery: ConsumeMessage,
) => Promise<void>

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  private connection: AmqpConnectionManager | undefined
  private channel: ChannelWrapper | undefined
  private readonly pendingReplies = new Map<string, PendingReply>()

  constructor(
    private readonly config: TaskflowConfigService,
    private readonly logger: StoryLogger,
  ) {}

  get isReady(): boolean {
    return this.connection?.isConnected() ?? false
  }

  async onModuleInit(): Promise<void> {
    this.connection = connect([this.config.rabbitmqUrl], {
      heartbeatIntervalInSeconds: 5,
      reconnectTimeInSeconds: 5,
    })
    this.channel = this.connection.createChannel({
      confirm: true,
      name: `${this.config.serviceName}-taskflow`,
      publishTimeout: 5_000,
      setup: (channel: Channel) => this.setupTopology(channel),
    })
    await this.connection.connect({ timeout: 5_000 })
    await this.channel.waitForConnect()
    await this.channel.consume(
      'amq.rabbitmq.reply-to',
      (message) => this.receiveReply(message),
      { noAck: true },
    )
  }

  async publish<TPayload>(
    exchange: ExchangeName,
    routingKey: RoutingKey,
    envelope: MessageEnvelope<TPayload>,
  ): Promise<void> {
    const content = this.encode(envelope)
    await this.getChannel().publish(exchange, routingKey, content, {
      contentType: 'application/json',
      deliveryMode: 2,
      messageId: envelope.messageId,
      correlationId: envelope.correlationId,
      timestamp: Date.now(),
    })
  }

  request<TPayload>(
    routingKey: RoutingKey,
    envelope: MessageEnvelope<TPayload>,
    timeoutMs: number,
  ): Promise<unknown> {
    const channel = this.getChannel()
    const content = this.encode(envelope)

    return new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingReplies.delete(envelope.messageId)
        reject(new MessageProcessingError(
          'RabbitMQ request timed out',
          true,
          RabbitErrorCode.REQUEST_TIMEOUT,
        ))
      }, timeoutMs)
      this.pendingReplies.set(envelope.messageId, { resolve, reject, timeout })

      void channel.publish(ExchangeName.RPC, routingKey, content, {
        contentType: 'application/json',
        deliveryMode: 2,
        messageId: envelope.messageId,
        correlationId: envelope.messageId,
        replyTo: 'amq.rabbitmq.reply-to',
        timestamp: Date.now(),
      }).catch((error: unknown) => {
        clearTimeout(timeout)
        this.pendingReplies.delete(envelope.messageId)
        reject(new MessageProcessingError(
          error instanceof Error ? error.message : 'RabbitMQ publish failed',
          true,
          RabbitErrorCode.BROKER_UNAVAILABLE,
        ))
      })
    })
  }

  async reply(
    queue: string,
    correlationId: string,
    message: unknown,
  ): Promise<void> {
    await this.getChannel().sendToQueue(queue, this.encode(message), {
      contentType: 'application/json',
      correlationId,
      deliveryMode: 2,
    })
  }

  async consume(
    queue: WorkerQueue,
    prefetch: number,
    handler: MessageHandler,
  ): Promise<void> {
    await this.getChannel().consume(
      queue,
      (message) => {
        void this.processDelivery(message, handler)
      },
      { noAck: false, prefetch },
    )
  }

  async onModuleDestroy(): Promise<void> {
    const channel = this.channel
    const connection = this.connection

    if (channel !== undefined) {
      await channel.cancelAll()
      await channel.close()
    }

    if (connection !== undefined) {
      await connection.close()
    }
  }

  private async setupTopology(channel: Channel): Promise<void> {
    await Promise.all([
      channel.assertExchange(ExchangeName.RPC, 'direct', { durable: true }),
      channel.assertExchange(ExchangeName.EVENTS, 'topic', { durable: true }),
      channel.assertExchange(ExchangeName.RETRY, 'direct', { durable: true }),
      channel.assertExchange(ExchangeName.DEAD_LETTER, 'direct', {
        durable: true,
      }),
    ])
    await Promise.all([
      channel.assertQueue(WorkerQueue.USER_VERIFICATION, { durable: true }),
      channel.assertQueue(WorkerQueue.NOTIFICATION_TASK_COMPLETED, {
        durable: true,
      }),
      channel.assertQueue(InternalQueue.NOTIFICATION_RETRY_ONE, {
        durable: true,
        deadLetterExchange: ExchangeName.EVENTS,
        deadLetterRoutingKey: RoutingKey.TASK_COMPLETED,
        messageTtl: 1_000,
      }),
      channel.assertQueue(InternalQueue.NOTIFICATION_RETRY_TWO, {
        durable: true,
        deadLetterExchange: ExchangeName.EVENTS,
        deadLetterRoutingKey: RoutingKey.TASK_COMPLETED,
        messageTtl: 5_000,
      }),
      channel.assertQueue(InternalQueue.NOTIFICATION_RETRY_THREE, {
        durable: true,
        deadLetterExchange: ExchangeName.EVENTS,
        deadLetterRoutingKey: RoutingKey.TASK_COMPLETED,
        messageTtl: 15_000,
      }),
      channel.assertQueue(InternalQueue.NOTIFICATION_DEAD, { durable: true }),
    ])
    await Promise.all([
      channel.bindQueue(
        WorkerQueue.USER_VERIFICATION,
        ExchangeName.RPC,
        RoutingKey.USERS_EXISTS_REQUEST,
      ),
      channel.bindQueue(
        WorkerQueue.NOTIFICATION_TASK_COMPLETED,
        ExchangeName.EVENTS,
        RoutingKey.TASK_COMPLETED,
      ),
      channel.bindQueue(
        InternalQueue.NOTIFICATION_RETRY_ONE,
        ExchangeName.RETRY,
        RoutingKey.NOTIFICATION_RETRY_ONE,
      ),
      channel.bindQueue(
        InternalQueue.NOTIFICATION_RETRY_TWO,
        ExchangeName.RETRY,
        RoutingKey.NOTIFICATION_RETRY_TWO,
      ),
      channel.bindQueue(
        InternalQueue.NOTIFICATION_RETRY_THREE,
        ExchangeName.RETRY,
        RoutingKey.NOTIFICATION_RETRY_THREE,
      ),
      channel.bindQueue(
        InternalQueue.NOTIFICATION_DEAD,
        ExchangeName.DEAD_LETTER,
        RoutingKey.NOTIFICATION_DEAD,
      ),
    ])
  }

  private receiveReply(message: ConsumeMessage | null): void {
    if (message === null) {
      return
    }

    const correlationId = message.properties.correlationId
    const pending = this.pendingReplies.get(correlationId)

    if (pending === undefined) {
      return
    }

    clearTimeout(pending.timeout)
    this.pendingReplies.delete(correlationId)
    pending.resolve(this.decode(message))
  }

  private async processDelivery(
    message: ConsumeMessage | null,
    handler: MessageHandler,
  ): Promise<void> {
    if (message === null) {
      return
    }

    const channel = this.getChannel()

    try {
      const decoded = this.decode(message)
      await handler(decoded, message)
      channel.ack(message)
    } catch (error: unknown) {
      const retryable = !(error instanceof MessageProcessingError)
        || error.retryable
      const errorCode = error instanceof MessageProcessingError
        ? error.code
        : RabbitErrorCode.UNEXPECTED_MESSAGE_FAILURE
      const attemptValue: unknown = get(
        message.properties.headers,
        'x-taskflow-attempt',
      )
      const attempt = isNumber(attemptValue) ? attemptValue : toNumber(attemptValue)

      if (retryable && attempt < MAX_NOTIFICATION_ATTEMPTS) {
        await channel.publish(
          ExchangeName.RETRY,
          this.retryRoutingKey(attempt + 1),
          message.content,
          {
            contentType: 'application/json',
            deliveryMode: 2,
            headers: { 'x-taskflow-attempt': attempt + 1 },
            messageId: message.properties.messageId,
            correlationId: message.properties.correlationId,
          },
        )
        this.logger.warn(
          `RabbitMQ message scheduled for retry correlationId=${message.properties.correlationId} operation=consume-message outcome=retry errorCode=${errorCode} attempt=${attempt + 1}`,
        )
      } else {
        await channel.publish(
          ExchangeName.DEAD_LETTER,
          RoutingKey.NOTIFICATION_DEAD,
          message.content,
          {
            contentType: 'application/json',
            deliveryMode: 2,
            headers: { 'x-taskflow-error-code': errorCode },
            messageId: message.properties.messageId,
            correlationId: message.properties.correlationId,
          },
        )
        this.logger.error(
          `RabbitMQ message dead-lettered correlationId=${message.properties.correlationId} operation=consume-message outcome=dead-lettered errorCode=${errorCode} attempt=${attempt}`,
        )
      }

      channel.ack(message)
    }
  }

  private retryRoutingKey(attempt: number): RoutingKey {
    switch (attempt) {
      case 1:
        return RoutingKey.NOTIFICATION_RETRY_ONE
      case 2:
        return RoutingKey.NOTIFICATION_RETRY_TWO
      case 3:
        return RoutingKey.NOTIFICATION_RETRY_THREE
      default:
        throw new Error(`Unsupported notification retry attempt=${attempt}`)
    }
  }

  private encode(value: unknown): Buffer {
    const content = Buffer.from(JSON.stringify(value))

    if (content.byteLength > MAX_MESSAGE_BYTES) {
      throw new MessageProcessingError(
        'RabbitMQ message exceeds the allowed size',
        false,
        RabbitErrorCode.MESSAGE_TOO_LARGE,
      )
    }

    return content
  }

  private decode(message: ConsumeMessage): unknown {
    if (message.content.byteLength > MAX_MESSAGE_BYTES) {
      throw new MessageProcessingError(
        'RabbitMQ message exceeds the allowed size',
        false,
        RabbitErrorCode.MESSAGE_TOO_LARGE,
      )
    }

    try {
      const decoded: unknown = JSON.parse(message.content.toString('utf8'))
      return decoded
    } catch {
      throw new MessageProcessingError(
        'RabbitMQ message contains invalid JSON',
        false,
        RabbitErrorCode.MESSAGE_INVALID_JSON,
      )
    }
  }

  private getChannel(): ChannelWrapper {
    if (this.channel === undefined) {
      throw new Error('RabbitMQ channel is not initialized')
    }

    return this.channel
  }
}
