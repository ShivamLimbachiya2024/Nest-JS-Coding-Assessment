# Service data ownership

One PostgreSQL `taskflow` database contains three separately migrated schemas.

- User Service exclusively writes `users.users` and `users.refresh_sessions`.
- Task Service exclusively writes `tasks.tasks` and `tasks.outbox_messages`.
- Notification Service exclusively writes `notifications.notifications`.

Services use separate TypeORM data sources and migration tables with `synchronize` disabled and automatic migration execution disabled. No cross-service entity import, ORM relation, foreign key, repository use, table write, or database transaction is allowed. Cross-service IDs remain scalar UUIDs and are validated through service contracts.

Critical constraints include unique normalized email, refresh lookup indexes, task status/assignee/listing indexes, unique outbox message ID and polling index, unique notification source message ID, and newest-first user notification index.
