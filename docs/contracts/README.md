# Project Contracts

This folder owns the current unversioned external and cross-service contracts for TaskFlow.

Maintain focused documents for

- User Service HTTP endpoints
- Task Service HTTP endpoints
- Notification Service HTTP endpoints
- JWT access and refresh cookies
- ADMIN and MEMBER authorization
- Global validation and error responses
- RabbitMQ request and reply messages
- The `task.completed` event
- Queue acknowledgement, retry, dead-letter, and idempotency behavior
- PostgreSQL schema and write ownership for each service

Each contract document must define

- Owner and consumers
- Input and output shapes
- Required and optional fields
- Shared string enums
- Authentication and authorization
- Success and failure behavior
- Timeouts, retries, acknowledgement, and idempotency where applicable
- Safe logging and correlation requirements
- Matching Swagger, DTO, message type, migration, and test evidence

Do not add parallel or versioned contracts. Update the single current contract and every affected consumer and test together.

## Current contracts

- [HTTP APIs](./http-apis.md)
- [Authentication and cookies](./authentication-and-cookies.md)
- [Errors and pagination](./errors-and-pagination.md)
- [RabbitMQ messages](./rabbitmq-messages.md)
- [Service data ownership](./service-data-ownership.md)
