# Task Service and outbox

## Objective and acceptance

Implement authenticated task creation, bounded filtering/listing, lookup, status change, ADMIN reassignment/deletion, user verification over RabbitMQ, and reliable `task.completed` publication through a transactional outbox.

Acceptance requires no task row after failed verification, distinct missing-user and unavailable/timeout failures, MEMBER denial for privileged operations, and exactly one outbox message for a real transition into `DONE`.

## Ownership, data, and transaction boundary

Task Service owns `tasks.tasks` and `tasks.outbox_messages`. Assigned user IDs are scalar external references with no cross-service relation. Remote verification completes before any local transaction. Status change and outbox insertion share one short TypeORM transaction. Broker publication never occurs while database locks are held.

## Contracts and reliability

Creation and reassignment issue a bounded user-existence request. A confirmed missing user maps to `400`; timeout to `504`; broker or worker unavailability to `503`. The dedicated outbox process locks a bounded batch with skip-locked semantics, publishes with confirmation, and marks rows published. Five bounded attempts use backoff before failure visibility.

## Auth, logging, and tests

All routes require access-cookie authentication. Roles metadata plus a reusable guard protect assign/delete. Logs cover verification, authorization outcome, commit, outbox creation, publish confirm, retry, exhaustion, and shutdown with safe identifiers only.

Tests cover all role branches, pagination/filter bounds, verification outcomes and no-row guarantees, task transitions, repeated `DONE`, transaction rollback, outbox confirmation/retry/exhaustion, and process shutdown.

## Completion state

- [x] Source generated through Nest CLI schematics
- [x] Migrations generated, reviewed, and exercised through up/down/re-up
- [x] HTTP, RPC, transaction, and outbox behavior verified

The end-to-end smoke run created a task after a confirmed user-existence reply, transitioned it into `DONE`, and observed the outbox row reach `PUBLISHED`. Strict type/build checks and the automated suite passed on 2026-10-30.
