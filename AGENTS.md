# TaskFlow Repository Instructions

## 1. Purpose and authority

This repository implements **TaskFlow**, the three-service NestJS assessment described in `Backend_Developer_Live_Task.pdf`.

Apply requirements in this order:

1. The user's current request.
2. This `AGENTS.md`.
3. `Backend_Developer_Live_Task.pdf`.
4. Healthy conventions observed in the read-only reference project at `/Users/shivam.limbachiya/Desktop/Personal/vehicle-selling-platform`.
5. Official, version-appropriate NestJS, TypeORM, RabbitMQ, Pino, PostgreSQL, and Node.js documentation.

The reference project controls recognizable coding style and feature organization, not correctness. Copy its healthy conventions, including feature-focused modules, thin controllers, constructor injection, DTO folders and DTO barrels, entity folders, single quotes, two-space indentation, trailing commas, and no semicolons. Do not copy defects such as weak typing, mutable DTOs, hard-coded ports, inconsistent naming, success responses for errors, unsafe authentication behavior, or missing tests.

Before implementing a feature, inspect the relevant PDF requirement and the analogous reference-project files. Do not modify the reference project.

## 2. Non-negotiable outcome

Build a production-minded NestJS monorepo with exactly these business services:

- **User Service**: users, credentials, access/refresh JWTs, refresh sessions, user queries, and user-existence verification.
- **Task Service**: task CRUD, assignment verification, status transitions, RBAC, and task-completed publication.
- **Notification Service**: task-completed consumption, persisted notifications, and the authenticated notification API.

Use:

- a supported Node.js LTS release;
- NestJS and TypeScript;
- PostgreSQL through TypeORM;
- explicit TypeORM migrations with `synchronize: false` in every environment;
- RabbitMQ for inter-service request/reply and asynchronous events;
- JWT authentication with access and refresh tokens delivered in cookies;
- global Pino logging in every HTTP and worker process;
- Lodash as the mandatory collection, object, and string utility library;
- class-validator/class-transformer DTO validation;
- Swagger/OpenAPI for every HTTP service;
- Jest tests;
- Docker containers for infrastructure.

Do not replace RabbitMQ with an in-process event emitter, direct service imports, or HTTP calls. Do not replace TypeORM. Do not collapse the services into one application.

## 3. Target monorepo structure

Use Nest CLI monorepo mode and keep deployable processes under `apps/`. Put deliberately shared infrastructure outside the services under focused `libs/`; do not create a miscellaneous dumping ground.

```text
.
├── apps/
│   ├── user-service/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── worker.ts
│   │   │   ├── app.module.ts
│   │   │   ├── auth/
│   │   │   └── users/
│   │   └── test/
│   ├── task-service/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   └── tasks/
│   │   └── test/
│   └── notification-service/
│       ├── src/
│       │   ├── main.ts
│       │   ├── worker.ts
│       │   ├── app.module.ts
│       │   └── notifications/
│       └── test/
├── libs/
│   ├── auth/                 # Shared access-token extraction/verification and RBAC primitives
│   ├── common/               # Bounded HTTP errors, pagination, request context, and response contracts
│   ├── config/               # Typed, validated configuration
│   ├── contracts/            # RabbitMQ message envelopes and payload contracts
│   ├── database/
│   │   ├── src/entities/
│   │   │   ├── user-service/
│   │   │   ├── task-service/
│   │   │   └── notification-service/
│   │   ├── src/migrations/
│   │   │   ├── user-service/
│   │   │   ├── task-service/
│   │   │   └── notification-service/
│   │   └── src/data-sources/
│   ├── logger/               # Global Pino setup and string-only story logger
│   └── rabbitmq/             # Connection, publisher, RPC client/server, worker bootstrap, and topology
├── docs/
│   ├── plans/                # Feature and cross-cutting implementation plans
│   └── contracts/            # HTTP, RabbitMQ, auth, error, and data-ownership contracts
├── docker/
├── docker-compose.yml
├── .env.example
└── README.md
```

This is a target shape, not permission to create empty ceremonial folders. Add a folder when its owned behavior is implemented. Feature modules remain cohesive: controller, service/use case, DTOs, and service-specific adapters stay near the feature. Shared TypeORM entities and migrations remain outside `apps/` as explicitly required, but each service may import only its own persistence exports.

### 3.1 CLI-generated scaffolding only - non-negotiable

All NestJS source structure must originate from the installed Nest CLI and its schematics. Do not manually create a Nest app, library, feature folder, module, controller, service/provider, resolver, gateway, guard, pipe, interceptor, filter, middleware, decorator, DTO class, entity class, or test scaffold with `mkdir`, `touch`, shell redirection, `apply_patch`, an editor's new-file action, or copied boilerplate.

- Scaffold the workspace with the version-compatible Nest CLI command and strict TypeScript mode.
- Generate every deployable app under `apps/` with the Nest application schematic.
- Generate every shared package under `libs/` with the Nest library schematic.
- Generate modules, controllers, services/providers, guards, pipes, interceptors, filters, middleware, decorators, resources, DTO classes, entity classes, and their parent folders with the closest supported Nest schematic.
- Use the generator's project/path/type options so files land in the intended monorepo app or library. Do not generate elsewhere and manually copy the result into place.
- Run the supported `--dry-run` form first for any new app, library, resource, or multi-file feature. Inspect all planned files and module-registration edits before running the real command.
- Inspect the installed Nest CLI and schematic help/schema before choosing flags. Do not copy commands from rolling documentation without confirming that the installed version supports them.
- Let generators create their normal test scaffolds for controllers, services, guards, filters, and other behavior-bearing providers. Do not routinely suppress specs to save time.
- Generated code is only the starting point. After successful generation, edit the generated files to implement the repository architecture, typing, logging, security, and testing rules.
- Never allow a generator to overwrite an existing file or unrelated user change. Resolve collisions before generation.
- Record the exact successful scaffold commands in a `Scaffolding commands` section of `README.md` so the project structure is reproducible and reviewable.
- If the required Nest schematic is unavailable, incompatible, or fails, stop and report the blocker. Do not fall back to manual source-file or source-folder creation.

TypeORM migrations are the only framework-tool exception because Nest CLI does not provide a TypeORM migration schematic:

- Generate migrations exclusively through the repository's TypeORM CLI npm scripts using the service-specific `DataSource` (`migration-generate` for schema-derived changes or `migration-create` only when an intentional data/custom-SQL migration is required).
- Never create a migration file or timestamped migration folder manually.
- Run the TypeORM migration command only after the corresponding Nest-generated entity class has been implemented.
- Review and, when necessary, safely edit the generated migration SQL/TypeScript after generation; preserve its generated identity and record the command in the README.
- If TypeORM generation fails, fix the configuration or stop and report the blocker. Do not hand-write a replacement migration.

Non-Nest repository artifacts that have no Nest schematic, such as `README.md`, `.env.example`, Dockerfiles, Docker Compose, CI configuration, and documentation, may be created with the repository editing tools. Their folders must be created only when the artifact is required; this exception does not apply to Nest source code or migrations.

## 4. Architecture and dependency rules

- Organize code by business capability, not global `controllers/` and `services/` buckets.
- Controllers and RabbitMQ handlers are adapters. They validate/extract transport data, call one application operation, and map the result.
- Application services/use cases coordinate business behavior. Do not pass Express requests, responses, TypeORM query builders, or RabbitMQ messages into core policy code.
- Infrastructure adapters own TypeORM, RabbitMQ, Pino, hashing, and JWT library details.
- Use Nest constructor injection for collaborators. Do not instantiate services, repositories, clients, loggers, or configuration readers inside business methods.
- Use class providers for stable local implementations. Use exported `Symbol` tokens plus consumer-owned interfaces for cross-boundary or volatile dependencies.
- Do not add an interface for every class. Add a port when it isolates a service boundary, external system, meaningful test seam, or real alternate implementation.
- Keep providers private by default. Export only a feature's intentional application API or port.
- Do not use `ModuleRef` as a service locator. Avoid `forwardRef()`; repair ownership or introduce a narrow port/event instead.
- Prefer composition over inheritance. Do not create generic base CRUD services or generic repositories that erase feature rules.
- Use default singleton provider scope unless a verified lifecycle requirement demands otherwise. Never store request-specific mutable state in a singleton.
- Keep the dependency graph acyclic. Shared libraries must never import from `apps/`.
- Do not introduce CQRS, sagas, or additional services unless a concrete requirement justifies the operational cost.

## 5. Service and endpoint contracts

### 5.1 User Service

Implement:

- `POST /users/register`: register `name`, `email`, `password`, and `role` (`ADMIN` or `MEMBER`).
- `POST /users/login`: validate credentials, create access and refresh sessions, and set both JWT cookies.
- `POST /users/refresh`: validate/rotate the refresh session and set fresh cookies.
- `GET /users/{id}`: JWT protected; return a safe user projection.
- `GET /users`: JWT protected and paginated.
- RabbitMQ request/reply handler for user-existence verification by ID.

Rules:

- Use Argon2, matching the reference project's healthy hashing choice, unless a verified platform constraint requires bcrypt.
- Email uniqueness is enforced by both application handling and a database constraint.
- Never return password hashes, refresh-token hashes, secrets, or internal session fields.
- Access JWT claims include `sub`/`userId`, `email`, and `role`, plus configured issuer, audience, issued-at, and expiry.
- Refresh JWTs are longer lived, rotation-aware, and backed by a hashed server-side refresh session/token record. Never persist a raw refresh token.
- A public caller selecting `ADMIN` is required by the assessment contract. Document in the README that production systems would normally restrict admin creation.

### 5.2 Task Service

Implement:

- `POST /tasks`: JWT protected; verify `assignedUserId` through RabbitMQ before insertion.
- `GET /tasks`: JWT protected; paginated and filterable by `status` and `assignedUserId`.
- `GET /tasks/{id}`: JWT protected.
- `PATCH /tasks/{id}/status`: JWT protected; allow `TODO`, `IN_PROGRESS`, or `DONE`.
- `PATCH /tasks/{id}/assign`: JWT plus `ADMIN` role.
- `DELETE /tasks/{id}`: JWT plus `ADMIN` role.

Rules:

- A `MEMBER` attempting reassignment or deletion receives `403`.
- Validate the assigned user before opening a database transaction and before inserting the task. Never hold a database transaction open while waiting on RabbitMQ.
- A confirmed missing user maps to `400`. A user-service timeout or broker outage maps to an availability error such as `503`/`504`, not a false `400`.
- A failed verification creates no task row.
- Only a real transition into `DONE` emits `task.completed`; repeated `DONE -> DONE` requests must not publish duplicates.
- Persist the status change and an outbox record in one local transaction. Publish from the outbox with bounded retries, then mark the outbox record published. Do not claim exactly-once delivery.
- Event payloads contain identifiers and required immutable facts, not ORM entities.

### 5.3 Notification Service

Implement:

- A RabbitMQ worker that consumes `task.completed` events.
- `GET /notifications`: JWT protected; return only the logged-in user's notifications, paginated newest-first.

Rules:

- Store `userId`, `message`, `createdAt`, and `isRead`, plus an internal unique source `messageId`/`eventId` for idempotency.
- The consumer is idempotent. Duplicate deliveries do not create duplicate notifications.
- Acknowledge a message only after the notification transaction commits or a duplicate is safely recognized.
- Never trust a user ID supplied in the notification query; derive it from the verified principal.

## 6. Authentication, cookies, and RBAC

- The User Service signs tokens. All HTTP services verify access tokens using the same validated issuer/audience/key contract.
- Read access and refresh JWTs from named cookies, not authorization headers, for the implemented browser contract.
- Default cookie names are descriptive, such as `taskflow_access_token` and `taskflow_refresh_token`, and are configurable.
- Cookies are `HttpOnly`; use `Secure` in production; set explicit `SameSite`, domain, path, and max-age values.
- Scope the refresh cookie to the refresh endpoint when compatible with the deployment. Keep the access cookie available to all protected API paths.
- Configure CORS with an explicit origin allow-list and `credentials: true`; never combine credentialed CORS with a wildcard origin.
- If deployment requires `SameSite=None` or cross-site cookies, implement CSRF protection and strict origin checks. Cookie-based JWT does not remove CSRF risk.
- Authentication establishes a typed principal. Authorization is enforced by a reusable roles decorator/guard and, where resource ownership matters, inside the application operation.
- Sensitive routes deny by default when identity or role metadata is unavailable.
- Swagger uses cookie authentication documentation and accurately marks public/protected endpoints.
- Never log cookies, JWTs, authorization data, passwords, password hashes, refresh-token hashes, secrets, or raw request bodies.

## 7. Global Pino story logging - non-negotiable

Pino is the single global logger for every HTTP app, RabbitMQ listener, worker, migration command, and graceful-shutdown path. Bootstrap Nest with buffered logs and replace Nest's default logger with the shared Pino logger.

Application logging is **string-first and story-like**:

- Call logging methods with a complete string message.
- Do not use object-first application logs such as `logger.info({ taskId, queue }, 'published')`.
- Do not dump arbitrary objects, DTOs, entities, messages, request bodies, responses, or errors.
- Pino may add its standard timestamp, level, service, process, and correlation fields internally, but the application-owned `msg` must remain a readable string.
- Every line must make sense in isolation and state what has just started, succeeded, been skipped, or failed.
- Include only safe identifying values in stable `key=value` fragments.

Required shape:

```text
<timestamp> <level> <service/component> <story message> correlationId=<id> operation=<name> key=value
```

Good examples:

```typescript
this.logger.info(
  `Task creation started correlationId=${correlationId} operation=create-task assignedUserId=${assignedUserId}`,
)

this.logger.info(
  `User verification request published correlationId=${correlationId} operation=verify-assignee messageId=${messageId} queue=${queue} assignedUserId=${assignedUserId}`,
)

this.logger.info(
  `Task completed event acknowledged correlationId=${correlationId} operation=store-notification messageId=${messageId} taskId=${taskId} userId=${userId}`,
)
```

Forbidden examples:

```typescript
this.logger.info({ taskId, userId }, 'Task created')
this.logger.debug(JSON.stringify(dto))
this.logger.info(`Login cookie=${accessToken}`)
```

For each important operation, log useful milestones without duplicating the same fact at every layer:

1. operation received/started;
2. validation or authorization outcome when diagnostically useful;
3. external/RabbitMQ call started;
4. external/RabbitMQ call completed, timed out, or failed;
5. persistence or transaction committed;
6. event published, retried, acknowledged, rejected, or dead-lettered;
7. operation completed or failed with safe error category.

Additional logging rules:

- Generate or accept an `x-correlation-id` for HTTP requests and return it in the response.
- Propagate `correlationId` and `messageId` through RabbitMQ envelopes and all related logs.
- Include `service`, `component`, `operation`, and `outcome` through logger context or the message.
- Log an exception once at the boundary that owns the complete diagnostic context. Avoid repeated stack traces in controller, service, repository, and filter.
- Development output may use `pino-pretty` to show timestamp, level, context, and message. Production output goes to stdout/stderr and must preserve the same readable `msg`.
- Error logs include the safe error type/code and identifiers. Stack traces are allowed for unexpected server errors but must be redacted and must never expose secrets.
- Health checks must not flood normal request logs.

## 8. RabbitMQ and worker model - non-negotiable

All broker concerns live in `libs/rabbitmq`; payload types live in `libs/contracts`.

### 8.1 Message contract

Every command, request/reply message, and event uses an explicit envelope containing at least:

- `messageId`;
- `correlationId`;
- `messageType`/routing key;
- `producer`;
- `occurredAt`;
- typed `payload`.

Validate incoming envelopes and payloads before invoking business code. Never publish an ORM entity, exception object, cookie, or JWT.

Use semantic names and central constants for exchanges and routing keys. Queue names are supplied explicitly through environment variables for worker processes.

### 8.2 Required flows

- Task Service -> User Service: RabbitMQ request/reply for `assignedUserId` existence, with a configured timeout and correlation ID.
- Task Service -> Notification Service: durable asynchronous `task.completed` event.
- Notification Service: idempotent consumer and manual acknowledgement.

Use durable exchanges/queues, persistent messages, explicit prefetch, bounded payload size, publisher confirms where supported, and dead-letter/retry topology. Classify retryable and terminal failures. Never create an unbounded immediate requeue loop.

### 8.3 One queue per worker process

The reusable worker bootstrap may be shared, but a running worker process must consume **exactly one queue**:

- Require `WORKER_QUEUE` at startup.
- Validate `WORKER_QUEUE` against an explicit allow-list of handlers owned by that service.
- Register only the one selected handler/consumer.
- Fail startup for a missing, empty, unknown, or multi-queue value.
- Do not use wildcard subscriptions and do not start every consumer in one general worker.
- Configure one Docker Compose worker service/replica per queue, each with its own `WORKER_QUEUE`.
- Configure queue-specific concurrency and prefetch with bounded environment values.

At minimum, run a User Service verification worker for its RPC queue and a Notification Service worker for its task-completed queue. If the outbox publisher is a separate process, keep its lifecycle explicit; it is not a catch-all queue consumer.

On shutdown, stop intake, drain or safely requeue in-flight work, flush bounded logs, and close RabbitMQ and database connections.

## 9. PostgreSQL and TypeORM

- Use the existing Dockerized PostgreSQL exposed on port `5432`, username `root`, password `password`, through environment variables. Never hard-code these values in application source.
- Keep `.env` ignored and provide a complete `.env.example` with safe local-development defaults/placeholders.
- One physical PostgreSQL instance is acceptable, but each service owns its write model. Prefer separate PostgreSQL schemas (`users`, `tasks`, `notifications`) or otherwise clearly separated service-owned tables and migration streams.
- No service may write another service's tables or import another service's entity exports.
- Do not define cross-service TypeORM relations or foreign keys. For example, `tasks.assignedUserId` is a scalar external reference validated through the User Service.
- Keep service-specific entities and migrations in the shared top-level database library as shown in the target tree, with narrow exports.
- Maintain a separate TypeORM `DataSource` and migration command for each service/schema.
- `synchronize` is always `false`. Do not use schema sync as a substitute for migrations.
- Review generated migrations. Give migrations descriptive names and keep `up`/`down` behavior honest.
- Use database constraints for critical invariants, including unique email and notification source message IDs.
- Add justified indexes for email, task status/assignee, notification user/creation ordering, refresh session lookup, and outbox polling.
- Keep transactions local and short. Never perform RabbitMQ or other remote I/O while database locks are held.
- Use a transaction where multiple local writes form one invariant, including refresh rotation, task status plus outbox, and notification plus deduplication where applicable.
- Map database conflicts and missing records into stable application errors; do not leak driver errors.
- Never return TypeORM entities directly from public controllers or messages. Return explicit response DTOs/projections.

## 10. Validation, API, and errors

- Configure a global `ValidationPipe` in every HTTP application with transformation, whitelist enforcement, and rejection of unknown fields. Validate nested DTOs explicitly.
- Validate path/query parameters with typed pipes or DTOs. Bound page, page size, strings, and message payloads.
- Use shared pagination contracts with sensible defaults and a hard maximum page size.
- Keep DTOs separate from entities and do not mutate incoming DTOs.
- Use enum validation for roles and task status.
- Use a global exception filter in every HTTP service for one consistent, non-sensitive error response.
- Public errors contain a stable code, HTTP status, message, timestamp, path, and correlation ID. Validation errors may include bounded field details.
- Map expected not-found, conflict, validation, authentication, authorization, timeout, dependency, and unknown failures deliberately.
- Do not return `{ responseType: 'success' }` for failed operations.
- Unknown errors return a generic `500` response and are logged once with diagnostic context.
- Configure Swagger for every HTTP service, including DTO schemas, pagination/filter query parameters, cookie auth, status responses, and examples.
- Keep controllers thin and use Nest guards, decorators, pipes, interceptors, and filters only for their intended lifecycle responsibilities.

## 11. Code style and naming

Match the reference project's recognizable formatting:

- TypeScript files use single quotes, two spaces, no semicolons, and trailing commas.
- Use kebab-case file/folder names and PascalCase classes.
- Use `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.entity.ts`, `*.dto.ts`, `*.guard.ts`, `*.strategy.ts`, and `*.filter.ts` suffixes consistently.
- Keep one primary exported class per file.
- DTO folders may expose a focused `index.ts` barrel, matching the reference project. Avoid broad barrels that create cycles or hide ownership.
- Prefer descriptive domain names over abbreviations. Correct spelling is mandatory in public names, logs, database columns, and contracts.
- Use strict TypeScript settings. Do not copy the reference project's disabled strictness.
- Avoid `any`, non-null assertions, unchecked casts, magic strings, and boolean flags with unclear meaning.
- Add explicit return types to public service/port methods when they clarify a contract.
- Keep functions cohesive and readable. Do not optimize for arbitrary line counts.
- Comments explain intent, constraints, or trade-offs, not self-explanatory syntax.

### 11.1 Mandatory enums and strong type safety

- Use named **string enums** for every closed set of business or operational values that is stored, transported, validated, switched on, or compared. At minimum this applies to `UserRole`, `TaskStatus`, message/event types, outbox status, and the allow-listed worker queue identifiers.
- Never compare closed values with raw string literals. Use `user.role === UserRole.ADMIN` and `task.status === TaskStatus.DONE`; do not use `user.role === 'ADMIN'` or `task.status === 'DONE'`.
- Define each enum once in the narrowest owning library or feature. Put cross-service wire enums in `libs/contracts`; keep service-internal enums with their owning feature. Do not duplicate equivalent enums in multiple services.
- Use explicit string values so database and message contracts remain readable and stable. Do not use numeric enums or depend on enum ordinal order.
- Use the same enum end to end: DTOs use `@IsEnum(TheEnum)`, application inputs and entities use the enum type, TypeORM enum columns declare the same enum, guards compare enum members, and tests construct values from enum members.
- Treat HTTP, environment, database, and RabbitMQ input as `unknown` until boundary validation proves it is a valid enum member. Never force external strings into an enum with `as`, `as unknown as`, or `any`.
- Do not use enums for open-ended values such as IDs, email addresses, correlation IDs, timestamps, arbitrary queue names, or user-provided text.
- Use exhaustive `switch` handling for business enums. An unhandled member must fail compilation through a shared `assertNever(value: never)` helper or an equivalent exhaustive check.
- Adding, renaming, or removing a persisted or published enum member is a contract and migration change. Update DTOs, TypeORM migrations, RabbitMQ contracts, Swagger, tests, and compatibility notes together.
- Enable strict compiler options, including `strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, and `forceConsistentCasingInFileNames`, unless a verified toolchain limitation is documented.

Required comparison style:

```typescript
export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

const canDeleteTask = principal.role === UserRole.ADMIN
const hasJustCompleted = previousStatus !== TaskStatus.DONE
  && nextStatus === TaskStatus.DONE
```

### 11.2 Colon-free commands and application strings - non-negotiable

Do not use the colon character as a separator in any application-owned command name, script name, identifier string, or human-authored runtime string. Use `kebab-case` with `-` by default or `snake_case` with `_` where the surrounding convention requires it.

- Npm script names and repository command aliases must use hyphens or underscores. Use `start-user-dev`, `test-e2e`, and `migration-generate-user`; never use colon-separated variants.
- RabbitMQ exchange names, queue names, routing keys, command names, event/message types, dead-letter names, and worker identifiers must not contain a colon. Use forms such as `task-completed` or `task_completed`.
- Enum string values, DI string tokens, cache keys, idempotency-key prefixes, operation names, job names, metric names, error codes, audit-event names, and configuration namespace strings must not contain a colon.
- Human-authored log messages, validation messages, exception messages, notification text, and test descriptions must not introduce colon-based labels or separators. Use words, `key=value`, hyphens, or underscores instead.
- Do not build compound values by concatenating a colon separator. Use a hyphenated template such as `` `${service}-${operation}` `` or a typed object when a protocol supports structured fields.
- Prefer constants or enums for repeated strings and test the public wire value. Do not hide colon creation inside helper functions.
- Package scripts, documentation commands, Docker Compose commands, and CI command aliases must follow the same rule.
- Add an automated repository check that fails when package-script keys or application-owned command, contract, queue, routing-key, enum-value, operation, error-code, or message catalogs contain a colon.

The only exceptions are syntax or externally mandated protocol values that the application cannot rename without becoming invalid or incompatible:

- TypeScript type annotations, object literals, conditional syntax, and other required language punctuation;
- JSON/YAML mappings and other required configuration-file syntax;
- URL schemes, host/port notation, IPv6, ISO timestamps, Docker image tags/digests, SQL/database syntax, and third-party values whose specification requires a colon;
- Nest/Express route-parameter separator syntax only when the installed framework version requires it for the mandated endpoint contract. Documentation and Swagger paths use the colon-free `{id}` form.

These exceptions apply only to required syntax or external interoperability. They do not permit colon-separated application naming. When an officially supported equivalent without a colon exists, use the colon-free form.

### 11.3 Lodash-only utility operations and no regular expressions - non-negotiable

Use the official `lodash` npm package and its compatible `@types/lodash` development package for application collection, object, value, and string utility operations. Do not reimplement functionality that Lodash provides with handwritten plain JavaScript or TypeScript.

- Use Lodash helpers for mapping, filtering, finding, grouping, indexing, ordering, deduplication, chunking, flattening, compacting, partitioning, aggregation, object selection, object omission, object transformation, safe cloning, deep equality, emptiness/nil checks, string casing, trimming, escaping, numeric conversion, clamping, debouncing, and throttling.
- Do not use manual `for`, `for-in`, `for-of`, `while`, or `do-while` loops for collection or object processing.
- Do not use native array transformation and search methods such as `map`, `filter`, `reduce`, `find`, `findIndex`, `some`, `every`, `sort`, `flat`, or `flatMap` when Lodash provides the operation.
- Do not use `Object.keys`, `Object.values`, `Object.entries`, `Object.assign`, JSON serialization cloning, repeated object-spread transformations, or handwritten recursive traversal when a typed Lodash helper provides the operation.
- Do not create local generic helpers that duplicate Lodash behavior. Delete duplicate helpers in favor of the direct Lodash function.
- Import only the required Lodash functions through the module form supported by the installed TypeScript and Node.js configuration. Do not inject Lodash through Nest DI and do not use a mutable global `_` object.
- Preserve strict typing. Use generic parameters or a small domain-specific typed wrapper when Lodash inference is insufficient. Never add `any`, unsafe casts, or dynamic string-path access merely to make a Lodash call compile.
- Prefer direct typed property access over dynamic `get` or `set` paths when the property is known at compile time. Lodash is required for utility operations, not for weakening the type system.
- Keep business decisions in named domain/application methods. Lodash may implement a local transformation, but it must not hide authorization, transactions, I/O, retries, message acknowledgement, or state transitions inside a clever chain.
- Avoid unnecessary `cloneDeep`, `merge`, or chained pipelines. Select the smallest Lodash helper whose semantics match the operation and verify mutation, ordering, equality, and duplicate behavior.
- Promise coordination, direct typed property access, arithmetic, enum comparison, framework calls, TypeORM query-builder calls, RabbitMQ client calls, cryptographic APIs, and explicit domain-method calls are not utility replacements and may use their native or framework APIs.

Application-authored regular expressions are forbidden:

- Do not add regex literals, `RegExp` construction, regex strings, or helpers that dynamically assemble a regex.
- Use class-validator decorators, Lodash string helpers, explicit parsers, enums, allow-lists, or maintained protocol-specific libraries instead.
- Use glob support provided by tooling only where the tool owns and parses the glob; do not convert globs into application regex.
- Prefer Jest `testMatch` globs over a configured regex pattern.
- If a mandatory external protocol cannot be implemented or validated without a regular expression and no maintained parser/library exists, stop and report the blocker. Do not silently add a regex exception.

Enforce this policy with ESLint restrictions or a typed AST repository check covering application code and tests. The check must reject prohibited loop statements, native utility calls, regex literals/construction, and duplicate generic utility helpers. Generated third-party code and installed dependencies are outside the scan; Nest-generated source and TypeORM migrations remain inside it.

### 11.4 No application versioning - non-negotiable assessment scope

This is a focused assessment project. Implement one current API and one current message contract. Do not add application-level versioning, future-version scaffolding, or compatibility layers.

- Do not place version markers in API prefixes, controller paths, Swagger paths, route names, query parameters, headers, or media types.
- Do not enable Nest API versioning and do not use version decorators.
- Do not place numeric version markers in app names, library names, folders, filenames, class/interface/type names, DTO names, provider tokens, enums, environment variables, configuration namespaces, database schemas/tables/columns, cache keys, feature flags, or test descriptions.
- RabbitMQ exchanges, queues, routing keys, commands, events, reply types, dead-letter names, envelopes, and payloads must remain unversioned. Do not add a schema-version field or numeric version suffix.
- Use the exact unversioned event name `task.completed` required by the assessment.
- Do not create parallel legacy/current implementations, adapters, routes, or DTOs for imagined future compatibility.
- When an application contract changes during this assessment, update the single contract, its consumers, Swagger, tests, migrations where applicable, and README together.
- Add an automated repository check that rejects application-owned numeric version markers in names and string values.

Dependency and tooling metadata that the application does not control is exempt, including package semantic versions, lockfile integrity data, Node/Nest/TypeScript toolchain versions, Docker image tags/digests, external protocol values, and TypeORM-generated migration timestamps. These values must never leak into application route or message naming.

## 12. Configuration and secrets

- Centralize configuration in `libs/config` and validate it before any app starts listening or consuming.
- Feature code must not read `process.env` directly. Inject typed configuration.
- Define per-process environment schemas for HTTP apps, queue workers, migrations, and outbox publishers.
- Required values include service name/port, database connection/schema, JWT keys/issuer/audience/expiries/cookie settings, CORS origins, RabbitMQ URL/topology, `WORKER_QUEUE`, concurrency/prefetch, RPC timeout, and log level.
- Fail fast with a clear, non-secret startup error when required configuration is absent or invalid.
- Never commit real secrets. Never print effective secret values during startup.

## 13. Docker and local infrastructure

- PostgreSQL and RabbitMQ must run in Docker. Do not install RabbitMQ or PostgreSQL directly on the host.
- Before creating or pulling infrastructure, inspect existing Docker containers and bound ports.
- Reuse the existing PostgreSQL container on port `5432`; do not delete, recreate, reset, or overwrite it.
- If no usable RabbitMQ container/image exists, pull a pinned stable RabbitMQ management image and run it through Docker Compose. Do not use an unpinned `latest` image.
- Keep infrastructure declarations reproducible in `docker-compose.yml`; do not rely only on ad-hoc `docker run` commands.
- If application containers connect to the existing host-published PostgreSQL port, use environment-specific `DB_HOST` values such as `host.docker.internal`; host-run apps use `localhost`.
- Give RabbitMQ durable named volumes and health checks. Do not bake credentials into an image.
- Use multi-stage, non-root application images with a `.dockerignore` when application Dockerfiles are added.
- One container should run one app or one explicitly selected worker process. Do not use a supervisor to run all services in one container.
- Add health/readiness checks and test graceful `SIGTERM` handling.

## 14. Testing requirements

The PDF minimum of two or three unit tests is a floor, not the target. Test the behavior at risk.

Required coverage includes:

- password hashing and credential failure behavior;
- access/refresh cookie issuance and refresh rotation;
- JWT principal extraction and ADMIN/MEMBER RBAC;
- task creation success, missing assignee, and user-service timeout;
- no task row when verification fails;
- status transition into `DONE`, no event for non-transition/repeated `DONE`, and outbox persistence;
- notification consumer success and duplicate-message idempotency;
- pagination/filter bounds;
- global error shape and secret/log redaction;
- Lodash utility-policy enforcement, including rejection of manual collection operations and application-authored regular expressions;
- worker startup rejection for missing/unknown `WORKER_QUEUE` and proof that only one queue is registered;
- RabbitMQ contract serialization and real adapter behavior where practical;
- TypeORM constraints and migrations against PostgreSQL, not an in-memory substitute.

Use:

- plain unit tests for policies and application operations with small application-owned fakes;
- Nest `TestingModule` tests for DI tokens, guards, filters, and module wiring;
- integration tests for TypeORM/PostgreSQL and RabbitMQ semantics;
- HTTP e2e tests for cookies, validation, auth, RBAC, filters, and Swagger-visible contracts.

Tests must be deterministic. Do not use wall-clock sleeps, live internet, shared production data, or order dependence. Close apps, workers, broker channels, timers, and database pools.

## 15. Documentation and delivery

The top-level `docs/` folder is mandatory and has exactly two primary documentation areas:

- `docs/plans/` contains implementation plans for features, infrastructure, migrations, refactors, and cross-cutting work.
- `docs/contracts/` contains the current unversioned contracts for HTTP APIs, RabbitMQ messages, authentication and cookies, errors, and service data ownership.

Documentation rules:

- Add or update the relevant plan before generating or implementing a feature. Do not begin implementation from an undocumented design.
- Use Markdown files with descriptive kebab-case names and no application version markers.
- Every plan states the objective, scope, non-goals, owning service, dependencies, Nest CLI generation commands, affected data and migrations, HTTP/RabbitMQ contracts, authentication/RBAC impact, failure behavior, logging story, tests, acceptance criteria, risks, and decisions.
- Keep plans concrete and executable. Do not add speculative future architecture or empty template-only plans.
- Mark completed plan items accurately. Never claim a step or check is complete until it has been performed.
- Contract documents describe observable behavior rather than implementation detail. They include request/input shape, response/output shape, enum values, authentication and authorization, stable errors, timeouts, idempotency, retry and acknowledgement behavior, ownership, and examples where useful.
- Keep all contracts unversioned for this assessment. Update the single current contract and all affected consumers/tests together.
- Never place passwords, tokens, cookies, connection strings, or other secrets in documentation examples.
- Update plans and contracts in the same change as implementation. Stale documentation makes the feature incomplete.
- `docs/README.md` indexes all active plans and contracts. The root README links to this documentation index.
- Contract documentation, Swagger, DTOs, message types, migrations, and executable tests must agree. Resolve drift before considering work complete.

Maintain a useful `README.md` containing:

- architecture overview and service/data ownership;
- a small request/event flow diagram;
- prerequisites and exact setup/run commands;
- Docker-only PostgreSQL/RabbitMQ instructions;
- environment-variable documentation;
- migration commands for each service;
- commands for each HTTP app and each one-queue worker;
- endpoint and Swagger URLs;
- test/lint/build commands;
- RabbitMQ request/reply, event, retry, DLQ, idempotency, and outbox decisions;
- JWT cookie, refresh rotation, CORS, CSRF, and RBAC decisions;
- logging examples and redaction rules;
- known trade-offs, especially public ADMIN registration required by the assessment.

When Git commits are explicitly authorized, commit progressively in small logical units with meaningful messages. Never combine unrelated work, secrets, generated output, or local `.env` files in a commit. Do not push or create a pull request unless explicitly requested.

## 16. Implementation workflow for Codex

For every feature:

1. Read this file, the relevant PDF section, current manifests/configuration, affected modules, and an analogous reference-project feature.
2. Inspect the installed Nest CLI/TypeORM CLI versions and supported schematics/flags, then record the intended generation commands and run supported dry runs.
3. State the service owner, data owner, public contract, RabbitMQ effects, transaction boundary, failure behavior, security impact, and required logs.
4. Generate every required Nest artifact with the verified Nest CLI command and every migration with the verified TypeORM CLI script. Do not create source scaffolding manually.
5. Implement the smallest complete vertical slice by editing the generated artifacts using the established style.
6. Add or update migrations, configuration validation, Swagger, tests, `.env.example`, README, `docs/plans`, `docs/contracts`, and the scaffold-command record in the same change.
7. Run focused tests first, then formatting/lint, type checking/build, broader tests, migration checks, and relevant container smoke tests.
8. Inspect the complete diff for manually created Nest artifacts or migrations, accidental changes, secrets, object-style logs, missing redaction, colon-separated application commands or strings, application version markers, manual collection/object/string utility logic, regular expressions, raw-string comparisons for closed values, unsafe casts, `synchronize: true`, cross-service entity access, and workers that subscribe to more than one queue.
9. Report generated commands, completed behavior, important decisions, exact checks run, and any remaining limitation. Never claim a command or check passed unless it ran successfully.

Prefer `rg`/`rg --files` for discovery and `apply_patch` only for editing files that already exist or were successfully generated. Never use `apply_patch` to bypass the Nest/TypeORM generation rules. Preserve unrelated user changes. Do not perform destructive Docker, database, filesystem, or Git operations without resolving the exact target and obtaining any required authorization.

## 17. Definition of done

A feature is not complete until all applicable items are true:

- The owning service exposes the documented contract and no other service writes its tables.
- Every Nest app, library, feature artifact, and source folder has reproducible Nest CLI generation provenance; every migration has reproducible TypeORM CLI generation provenance.
- No Nest source artifact, source architecture folder, or migration was manually scaffolded, copied into place, or substituted after a generator failure.
- A current implementation plan exists under `docs/plans`, affected contracts are current under `docs/contracts`, and both are linked from `docs/README.md`.
- DTO validation, safe response projection, auth/RBAC, and global error mapping work through the real boundary.
- TypeORM entities and reviewed migrations exist with `synchronize: false`.
- RabbitMQ contracts are unversioned and stable, correlation is propagated, retries are bounded, and consumers are idempotent.
- Every worker process requires one explicit `WORKER_QUEUE` and registers exactly one queue.
- Closed business values use shared string enums end to end; comparisons contain no raw status, role, message-type, outbox-state, or worker-queue strings.
- Strict TypeScript checks and exhaustive enum handling pass without `any` or unsafe casts.
- Application-owned commands, script names, identifiers, message names, and authored runtime strings contain no colon separators; any remaining colon is required language or external protocol syntax.
- Collection, object, value, and string utility operations use typed Lodash helpers with no duplicated plain-JavaScript implementation.
- Application code and tests contain no authored regular expressions, and the automated Lodash utility-policy check passes.
- API paths, Swagger, application identifiers, RabbitMQ contracts, persistence names, configuration, and tests contain no application version markers.
- Pino is global and all application logs are safe, string-first, story-like, timestamped, leveled, and correlated.
- Access and refresh JWTs are delivered in correctly configured `HttpOnly` cookies and are never logged or returned in ordinary response bodies.
- Focused unit/integration/e2e tests pass.
- Lint, formatting check, type checking/build, and migration checks pass.
- Dockerized infrastructure and graceful startup/shutdown are smoke-tested where relevant.
- Swagger, `.env.example`, and README match the implemented behavior.
