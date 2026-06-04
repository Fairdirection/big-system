---
description: Security rules and constraints for SalesFlow development
---

# Security Rules

## NEVER do these
- Never log JWT tokens, passwords, or API keys to console or files
- Never store sensitive data in localStorage (tokens are fine; user passwords never)
- Never disable CORS for all origins (`*`) in production config
- Never commit `.env` files — they are gitignored for a reason
- Never use `eval()` or `new Function()` with user input
- Never trust `req.body` without Joi validation — all inputs go through validators
- Never hard-code MongoDB URIs or secrets in source files

## Authentication
- All non-public routes must use the `auth` middleware
- JWT expiry: respect configured TTL — never set to `0` or `infinite`
- On 401: frontend `errorInterceptor` clears auth state and redirects to `/login`
- Cookie flags: `httpOnly: true`, `sameSite: 'strict'` minimum

## Data integrity
- Soft deletes only: set `isActive: false` — never hard-delete business records
- Sale shares must be validated server-side: sum must equal 100%
- Commission payouts: require `Claim` record before generating — no orphan payouts
- Quarterly targets: recalculation must be logged in audit trail

## Input handling
- All user-supplied IDs must be validated as valid MongoDB ObjectIds before DB queries
- Pagination params (page, limit): enforce max limit (100) server-side
- File uploads (avatars): validate MIME type and size server-side

## Audit trail
- All destructive/financial operations should log to `AuditLog` collection
- Log fields: `userId`, `action`, `targetCollection`, `targetId`, `timestamp`, `details`

## Frontend XSS prevention
- Never use `[innerHTML]` with user-supplied content
- Never use `bypassSecurityTrustHtml` unless absolutely necessary and content is sanitized
- Angular's template binding is safe by default — use `{{ }}` and `[property]` bindings
