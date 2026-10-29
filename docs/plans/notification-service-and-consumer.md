# Notification Service and consumer

## Objective and acceptance

Consume task-completed events idempotently and expose authenticated, paginated, newest-first notifications scoped to the verified principal.

Acceptance requires duplicate deliveries to create one row, acknowledgement only after commit or safe duplicate recognition, terminal messages to reach the dead-letter queue, transient failures to use bounded retries, and no cross-user reads.

## Ownership and persistence

Notification Service owns `notifications.notifications`, including a unique source message ID and the user/creation ordering index. The consumer derives a bounded human-readable message from immutable event facts and performs a local transaction before acknowledgement.

## Queue, failures, and recovery

The worker accepts only the notification task-completed queue. Incoming envelopes and payloads are validated before policy code. Transient storage failures publish with confirmation to one of three fixed-delay retry queues before acknowledging the original. Invalid and exhausted messages publish to the durable dead-letter queue. Immediate unbounded requeue is forbidden.

## API, logging, and tests

The list endpoint ignores client ownership claims and uses `principal.userId`. Logs cover receipt, validation, duplicate recognition, commit, acknowledgement, retry, dead-letter, and shutdown using safe identifiers.

Tests cover persistence, duplicate delivery, malformed events, transient retries, exhaustion, acknowledgement ordering, pagination, ordering, principal scoping, and one-queue startup.

## Completion state

- [ ] Source generated through verified schematics
- [ ] Migration generated and reviewed
- [ ] Worker and HTTP behavior verified
