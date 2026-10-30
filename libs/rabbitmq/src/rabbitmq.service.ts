import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { AppConfigService } from 'config'
import { WorkerQueue } from 'contracts'
import type {
  ConsumerQueue,
  MessageEnvelope,
  MessageType,
  UserExistenceRequest,
  UserExistenceResponse,
} from 'contracts'
import { StoryLogger } from 'logger'
import {
  AmqpConnectionManager,
  Channel,
  ChannelWrapper,
  connect,
} from 'amqp-connection-manager'
import type { ConsumeMessage, Options } from 'amqplib'
import get from 'lodash/get.js'
import isFinite from 'lodash/isFinite.js'
import isNumber from 'lodash/isNumber.js'
import toNumber from 'lodash/toNumber.js'
import { MessageProcessingError } from './message-processing-error.js'
import {
  assertNever,
  ExchangeName,
  MAX_MESSAGE_BYTES,
  MAX_NOTIFICATION_ATTEMPTS,
  QueueSendCommand,
  RabbitErrorCode,
  QueueRouteKind,
  RoutingKey,
  resolveQueueRoute,
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
  private replyConsumerReady = false
  private replyConsumerSetup: Promise<void> | undefined
  private replyQueue: string | undefined

  constructor(
    private readonly config: AppConfigService,
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
      name: `${this.config.serviceName}`,
      publishTimeout: 5_000,
      setup: (channel: Channel) => this.setupTopology(channel),
    })
    await this.connection.connect({ timeout: 5_000 })
    await this.channel.waitForConnect()
  }

  async sendToQueue(command: QueueSendCommand): Promise<void> {
    const { queue, payload } = command
    const content = this.encodePayload(payload)
    const envelope = Buffer.isBuffer(payload) ? undefined : payload
    const options: Options.Publish = {
      contentType: 'application/json',
      deliveryMode: 2,
      messageId: envelope?.messageId,
      correlationId: envelope?.correlationId,
      timestamp: Date.now(),
      ...command.options,
    }
    const channel = this.getChannel()

    const route = resolveQueueRoute(queue)

    switch (route.kind) {
      case QueueRouteKind.DIRECT:
        await channel.sendToQueue(
          command.options?.replyTo ?? route.queue,
          content,
          options,
        )
        return
      case QueueRouteKind.EXCHANGE:
        await channel.publish(
          route.exchange,
          route.routingKey,
          content,
          options,
        )
        return
      default:
        return assertNever(route)
    }
  }

  async request(
    queue: WorkerQueue.USER_VERIFICATION,
    envelope: MessageEnvelope<
      UserExistenceRequest,
      MessageType.USERS_EXISTS_REQUEST
    >,
    timeoutMs: number,
  ): Promise<unknown> {
    await this.ensureReplyConsumer()
    const replyQueue = this.replyQueue

    if (replyQueue === undefined) {
      throw new Error('RabbitMQ reply queue is not initialized')
    }

    return new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingReplies.delete(envelope.messageId)
        reject(
          new MessageProcessingError(
            'RabbitMQ request timed out',
            true,
            RabbitErrorCode.REQUEST_TIMEOUT,
          ),
        )
      }, timeoutMs)
      this.pendingReplies.set(envelope.messageId, { resolve, reject, timeout })

      void this.sendToQueue({
        queue,
        payload: envelope,
        options: {
          correlationId: envelope.messageId,
          replyTo: replyQueue,
        },
      }).catch((error: unknown) => {
        clearTimeout(timeout)
        this.pendingReplies.delete(envelope.messageId)
        reject(
          new MessageProcessingError(
            error instanceof Error ? error.message : 'RabbitMQ publish failed',
            true,
            RabbitErrorCode.BROKER_UNAVAILABLE,
          ),
        )
      })
    })
  }

  async reply(
    correlationId: string,
    replyTo: string,
    message: MessageEnvelope<
      UserExistenceResponse,
      MessageType.USERS_EXISTS_RESPONSE
    >,
  ): Promise<void> {
    await this.sendToQueue({
      queue: WorkerQueue.RPC_REPLY,
      payload: message,
      options: { correlationId, replyTo },
    })
  }

  async consume(
    queue: ConsumerQueue,
    prefetch: number,
    handler: MessageHandler,
  ): Promise<void> {
    await this.getChannel().addSetup(async (channel: Channel) => {
      await channel.prefetch(prefetch)
      await channel.consume(
        queue,
        (message: ConsumeMessage | null) => {
          void this.processDelivery(message, handler)
        },
        { noAck: false },
      )
    })
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
      channel.assertQueue(WorkerQueue.NOTIFICATION_RETRY_ONE, {
        durable: true,
        deadLetterExchange: ExchangeName.EVENTS,
        deadLetterRoutingKey: RoutingKey.TASK_COMPLETED,
        messageTtl: 1_000,
      }),
      channel.assertQueue(WorkerQueue.NOTIFICATION_RETRY_TWO, {
        durable: true,
        deadLetterExchange: ExchangeName.EVENTS,
        deadLetterRoutingKey: RoutingKey.TASK_COMPLETED,
        messageTtl: 5_000,
      }),
      channel.assertQueue(WorkerQueue.NOTIFICATION_RETRY_THREE, {
        durable: true,
        deadLetterExchange: ExchangeName.EVENTS,
        deadLetterRoutingKey: RoutingKey.TASK_COMPLETED,
        messageTtl: 15_000,
      }),
      channel.assertQueue(WorkerQueue.NOTIFICATION_DEAD, { durable: true }),
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
        WorkerQueue.NOTIFICATION_RETRY_ONE,
        ExchangeName.RETRY,
        RoutingKey.NOTIFICATION_RETRY_ONE,
      ),
      channel.bindQueue(
        WorkerQueue.NOTIFICATION_RETRY_TWO,
        ExchangeName.RETRY,
        RoutingKey.NOTIFICATION_RETRY_TWO,
      ),
      channel.bindQueue(
        WorkerQueue.NOTIFICATION_RETRY_THREE,
        ExchangeName.RETRY,
        RoutingKey.NOTIFICATION_RETRY_THREE,
      ),
      channel.bindQueue(
        WorkerQueue.NOTIFICATION_DEAD,
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

  private async ensureReplyConsumer(): Promise<void> {
    if (this.replyConsumerReady) {
      return
    }

    if (this.replyConsumerSetup !== undefined) {
      return this.replyConsumerSetup
    }

    this.replyConsumerSetup = this.getChannel()
      .assertQueue('', { exclusive: true, autoDelete: true })
      .then(async ({ queue }) => {
        this.replyQueue = queue
        await this.getChannel().consume(
          queue,
          (message) => this.receiveReply(message),
          { noAck: true },
        )
        this.replyConsumerReady = true
      })
      .finally(() => {
        this.replyConsumerSetup = undefined
      })
    return this.replyConsumerSetup
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
      const retryable =
        !(error instanceof MessageProcessingError) || error.retryable
      const errorCode =
        error instanceof MessageProcessingError
          ? error.code
          : RabbitErrorCode.UNEXPECTED_MESSAGE_FAILURE
      const errorType = error instanceof Error ? error.name : 'UnknownError'
      const attemptValue: unknown = get(
        message.properties.headers,
        'x-message-attempt',
      )
      const convertedAttempt = isNumber(attemptValue)
        ? attemptValue
        : toNumber(attemptValue)
      const attempt = isFinite(convertedAttempt) ? convertedAttempt : 0

      if (retryable && attempt < MAX_NOTIFICATION_ATTEMPTS) {
        const retryQueue = this.retryQueue(attempt + 1)
        await this.sendToQueue({
          queue: retryQueue,
          payload: message.content,
          options: {
            headers: { 'x-message-attempt': attempt + 1 },
            messageId: message.properties.messageId,
            correlationId: message.properties.correlationId,
          },
        })
        this.logger.warn(
          `RabbitMQ message scheduled for retry correlationId=${message.properties.correlationId} operation=consume-message outcome=retry errorCode=${errorCode} errorType=${errorType} attempt=${attempt + 1}`,
        )
      } else {
        await this.sendToQueue({
          queue: WorkerQueue.NOTIFICATION_DEAD,
          payload: message.content,
          options: {
            headers: { 'x-message-error-code': errorCode },
            messageId: message.properties.messageId,
            correlationId: message.properties.correlationId,
          },
        })
        this.logger.error(
          `RabbitMQ message dead-lettered correlationId=${message.properties.correlationId} operation=consume-message outcome=dead-lettered errorCode=${errorCode} errorType=${errorType} attempt=${attempt}`,
        )
      }

      channel.ack(message)
    }
  }

  private retryQueue(
    attempt: number,
  ):
    | WorkerQueue.NOTIFICATION_RETRY_ONE
    | WorkerQueue.NOTIFICATION_RETRY_TWO
    | WorkerQueue.NOTIFICATION_RETRY_THREE {
    switch (attempt) {
      case 1:
        return WorkerQueue.NOTIFICATION_RETRY_ONE
      case 2:
        return WorkerQueue.NOTIFICATION_RETRY_TWO
      case 3:
        return WorkerQueue.NOTIFICATION_RETRY_THREE
      default:
        throw new Error(`Unsupported notification retry attempt=${attempt}`)
    }
  }

  private encodePayload(payload: QueueSendCommand['payload']): Buffer {
    const content = Buffer.isBuffer(payload)
      ? payload
      : Buffer.from(JSON.stringify(payload))

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
