# HTTP APIs

All IDs are UUIDs, timestamps are UTC ISO strings, protected routes authenticate through the access cookie, and every response returns `x-correlation-id`.

## User Service

- `POST /users/register` accepts `name`, `email`, `password`, and `role`; returns `201` with a safe user projection.
- `POST /users/login` accepts email and password; returns `200` with a safe session summary and sets access/refresh cookies.
- `POST /users/refresh` rotates the refresh session and sets new cookies.
- `PATCH /users/password` requires the access cookie and current password, changes the hash, revokes refresh sessions, and clears both auth cookies.
- `GET /users/{id}` returns a safe user projection to an authenticated caller.
- `GET /users` returns bounded pagination to an authenticated caller.

## Task Service

- `POST /tasks` accepts title, optional description, and assigned user ID after remote verification.
- `GET /tasks` supports page, page size, status, and assigned user ID filters.
- `GET /tasks/{id}` returns a task projection.
- `PATCH /tasks/{id}/status` accepts `TODO`, `IN_PROGRESS`, or `DONE`.
- `PATCH /tasks/{id}/assign` is ADMIN-only and verifies the new assignee.
- `DELETE /tasks/{id}` is ADMIN-only and returns `204`.

## Notification Service

- `GET /notifications` returns only the authenticated user's notifications newest first. Ownership never comes from query input.

Swagger documents all DTOs, cookies, status codes, pagination, filters, and stable error responses.
