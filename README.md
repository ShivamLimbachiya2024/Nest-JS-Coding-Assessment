# TaskFlow

TaskFlow is a NestJS monorepo with three independently deployable business services. The User Service owns accounts and refresh sessions, the Task Service owns tasks and a transactional event outbox, and the Notification Service owns delivered notifications. PostgreSQL stores each service's data in its own schema. RabbitMQ handles user-existence request/reply and durable task-completion events.

## Requirements

- Node.js 24 and npm 10 or newer
- Docker Desktop or another Docker Engine with Compose
- The existing PostgreSQL instance on port 5432, or the optional `clean-host` Compose profile

RabbitMQ runs in Docker. On this workstation the PostgreSQL container named `postgres-db` is reused; the TaskFlow Compose file does not start or replace it by default. The application containers connect to the host PostgreSQL instance through `host.docker.internal`.

## Quick start

```sh
nvm use
npm ci
cp .env.example .env
```

Set distinct random values of at least 32 characters for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in `.env`. Then start RabbitMQ and create the TaskFlow database if it does not exist:

```sh
docker compose up -d rabbitmq
docker exec postgres-db psql -U root -d postgres -c "CREATE DATABASE taskflow"
```

The database command is only needed once. If `taskflow` already exists, PostgreSQL reports that and leaves it unchanged. Apply each service migration explicitly:

```sh
npm run migration-run-user
npm run migration-run-task
npm run migration-run-notification
```

Build and run all six processes in separate terminals:

```sh
npm run build
npm run start-user
npm run start-user-worker
npm run start-task
npm run start-task-outbox
npm run start-notification
npm run start-notification-worker
```

The HTTP APIs listen on ports 3001, 3002, and 3003. Swagger is at `/docs` for each API. Liveness and readiness endpoints are `/health/live` and `/health/ready`. `WORKER_QUEUE` must contain the one queue assigned to the worker process; `.env.example` shows the User Service queue, and the Notification worker uses `taskflow-notification-task-completed`.

For containerized application processes, put valid secrets and connection values in `.env`, then run:

```sh
docker compose up --build
```

The optional Compose PostgreSQL service is only for a clean host and is not enabled by default. Do not enable it alongside the existing `postgres-db` on port 5432.

## Service flow

Register or log in through User Service. Login sets `taskflow_access_token` and `taskflow_refresh_token` as HttpOnly cookies. Use the access cookie with Task and Notification APIs. Task creation verifies the assignee over RabbitMQ before writing. A real status transition into `DONE` stores a completion event in the Task Service outbox in the same database transaction; the outbox process publishes it with publisher confirmation. The Notification worker validates and stores the event idempotently before acknowledging it. Notification listing scopes results to the authenticated principal.

Public registration permits either `ADMIN` or `MEMBER` because the assessment contract requires it. A production product would restrict administrator provisioning. Delivery is at least once; unique source-message handling prevents duplicate notification rows, and exactly-once delivery is not claimed.

## Architecture and operations

- `apps/` contains three HTTP apps, two one-queue workers, and the separate Task outbox publisher.
- `libs/` contains shared contracts and infrastructure. No shared library imports an app, and each service imports only its own persistence exports.
- TypeORM synchronization and automatic migration execution are disabled. Each service has a separate data source, schema, and migration history.
- RabbitMQ topology and payload validation live in `libs/rabbitmq` and `libs/contracts`. Retry queues are bounded and terminal failures reach a dead-letter queue.
- Pino emits safe string-first operation stories. Correlation IDs are returned in `x-correlation-id` and propagated in message envelopes.
- CORS uses the explicit `CORS_ORIGINS` list. State-changing cookie-authenticated requests require an allowed `Origin`; `SameSite=None` is not configured.

See the [implementation plans](./docs/plans/README.md) and [API/message contracts](./docs/contracts/README.md) for detailed behavior and acceptance status.

## Checks

```sh
npm run verify
npm run test-e2e
```

The e2e suite uses the configured local PostgreSQL and RabbitMQ services. The architecture policy check enforces service ownership, no automatic synchronization, no object-first story logging, and colon-free npm script names.

GitHub Actions runs the policy, format, lint, strict type, unit, migration up/down/re-up, HTTP readiness e2e, production dependency audit, all-process build, and container image build checks on pushes and pull requests.

## Scaffolding commands

The workspace and source artifacts were produced with Nest CLI 12.0.11 and its Nest schematics. These commands document the application and library generation shape; application and library project names are `user-service`, `task-service`, `notification-service`, `auth`, `common`, `config`, `contracts`, `database`, `logger`, and `rabbitmq`.

```sh
export TASKFLOW_SCAFFOLD_DIR="$(mktemp -d)"
npx --yes --package=node@24 --package=@nestjs/cli@12.0.11 nest new user-service --directory "$TASKFLOW_SCAFFOLD_DIR" --package-manager npm --strict --skip-git --no-observe
cd "$TASKFLOW_SCAFFOLD_DIR"
npx nest generate app task-service
npx nest generate app notification-service
npx nest generate library auth --prefix @taskflow
npx nest generate library common --prefix @taskflow
npx nest generate library config --prefix @taskflow
npx nest generate library contracts --prefix @taskflow
npx nest generate library database --prefix @taskflow
npx nest generate library logger --prefix @taskflow
npx nest generate library rabbitmq --prefix @taskflow
```

Feature modules, controllers, services, DTOs, guards, middleware, interceptors, filters, decorators, entities, workers, and the outbox entry point were generated with their corresponding Nest CLI schematics. TypeORM migrations are generated and run only through the service-specific npm scripts above. The exact migration generation commands are:

```sh
npm run migration-generate-user
npm run migration-generate-task
npm run migration-generate-notification
```
