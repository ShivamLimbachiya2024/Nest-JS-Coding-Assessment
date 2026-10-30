# TaskFlow implementation roadmap

## Objective

Deliver the three required NestJS services with independently runnable HTTP and worker processes, service-owned PostgreSQL schemas, RabbitMQ request and event flows, cookie JWT authentication, durable task completion delivery, and deterministic verification.

## Scope and ownership

User Service owns users, credentials, refresh sessions, token issuance, user queries, and the user-existence RPC handler. Task Service owns tasks, assignment checks, status transitions, RBAC, and the transactional outbox. Notification Service owns task-completion consumption and user-scoped notifications. Shared libraries own only deliberate infrastructure and wire contracts.

## Dependencies and order

1. [Foundation and infrastructure](./taskflow-foundation-and-infrastructure.md)
2. [User Service and authentication](./user-service-and-authentication.md)
3. [Task Service and outbox](./task-service-and-outbox.md)
4. [Notification Service and consumer](./notification-service-and-consumer.md)
5. [Verification and delivery](./taskflow-verification-and-delivery.md)

The shared platform precedes feature wiring. User verification must exist before Task Service integration. The completion contract and task outbox precede Notification Service consumption.

## Cross-cutting decisions

- Node 24 LTS, NestJS 12, TypeScript strict mode, npm, Express, PostgreSQL 16, TypeORM, RabbitMQ, Pino, Argon2, Lodash, and Jest.
- Three service-owned schemas in one `taskflow` database, separate data sources and migration streams, and `synchronize` disabled.
- Access and refresh JWTs are delivered only in configurable `HttpOnly` cookies.
- RabbitMQ provides user request/reply and durable task-completed delivery. Cross-service HTTP calls and shared database writes are forbidden.
- At-least-once publication with a transactional outbox and idempotent consumer is claimed. Exactly-once delivery is not claimed.
- Public ADMIN registration is retained only because the assessment requires it.

## Acceptance criteria

Every endpoint, message flow, migration, worker queue restriction, error mapping, logging story, Swagger contract, and test described in the phase plans is implemented and the verification plan reports only commands actually run.

## Completion state

- [x] Assessment and reference conventions inspected
- [x] Architecture and public contracts documented
- [x] Foundation implemented and verified
- [x] User Service implemented and verified
- [x] Task Service implemented and verified
- [x] Notification Service implemented and verified
- [x] Full delivery verification completed

The full verification report and the checks exercised are recorded in [verification and delivery](./taskflow-verification-and-delivery.md). Docker app images built and all six Compose processes reached running state while the three HTTP readiness endpoints returned `ready`.
