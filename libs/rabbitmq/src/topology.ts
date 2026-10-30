import { WorkerQueue } from 'contracts'
import type {
  MessageEnvelope,
  MessageType,
  TaskCompleted,
  UserExistenceRequest,
  UserExistenceResponse,
} from 'contracts'
import type { Options } from 'amqplib'

export enum ExchangeName {
  RPC = 'rpc',
  EVENTS = 'events',
  RETRY = 'retry',
  DEAD_LETTER = 'dead-letter',
}

export enum RoutingKey {
  USERS_EXISTS_REQUEST = 'users-exists-request',
  TASK_COMPLETED = 'task-completed',
  NOTIFICATION_RETRY_ONE = 'notification-retry-one',
  NOTIFICATION_RETRY_TWO = 'notification-retry-two',
  NOTIFICATION_RETRY_THREE = 'notification-retry-three',
  NOTIFICATION_DEAD = 'notification-dead',
}

export enum QueueRouteKind {
  DIRECT = 'direct',
  EXCHANGE = 'exchange',
}

export type QueueRoute =
  | {
      readonly kind: QueueRouteKind.DIRECT
      readonly queue: WorkerQueue.RPC_REPLY
    }
  | {
      readonly kind: QueueRouteKind.EXCHANGE
      readonly exchange: ExchangeName
      readonly routingKey: RoutingKey
    }

export enum RabbitErrorCode {
  BROKER_UNAVAILABLE = 'BROKER_UNAVAILABLE',
  MESSAGE_INVALID_JSON = 'MESSAGE_INVALID_JSON',
  MESSAGE_TOO_LARGE = 'MESSAGE_TOO_LARGE',
  MESSAGE_CONTRACT_INVALID = 'MESSAGE_CONTRACT_INVALID',
  NOTIFICATION_PERSISTENCE_FAILED = 'NOTIFICATION_PERSISTENCE_FAILED',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  UNEXPECTED_MESSAGE_FAILURE = 'UNEXPECTED_MESSAGE_FAILURE',
}

export interface QueuePayloadMap {
  [WorkerQueue.USER_VERIFICATION]: MessageEnvelope<
    UserExistenceRequest,
    MessageType.USERS_EXISTS_REQUEST
  >
  [WorkerQueue.NOTIFICATION_TASK_COMPLETED]: MessageEnvelope<
    TaskCompleted,
    MessageType.TASK_COMPLETED
  >
  [WorkerQueue.RPC_REPLY]: MessageEnvelope<
    UserExistenceResponse,
    MessageType.USERS_EXISTS_RESPONSE
  >
  [WorkerQueue.NOTIFICATION_RETRY_ONE]: Buffer
  [WorkerQueue.NOTIFICATION_RETRY_TWO]: Buffer
  [WorkerQueue.NOTIFICATION_RETRY_THREE]: Buffer
  [WorkerQueue.NOTIFICATION_DEAD]: Buffer
}

export interface QueueSendOptions {
  readonly headers?: Options.Publish['headers']
  readonly messageId?: string
  readonly correlationId?: string
  readonly replyTo?: string
}

export type QueueSendCommand = {
  [Queue in WorkerQueue]: {
    readonly queue: Queue
    readonly payload: QueuePayloadMap[Queue]
    readonly options?: QueueSendOptions
  }
}[WorkerQueue]

export function assertNever(value: never): never {
  throw new Error(`Unsupported queue destination value=${value}`)
}

export function resolveQueueRoute(queue: WorkerQueue): QueueRoute {
  switch (queue) {
    case WorkerQueue.USER_VERIFICATION:
      return {
        kind: QueueRouteKind.EXCHANGE,
        exchange: ExchangeName.RPC,
        routingKey: RoutingKey.USERS_EXISTS_REQUEST,
      }
    case WorkerQueue.NOTIFICATION_TASK_COMPLETED:
      return {
        kind: QueueRouteKind.EXCHANGE,
        exchange: ExchangeName.EVENTS,
        routingKey: RoutingKey.TASK_COMPLETED,
      }
    case WorkerQueue.RPC_REPLY:
      return { kind: QueueRouteKind.DIRECT, queue }
    case WorkerQueue.NOTIFICATION_RETRY_ONE:
      return {
        kind: QueueRouteKind.EXCHANGE,
        exchange: ExchangeName.RETRY,
        routingKey: RoutingKey.NOTIFICATION_RETRY_ONE,
      }
    case WorkerQueue.NOTIFICATION_RETRY_TWO:
      return {
        kind: QueueRouteKind.EXCHANGE,
        exchange: ExchangeName.RETRY,
        routingKey: RoutingKey.NOTIFICATION_RETRY_TWO,
      }
    case WorkerQueue.NOTIFICATION_RETRY_THREE:
      return {
        kind: QueueRouteKind.EXCHANGE,
        exchange: ExchangeName.RETRY,
        routingKey: RoutingKey.NOTIFICATION_RETRY_THREE,
      }
    case WorkerQueue.NOTIFICATION_DEAD:
      return {
        kind: QueueRouteKind.EXCHANGE,
        exchange: ExchangeName.DEAD_LETTER,
        routingKey: RoutingKey.NOTIFICATION_DEAD,
      }
    default:
      return assertNever(queue)
  }
}

export const MAX_MESSAGE_BYTES = 65_536
export const MAX_NOTIFICATION_ATTEMPTS = 3
