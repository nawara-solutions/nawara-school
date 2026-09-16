# CLAUDE.md — `services/auth`

> Nested instructions. The root `CLAUDE.md` applies in full; this adds auth-specific rules.
> Where the root says "domain-agnostic," this file says what that means concretely.

## What this service is

Authentication and authorization for the platform — **and for future unrelated products**.
It is the flagship of the extraction discipline (root §5). Every decision here optimizes for
"could this subtree-split into a different product next year and still make sense?"

## What this service is NOT

It does not know what a child, classroom, parent, teacher, daycare, or invoice is. It knows
tenants, users, roles, permissions, sessions, and devices. If you are about to type the word
"child" in this directory, stop.

**Dependency rule:** may depend on `packages/config`. May **not** depend on
`packages/contracts` — that holds daycare schemas and would not travel on extraction. Auth's
own contracts live in `services/auth/contracts/`.

## Stack

- NestJS 10, TypeScript strict
- PostgreSQL, own database `auth_db`, TypeORM, forward-only migrations
- Redis for refresh-token denylist and rate-limit counters
- Argon2id for password hashing — never bcrypt, never SHA-anything

## Domain model

`Tenant`, `User`, `Credential`, `Role`, `Permission`, `RoleAssignment`, `Session`,
`RefreshToken`, `MfaFactor`, `PasswordResetRequest`, `AuditEvent`.

Roles and permissions are **rows, seeded per tenant** — not TypeScript enums. The daycare
tenant seeds `ADMIN`/`TEACHER`/`PARENT`; a different product seeds whatever it needs. Role
names are hardcoded nowhere except `seeds/daycare.seed.ts`, which is the one file that does
not travel on extraction.

## Token rules

- **Access token:** JWT, 15 min, RS256. Claims: `sub`, `tenantId`, `roles`, `sessionId`.
  Nothing else. **No PII in the JWT** — no email, no name. Downstream services fetch profile
  data from the user service.
- **Refresh token:** opaque, 30 days, rotating, single-use. Reuse of a consumed refresh token
  revokes the entire session family and writes an audit event — that is the credential-theft
  signal, and it must never be softened into a warning.
- Public keys at `/.well-known/jwks.json`. Every other service validates locally against
  JWKS. **Never** add a synchronous "validate this token" endpoint for services to call —
  that makes auth a single point of failure for the whole platform.

## Non-negotiables here

- Login, password reset, and MFA endpoints rate-limited per IP **and** per account.
- **No account-existence leaks.** Wrong password, unknown email, and disabled account return
  the same generic failure with the same response timing.
- Password reset tokens: single-use, 30 min, hashed at rest, invalidated by a password change.
- Every auth-relevant action writes an `AuditEvent`: login success/failure, role change, MFA
  enrolment, password change, token-reuse detection. Audit rows are append-only.
- Emitted events (`user.created`, `user.disabled`, `role.assigned`) carry IDs only — never
  email addresses or names.
- Do not add an endpoint returning a list of users with contact details. That belongs to the
  user service, behind its own authorization.

## Local dev

```
pnpm dev --filter auth          # → http://localhost:3001
pnpm seed --filter auth         # seeds the 3 daycare roles + a test admin
```

## Definition of done here

Root checklist, plus: no daycare vocabulary anywhere in `src/`, no dependency on
`packages/contracts`, and a negative authorization test for any new endpoint.
