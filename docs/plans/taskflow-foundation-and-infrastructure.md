# Foundation and infrastructure

## Objective and acceptance

Scaffold a strict Nest CLI monorepo with the three apps and focused shared libraries. Add typed configuration, correlation, string-first Pino logging, global validation and error mapping, shared authentication and RBAC, RabbitMQ adapters, health endpoints, graceful shutdown, Docker infrastructure, and architecture policy checks.

Acceptance requires all apps to compile, invalid configuration to fail before listening, each worker to accept exactly one allow-listed queue, and RabbitMQ/PostgreSQL configuration to remain bounded and explicit.

## Scope, ownership, and non-goals

The platform libraries own reusable transport and runtime mechanics only. Feature policy remains in its service. This phase does not add CQRS, sagas, Redis, Kubernetes, an API gateway, or generic CRUD abstractions.

## Generation commands

Run a dry run before each new app or library. The successful commands are recorded verbatim in the root README. Planned schematics are Nest CLI `new`, `generate app`, `generate library`, and focused module/provider/controller/guard/filter/interceptor/middleware/decorator/class schematics.

## Contracts, failures, and security

Global validation transforms inputs, strips no unknown fields silently, and rejects extras. Stable application errors map once at the HTTP filter. Access JWT verification checks signature, algorithm, issuer, audience, expiry, issued-at, and token type. Correlation IDs are generated or accepted only when valid UUIDs. CORS uses explicit origins and credentials. `SameSite=None` is rejected until CSRF support exists.

## Messaging and lifecycle

Shared envelopes carry message ID, correlation ID, message type, producer, occurrence time, and typed payload. Connections use confirms, bounded payloads, durable topology, manual acknowledgement, and bounded retry/dead-letter behavior. Shutdown stops intake, drains bounded in-flight work, then closes broker, database, and logging resources.

## Logging story

Bootstrap, request start/completion, dependency calls, queue selection, acknowledgement, retries, shutdown, and fatal failures use safe complete-string stories with stable `key=value` fragments. Tokens, cookies, credentials, hashes, raw bodies, DTOs, entities, messages, and arbitrary error objects are never logged.

## Tests and risks

Unit/module tests cover configuration rejection, envelope validation, token verification, roles, error mapping, and queue selection. Architecture checks reject forbidden dependency directions, raw feature environment access, schema synchronization, object-first logs, colon-separated application identifiers, authored regular expressions, and non-Lodash utility implementations.

The main risks are configuration drift and broker recovery ambiguity; typed configuration, startup validation, contract tests, and explicit shutdown ownership mitigate them.

## Completion state

- [ ] CLI workspace generated
- [ ] Shared platform implemented
- [ ] Infrastructure and policy checks verified
