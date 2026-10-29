export enum ExchangeName {
  RPC = 'taskflow-rpc',
  EVENTS = 'taskflow-events',
  RETRY = 'taskflow-retry',
  DEAD_LETTER = 'taskflow-dead-letter',
}

export enum RoutingKey {
  USERS_EXISTS_REQUEST = 'users-exists-request',
  TASK_COMPLETED = 'task-completed',
  NOTIFICATION_RETRY_ONE = 'notification-retry-one',
  NOTIFICATION_RETRY_TWO = 'notification-retry-two',
  NOTIFICATION_RETRY_THREE = 'notification-retry-three',
  NOTIFICATION_DEAD = 'notification-dead',
}

export enum InternalQueue {
  NOTIFICATION_RETRY_ONE = 'taskflow-notification-retry-one',
  NOTIFICATION_RETRY_TWO = 'taskflow-notification-retry-two',
  NOTIFICATION_RETRY_THREE = 'taskflow-notification-retry-three',
  NOTIFICATION_DEAD = 'taskflow-notification-dead',
}

export enum RabbitErrorCode {
  BROKER_UNAVAILABLE = 'BROKER_UNAVAILABLE',
  MESSAGE_INVALID_JSON = 'MESSAGE_INVALID_JSON',
  MESSAGE_TOO_LARGE = 'MESSAGE_TOO_LARGE',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  UNEXPECTED_MESSAGE_FAILURE = 'UNEXPECTED_MESSAGE_FAILURE',
}

export const MAX_MESSAGE_BYTES = 65_536
export const MAX_NOTIFICATION_ATTEMPTS = 3
