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

- [ ] Static and unit verification complete
- [ ] Migration and broker integration complete
- [ ] End-to-end flow complete
- [ ] Container and shutdown smoke tests complete
- [ ] Final policy and secret scan complete
