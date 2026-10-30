# TaskFlow

TaskFlow is a NestJS monorepo assessment project with three independently deployable business services. User Service owns accounts and refresh sessions, Task Service owns tasks and a transactional event outbox, and Notification Service owns persisted notifications. PostgreSQL stores each service's data in a separate schema. RabbitMQ handles user verification requests and task completion events.

This guide covers a fresh local setup, running the services, and trying the main workflow. It supports Node processes on your machine and Docker containers for the application processes.

## What you need

- Node.js 24 LTS and npm 10 or newer
- Docker Desktop or Docker Engine with Docker Compose, with the Docker daemon running
- Git
- OpenSSL to generate local JWT secrets, or another secure random generator

If you use `nvm`, the repository's `.nvmrc` selects Node.js 24. Without `nvm`, install Node.js 24 LTS and verify `node --version` and `npm --version` before continuing.

## Get the project ready

Clone the repository, enter its directory, install the locked dependencies, and make a local environment file:

```sh
git clone <repository-url>
cd <repository-directory>
nvm use
npm ci
cp .env.example .env
```

If you installed Node.js without `nvm`, skip `nvm use`. Keep `.env` local; Git ignores it. It contains local database and broker settings as well as secrets.

Generate two different secrets:

```sh
openssl rand -hex 32
openssl rand -hex 32
```

Copy the first value into `JWT_ACCESS_SECRET` and the second into `JWT_REFRESH_SECRET` in `.env`. Each must be at least 32 characters. Do not use the example placeholders as secrets. The checked-in `.env.example` contains development-only database and RabbitMQ credentials; change them if you expose these services beyond your machine.

## Start PostgreSQL and RabbitMQ

By default, Docker Compose starts both RabbitMQ and PostgreSQL. PostgreSQL 16 creates the `taskflow` database on first startup and publishes it on port 5432. The local `.env` defaults match this development database.

### Start infrastructure

```sh
docker compose up -d
docker compose ps
```

Wait until both containers show as healthy before continuing. The PostgreSQL service uses a named Docker volume, so its data remains when the containers are stopped.

### Use a PostgreSQL server you already have

To use your own PostgreSQL for host-run application processes, edit the `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, and `DATABASE_NAME` values in `.env` to match your server, and stop the Compose PostgreSQL container with `docker compose stop postgres`.

Create an empty database named `taskflow` once, if it does not already exist. For a PostgreSQL installation with `createdb` available, for example:

```sh
createdb -h localhost -p 5432 -U root taskflow
```

Change the host or user in that command to match your PostgreSQL setup. If the database already exists, do not create it again.

Start RabbitMQ for host-run application processes:

```sh
docker compose up -d rabbitmq
docker compose ps
```

Wait for RabbitMQ to show as healthy. The management UI is available at `http://localhost:15672`; the development username and password are `rabbit` and `rabbitmq-dev-password` unless you changed the Compose configuration.

## Create the service schemas

The first run requires the three explicit TypeORM migrations. Run them from the repository root after PostgreSQL is ready:

```sh
npm run migration-run-user
npm run migration-run-task
npm run migration-run-notification
```

Each command creates its service-owned schema and tables in the `taskflow` database. `synchronize` is disabled; the application does not create or change database tables automatically.

## Run TaskFlow on your machine

Open six terminals in the repository root and start one process in each terminal. You do not need to build first. These scripts invoke `nest start <project> --watch`, so the Nest CLI compiles and restarts the selected HTTP app, worker, or outbox process when its source changes:

| Terminal | Command                                            | Purpose                                                   |
| -------- | -------------------------------------------------- | --------------------------------------------------------- |
| 1        | `npm run start-user`                               | User Service HTTP API                                     |
| 2        | `npm run start-user-verification-worker`           | User Service `user_verification` worker                   |
| 3        | `npm run start-task`                               | Task Service HTTP API                                     |
| 4        | `npm run start-task-outbox`                        | Task completion outbox publisher                          |
| 5        | `npm run start-notification`                       | Notification Service HTTP API                             |
| 6        | `npm run start-notification-task-completed-worker` | Notification Service `notification_task_completed` worker |

Each HTTP service has Swagger documentation and health endpoints:

| Service      | Base URL                | Swagger                      | Readiness                            |
| ------------ | ----------------------- | ---------------------------- | ------------------------------------ |
| User         | `http://localhost:3001` | `http://localhost:3001/docs` | `http://localhost:3001/health/ready` |
| Task         | `http://localhost:3002` | `http://localhost:3002/docs` | `http://localhost:3002/health/ready` |
| Notification | `http://localhost:3003` | `http://localhost:3003/docs` | `http://localhost:3003/health/ready` |

`WORKER_QUEUE` selects the single queue handled by a worker process. Each worker start script supplies its explicit, service-owned queue. Queue names use lower-case underscores, such as `user_verification` and `notification_task_completed`.

The worker scripts select one queue each and start the matching Nest CLI worker project. `npm run build` remains available when you want to compile all six projects, but the documented start commands run in watch mode.

## Docker Compose scope

Docker Compose can run all six application processes in the same Nest CLI watch mode. It mounts the repository source into each app container so edits reload. Start infrastructure alone with `docker compose up -d`, or start infrastructure and all application processes with `docker compose --profile application up --build -d`. The app containers connect to the Compose PostgreSQL service by its service name. The APIs use ports 3001, 3002, and 3003. RabbitMQ uses ports 5672 and 15672.

Stop the Compose containers while preserving their named volumes and data:

```sh
docker compose down
```

## Try the main workflow

Cookie-authenticated state-changing requests require an allowed `Origin`. The local example permits `http://localhost:3000`; include it in calls made with `curl` or another API client.

Register an ADMIN account:

```sh
curl -i http://localhost:3001/users/register \
  -H 'Origin: http://localhost:3000' \
  -H 'Content-Type: application/json' \
  -d '{"name":"TaskFlow Admin","email":"admin@example.test","password":"ChangeThis-Password-123!","role":"ADMIN"}'
```

Copy the returned user `id` into `USER_ID` below, then log in and save the cookies:

```sh
curl -i -c cookies.txt http://localhost:3001/users/login \
  -H 'Origin: http://localhost:3000' \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.test","password":"ChangeThis-Password-123!"}'
```

Create a task assigned to that user's ID. The Task Service checks that the user exists through RabbitMQ before inserting the task:

```sh
USER_ID='paste-user-id-here'
curl -i -b cookies.txt http://localhost:3002/tasks \
  -H 'Origin: http://localhost:3000' \
  -H 'Content-Type: application/json' \
  -d "{\"title\":\"Review TaskFlow\",\"assignedUserId\":\"${USER_ID}\"}"
```

Copy the returned task `id` into `TASK_ID` and transition it to `DONE`:

```sh
TASK_ID='paste-task-id-here'
curl -i -b cookies.txt "http://localhost:3002/tasks/${TASK_ID}/status" \
  -X PATCH \
  -H 'Origin: http://localhost:3000' \
  -H 'Content-Type: application/json' \
  -d '{"status":"DONE"}'
```

The Task Service writes the completion event to its outbox with the status change. The outbox publisher sends the event to RabbitMQ, and the Notification worker stores it. List notifications for the logged-in user:

```sh
curl -b cookies.txt http://localhost:3003/notifications
```

`cookies.txt` contains authentication credentials. Keep it local and delete it when finished.

## Configuration and security notes

- `.env.example` lists all required configuration keys. `.env` is the local working copy and is ignored by Git.
- Use separate `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` values. User Service signs refresh tokens; all three HTTP services verify access tokens.
- Browser clients must use credentialed requests and an origin listed in `CORS_ORIGINS`. The local defaults allow the frontend on port 3000 and same-origin Swagger pages on API ports 3001, 3002, and 3003. Keep the allow-list explicit.
- Public registration accepts `ADMIN` because the assessment requires it. A production system would normally restrict administrator creation.
- Passwords are Argon2-hashed. Refresh tokens are rotated and stored only as hashes. Authentication tokens are sent in HttpOnly cookies.
- RabbitMQ delivery is at least once. Outbox publishing and notification idempotency protect against message loss and duplicates; the system does not claim exactly-once delivery.

## Verify changes locally

Run the repository checks after installing dependencies and starting the required local PostgreSQL and RabbitMQ services:

```sh
npm run verify
npm run test-e2e
```

`npm run verify` runs repository policy checks, formatting, lint, strict TypeScript checking, Jest tests, and builds all six Nest processes. The e2e suite requires the local services described above.

## Architecture and trade-offs

- `apps/` contains the three HTTP applications, the two one-queue workers, and the separate Task outbox publisher.
- `libs/` contains shared contracts and infrastructure. Shared libraries do not import from applications, and each service imports only its own persistence exports.
- TypeORM migrations and data sources are separate for User, Task, and Notification schemas. Automatic migration execution and schema synchronization are disabled.
- RabbitMQ handles both synchronous user-existence request/reply and asynchronous task-completed events. A shared typed `sendToQueue` function routes every outbound message using queue enums and payload types.
- Pino is the application logger. Correlation IDs are returned in `x-correlation-id` and carried through RabbitMQ message envelopes.
- CORS uses an explicit origin allow-list. State-changing requests check the origin; cross-site `SameSite=None` cookies are not enabled because a CSRF token flow is outside this assessment.

See [implementation plans](./docs/plans/README.md) and [API/message contracts](./docs/contracts/README.md) for the detailed design and service contracts.

## Scaffolding reference

The workspace and source artifacts were generated with Nest CLI 12.0.11 and its Nest schematics. These commands document the application and library generation shape; the project names are `user-service`, `task-service`, `notification-service`, `auth`, `common`, `config`, `contracts`, `database`, `logger`, and `rabbitmq`.

```sh
export SCAFFOLD_DIR="$(mktemp -d)"
npx --yes --package=node@24 --package=@nestjs/cli@12.0.11 nest new user-service --directory "$SCAFFOLD_DIR" --package-manager npm --strict --skip-git --no-observe
cd "$SCAFFOLD_DIR"
npx nest generate app task-service
npx nest generate app notification-service
npx nest generate library auth
npx nest generate library common
npx nest generate library config
npx nest generate library contracts
npx nest generate library database
npx nest generate library logger
npx nest generate library rabbitmq
```

Feature modules and providers were generated with their corresponding Nest CLI schematics. TypeORM migrations are generated and run only through the service-specific npm scripts. The migration generation commands are:

```sh
npm run migration-generate-user
npm run migration-generate-task
npm run migration-generate-notification
```
