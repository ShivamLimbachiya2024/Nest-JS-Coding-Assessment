export enum WorkerQueue {
  USER_VERIFICATION = 'user_verification',
  NOTIFICATION_TASK_COMPLETED = 'notification_task_completed',
  RPC_REPLY = 'rpc_replies',
  NOTIFICATION_RETRY_ONE = 'notification_retry_one',
  NOTIFICATION_RETRY_TWO = 'notification_retry_two',
  NOTIFICATION_RETRY_THREE = 'notification_retry_three',
  NOTIFICATION_DEAD = 'notification_dead',
}

export type ConsumerQueue =
  WorkerQueue.USER_VERIFICATION | WorkerQueue.NOTIFICATION_TASK_COMPLETED
