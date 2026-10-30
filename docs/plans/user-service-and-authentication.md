# User Service and authentication

## Objective and acceptance

Implement registration, login, refresh rotation, safe user lookup/listing, access-cookie verification, and the user-existence RabbitMQ worker. Passwords use Argon2. Refresh tokens are stored only as hashes in server-side sessions.

Acceptance requires stable duplicate-email handling, generic credential failures, safe projections, correct cookie attributes, atomic rotation, reuse-family revocation, and validated RPC responses.

## Ownership, data, and migration

User Service owns `users.users` and `users.refresh_sessions`. The user and refresh-session entities originate from Nest class schematics, then TypeORM generates the schema migration through the user data source. Other services never import or write these entities.

## HTTP, auth, and failure behavior

Public registration accepts name, email, password, and `UserRole`. Login creates a refresh family/session and returns only a safe summary while issuing cookies. Refresh validates both JWT and persisted hash, rotates in one local transaction, and revokes the family on reuse. Lookup and pagination require a valid access principal. Missing users map to not-found, duplicates to conflict, and invalid credentials/refresh state to authentication errors without disclosing which check failed.

## RabbitMQ and logging

The worker requires the single user-verification queue. It validates the request envelope and UUID, queries only User Service storage, returns a typed response, and propagates message/correlation IDs. Logs cover receipt, safe validation result, query completion, reply confirmation, and failure classification.

## Tests, risks, and decisions

Tests cover Argon2, normalization, uniqueness, access/refresh claims, cookie flags, rotation, expiry, revocation, reuse, safe projections, pagination, and worker queue enforcement. The public ADMIN choice is documented as an assessment-only security trade-off.

## Completion state

- [x] Source generated through Nest CLI schematics
- [x] Migration generated, reviewed, and exercised through up/down/re-up
- [x] HTTP and RPC behavior verified through the full task creation flow

The HTTP and RPC smoke run registered and logged in ADMIN and MEMBER accounts, issued cookie credentials, and verified the MEMBER as an assignee through the User worker. Automated suite and strict type/build checks passed on 2026-10-30.
