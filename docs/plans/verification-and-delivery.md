# TaskFlow verification and delivery

## Objective

Prove the repository contracts through layered automated checks and realistic PostgreSQL, RabbitMQ, HTTP, container, and shutdown smoke tests.

## Verification order

1. Focused unit and module tests.
2. Formatting, ESLint, strict type checks, and all-app builds.
3. Empty test-database central migration up, down, and re-up checks for all schemas.
4. RabbitMQ contract, retry, dead-letter, duplicate, reconnect, and queue-selection tests.
5. HTTP end-to-end tests for cookies, validation, auth, RBAC, pagination, filtering, Swagger, stable errors, and redaction.
6. Full register/login, create, complete, outbox publish, notification consume, and notification-query flow.
7. Docker readiness and graceful termination during representative HTTP and worker activity.
8. Complete diff and automated policy inspection.

## Delivery and configuration

`docker compose up -d` starts PostgreSQL and RabbitMQ. The `application` profile adds the six Nest CLI watch processes. The current development image is a single-stage, non-root Node 24 image with the repository bind-mounted for watch mode.

## Risks and completion rule

External infrastructure may be unavailable or occupied. Such checks are reported as blocked rather than silently skipped. No check is marked complete until its command succeeds, and no commit, push, deployment, database reset, or destructive container action is performed without explicit authorization.

## Completion state

- [x] Static checks, 37 unit tests, six app builds, and 12 health/readiness e2e checks pass
- [x] Central migration is recorded in the configured database without resetting existing service data
- [x] Host-run registration, login, refresh rotation/reuse, task creation/completion, outbox publication, and notification listing flow passes
- [x] HTTP RBAC smoke check confirms MEMBER assignment/deletion are denied and ADMIN assignment/deletion succeed
- [x] Live Swagger documents expose route schemas, pagination/filter parameters, and expected response codes
- [x] Docker image builds complete for all six application processes
- [ ] Full Compose application startup is not verified while host processes occupy API ports 3001, 3002, and 3003
- [ ] Auth/RBAC/filtering/validation Swagger e2e matrix and retry/DLQ/reconnect fault injection remain unverified
- [ ] Graceful SIGTERM during in-flight HTTP and worker operations remains unverified

Verified on 2026-10-30 with Node 24.22.2: the central migration ran, reverted, and ran again against a disposable database containing all three schemas; it was then registered against the existing database without modifying its data. A subsequent central migration run reports no pending changes. Host-run HTTP checks verified registration 201, login/refresh 200, rotated refresh tokens with reuse rejected as 401, task creation 201, task status DONE, a listed completion notification, and a PUBLISHED outbox row. RBAC checks verified MEMBER assignment/deletion return 403 while ADMIN assignment/deletion return 200/204. Live Swagger JSON includes route schemas, pagination/filter parameters, and the documented login/register response codes. Temporary smoke-test rows were deleted by exact synthetic email. Repository policy, formatting, lint, strict type checking, 37 unit tests, all six builds, and 12 e2e checks for healthy and unavailable readiness states pass.

The host-run flow was the business behavior check. The current e2e tests exercise health and readiness endpoints only. Compose-hosted API readiness, graceful SIGTERM during active work, broker reconnect/retry/DLQ fault injection, and broad authenticated HTTP e2e matrices remain unverified and are not represented as passing checks.
