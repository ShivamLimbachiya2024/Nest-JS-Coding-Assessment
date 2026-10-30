# Implementation Plans

Create one focused Markdown plan for each feature, infrastructure change, migration, refactor, or cross-cutting concern before implementation begins.

Use descriptive kebab-case filenames without application version markers. Keep completed plans as an accurate record of the implemented decision.

Every plan must cover

- Objective and acceptance criteria
- Scope and non-goals
- Owning service and affected consumers
- Dependencies and assumptions
- Verified Nest CLI and TypeORM CLI generation commands
- Module and dependency boundaries
- Data ownership, entities, transactions, and migrations
- HTTP and RabbitMQ contract effects
- Authentication and RBAC effects
- Failure, timeout, retry, idempotency, and recovery behavior
- Pino logging story and safe identifiers
- Unit, integration, contract, and end-to-end tests
- Docker and configuration effects
- Risks, trade-offs, and decisions
- Implementation checklist and verified completion state

## Active roadmap

- [TaskFlow implementation roadmap](./implementation-roadmap.md)
- [Foundation and infrastructure](./foundation-and-infrastructure.md)
- [User Service and authentication](./user-service-and-authentication.md)
- [Task Service and outbox](./task-service-and-outbox.md)
- [Notification Service and consumer](./notification-service-and-consumer.md)
- [Verification and delivery](./verification-and-delivery.md)

Plans must describe the smallest complete vertical slice. Do not add speculative future versions or unsupported architecture.
