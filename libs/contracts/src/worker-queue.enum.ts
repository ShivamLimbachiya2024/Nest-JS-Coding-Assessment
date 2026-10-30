export enum WorkerQueue {
  USER_VERIFICATION = 'taskflow-user-verification',
  NOTIFICATION_TASK_COMPLETED = 'taskflow-notification-task-completed',
  RPC_REPLY = 'taskflow-rpc-replies',
  NOTIFICATION_RETRY_ONE = 'taskflow-notification-retry-one',
  NOTIFICATION_RETRY_TWO = 'taskflow-notification-retry-two',
  NOTIFICATION_RETRY_THREE = 'taskflow-notification-retry-three',
  NOTIFICATION_DEAD = 'taskflow-notification-dead',
}

export type ConsumerQueue =
  WorkerQueue.USER_VERIFICATION | WorkerQueue.NOTIFICATION_TASK_COMPLETED
