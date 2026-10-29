# Errors and pagination

## Error response

Every HTTP failure returns `code`, numeric `status`, safe `message`, UTC `timestamp`, request `path`, and `correlationId`; bounded field `details` may be included for validation only.

Expected mappings are validation or confirmed missing assignee `400`, authentication `401`, authorization `403`, missing resource `404`, conflict `409`, dependency unavailable `503`, dependency timeout `504`, and unknown `500`. Unknown failures expose a generic message and are logged once at the owning boundary.

## Pagination

Paginated responses contain `data` and `meta`, where metadata contains page, page size, total, and total pages. Page defaults to 1, page size defaults to 20, and page size is capped at 100. Collections are always bounded and deterministically ordered.
