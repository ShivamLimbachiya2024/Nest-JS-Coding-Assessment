# TaskFlow verification and delivery

## Objective

Prove the repository contracts through layered automated checks and realistic PostgreSQL, RabbitMQ, HTTP, container, and shutdown smoke tests.

## Verification order

1. Focused unit and module tests.
2. Formatting, ESLint, strict type checks, and all-app builds.
3. Empty test-database migration up, down, and re-up checks for all schemas.
4. RabbitMQ contract, retry, dead-letter, duplicate, reconnect, and queue-selection tests.
5. HTTP end-to-end tests for cookies, validation, auth, RBAC, pagination, filtering, Swagger, stable errors, and redaction.
6. Full register/login, create, complete, outbox publish, notification consume, and notification-query flow.
7. Docker readiness and graceful termination during representative HTTP and worker activity.
8. Complete diff and automated policy inspection.

## Delivery and configuration

Docker Compose runs PostgreSQL infrastructure only in an optional profile on this host and runs RabbitMQ normally. Each HTTP app, each one-queue worker, and the outbox publisher has one process per container. The image is multi-stage, non-root, and based on Node 24.

## Risks and completion rule

External infrastructure may be unavailable or occupied. Such checks are reported as blocked rather than silently skipped. No check is marked complete until its command succeeds, and no commit, push, deployment, database reset, or destructive container action is performed without explicit authorization.

## Completion state

- [x] Static and unit verification complete
- [x] Migration and broker integration complete
- [x] End-to-end flow complete
- [x] Container readiness smoke test complete
- [x] Final repository policy and local secret handling review complete

Verified on 2026-10-30: repository policy, Prettier check, Oxlint, strict TypeScript check, 35 Jest tests, all six Nest builds, all three migration streams up/down/re-up against the existing `taskflow` database, host-run and Compose-run full HTTP/RabbitMQ/PostgreSQL flows, Docker builds for all six runtime processes, Compose startup, and `ready` responses from each HTTP service. In the Compose run, RabbitMQ reported exactly one consumer on each worker queue. The completion notification was queried with the assigned MEMBER's access cookie; the outbox row was `PUBLISHED`. The shared typed `sendToQueue` API is covered for user RPC, task-completed event, RPC reply, retry, and dead-letter destinations.

The host-run full flow was the behavior check. Docker Compose process startup/readiness and image builds were verified separately. Graceful SIGTERM during active work, broker reconnect/retry/DLQ fault injection, and broad authenticated HTTP e2e matrices remain unverified and are not represented as passing checks.
