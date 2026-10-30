# RabbitMQ messages

Every message envelope contains `version: 1`, `messageId`, `correlationId`, `messageType`, `producer`, `occurredAt`, and a typed `payload`. Contracts reject unsupported versions, unknown envelope fields, and invalid payloads. TypeScript binds each queue destination to its supported payload and message type.

All outbound broker traffic goes through `RabbitmqService.sendToQueue({ queue, payload, options? })`. The `WorkerQueue` enum defines every routable destination. `QueuePayloadMap` accepts a user-existence request envelope only for the verification queue, a task-completed envelope only for the notification queue, a user-existence response only for the direct reply destination, and serialized message bytes for retry and dead-letter relays. `resolveQueueRoute` maps each enum value to its durable exchange and routing key or the private reply route. The request process creates an exclusive auto-delete reply queue and provides its name in `replyTo`, allowing separate worker processes to answer safely. Each send is persistent and publisher-confirmed.

| Queue enum                                                                     | Queue name                    | Message type or payload                              | Broker route                                     |
| ------------------------------------------------------------------------------ | ----------------------------- | ---------------------------------------------------- | ------------------------------------------------ |
| `USER_VERIFICATION`                                                            | `user_verification`           | `USERS_EXISTS_REQUEST` with `UserExistenceRequest`   | RPC exchange and verification routing key        |
| `NOTIFICATION_TASK_COMPLETED`                                                  | `notification_task_completed` | `task.completed` with `TaskCompleted`                | Events exchange and `task.completed` routing key |
| `RPC_REPLY`                                                                    | `rpc_replies`                 | `USERS_EXISTS_RESPONSE` with `UserExistenceResponse` | Request's private exclusive reply queue          |
| `NOTIFICATION_RETRY_ONE`, `NOTIFICATION_RETRY_TWO`, `NOTIFICATION_RETRY_THREE` | `notification_retry_one` etc. | Original serialized message bytes                    | Retry exchange and matching retry routing key    |
| `NOTIFICATION_DEAD`                                                            | `notification_dead`           | Original serialized message bytes                    | Dead-letter exchange and terminal routing key    |

## User verification

Task Service publishes `users-exists-request` with `{ userId }` and receives `users-exists-response` with `{ userId, exists }`. The default deadline is 1500 milliseconds. Missing users are normal confirmed replies; timeout and broker/worker unavailability are distinct failures.

## Task completion

Task Service publishes `task.completed` with task ID, assigned user ID, task title, and completion time from a persisted outbox record. Notification Service stores the envelope message ID as its unique idempotency source.

## Delivery

Exchanges and queues are durable, messages are persistent, payloads and prefetch are bounded, publication uses confirms, and consumers acknowledge manually. Transient notification failures use three fixed-delay retry queues. Invalid or exhausted messages go to a durable dead-letter queue. A retry/dead-letter publication is confirmed before the original is acknowledged.

Each worker requires one explicit allow-listed `WORKER_QUEUE`, registers only that handler, and rejects missing, unknown, empty, comma-separated, or multi-queue values.
