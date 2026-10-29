# RabbitMQ messages

Every message envelope contains `messageId`, `correlationId`, `messageType`, `producer`, `occurredAt`, and typed `payload`. Contracts are unversioned and reject unknown envelope fields and invalid payloads.

## User verification

Task Service publishes `users-exists-request` with `{ userId }` and receives `users-exists-response` with `{ userId, exists }`. The default deadline is 1500 milliseconds. Missing users are normal confirmed replies; timeout and broker/worker unavailability are distinct failures.

## Task completion

Task Service publishes `task-completed` with task ID, assigned user ID, task title, and completion time from a persisted outbox record. Notification Service stores the envelope message ID as its unique idempotency source.

## Delivery

Exchanges and queues are durable, messages are persistent, payloads and prefetch are bounded, publication uses confirms, and consumers acknowledge manually. Transient notification failures use three fixed-delay retry queues. Invalid or exhausted messages go to a durable dead-letter queue. A retry/dead-letter publication is confirmed before the original is acknowledged.

Each worker requires one explicit allow-listed `WORKER_QUEUE`, registers only that handler, and rejects missing, unknown, empty, comma-separated, or multi-queue values.
