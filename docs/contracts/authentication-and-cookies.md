# Authentication and cookies

User Service signs separate HS256 access and refresh JWTs. All HTTP services receive the access verification secret; only User Service receives the refresh secret.

Access claims contain subject/user ID, email, role, JWT ID, access token type, issuer, audience, issued-at, and expiry. Refresh claims contain subject, session ID, family ID, JWT ID, refresh token type, issuer, audience, issued-at, and expiry.

Default cookie names are `access_token` and `refresh_token`. Both are `HttpOnly`, `SameSite=Lax`, production-secure, and use explicit path/domain/max-age settings. Access uses `/`; refresh uses `/users/refresh`. Cookies and tokens never appear in ordinary response bodies or logs.

Credentialed CORS requires an explicit origin allow-list. State-changing requests enforce known origins. Configuration rejects `SameSite=None` because a CSRF token flow is outside this assessment.

`UserRole` contains `ADMIN` and `MEMBER`. Authentication establishes a typed principal. ADMIN metadata and the roles guard protect task reassignment/deletion and deny when identity or role metadata is absent.

An authenticated user changes their password through `PATCH /users/password` by providing the current and new password. The service verifies the current password, hashes the replacement, and updates the password plus revokes all active refresh sessions in one database transaction. The API clears both authentication cookies, so the user must log in again. Already-issued access JWTs remain valid until their short expiry.
