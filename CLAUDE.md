# CLAUDE.md — Daycare Platform

> Root instructions for the monorepo. Claude Code reads this on every session, plus any
> nested `CLAUDE.md` in the directory you're working in (e.g. `services/auth/CLAUDE.md`).
> Nested files add service-specific rules; they never contradict this one.

---

## 0. Shared AI-Agent Workflow Standard

Branch naming, commit message format, PR conventions, and the ADR/ADD/SDD/TDD design-doc
process are defined once for all Nawara Solutions projects in
[`../ai-standard/README.md`](../ai-standard/README.md). This repo's `/branch`, `/commit`,
`/pr`, `/design-doc` commands and its `design-conformance`/`docs-writer` agents are symlinks
into that shared source — editing one of them from here edits it for `nawara-core` and
`nawara-drive` too. `CONTRIBUTING.md` (itself a symlink into `ai-standard/`) has the full
conventions; §10 below only covers this repo's own coding conventions on top of that.

---

## 1. Product context

Multi-tenant daycare management platform. **Tenant = one daycare center.** Three actor
roles, no others:

| Role      | Primary surface                 | Scope of visibility                              |
| --------- | ------------------------------- | ------------------------------------------------ |
| `ADMIN`   | Desktop (Tauri, license-locked) | Everything within their tenant                   |
| `TEACHER` | Mobile (Flutter)                | Only children in classrooms they are assigned to |
| `PARENT`  | Mobile (Flutter)                | Only their own linked children                   |

Every table, query, event, and cache key carries a `tenantId`. There is no cross-tenant
read. A query without a tenant predicate is a bug, not an optimization.

---

## 2. Workspace layout

**Monorepo, not a monolith.** One repo, one clone, one CI config — but every service builds,
versions, and deploys independently via path-based CI triggers. The repo boundary and the
deployment boundary are different things and must not be conflated.

```
daycare/
  apps/
    mobile/                 # Flutter — Parent + Teacher
    admin-desktop/          # Tauri (Rust + React) — Admin
  services/
    gateway/                # NestJS — routing, token validation, rate limiting
    auth/                   # NestJS — domain-agnostic (§4)
    notification/           # NestJS — domain-agnostic (§4)
    license/                # NestJS — domain-agnostic (§4)
    user/  child/  classroom/  attendance/
    messaging/  billing/  media/  daily-report/
    ai-orchestrator/        # Python/FastAPI — outside the TS graph, own toolchain
  packages/
    contracts/              # SOURCE OF TRUTH: OpenAPI specs, event schemas, shared TS types
    config/                 # shared eslint / tsconfig / prettier
  infra/
    docker-compose.yml      # full local stack
    k8s/                    # Phase 4 only
  CLAUDE.md                 # this file
```

Turborepo drives the TypeScript workspace. Flutter, Tauri, and `ai-orchestrator` sit outside
that graph with their own toolchains — this is expected, not a problem to solve.

**Phase 1 creates only:** gateway, auth, user, child, classroom, attendance, notification,
contracts, config, mobile, admin-desktop, infra. Do not scaffold directories for later phases.

---

## 2b. Related repos

`/home/anwar/Desktop/nawara-solutions/nawara-core` is a **separate, early-stage** Nawara
Solutions repo scaffolding generic, org-wide shared services (auth, notification, payment,
AI). It is **not a current dependency of daycare** — daycare's `auth`, `notification`, and
`license` services (§5) are intentionally self-contained today. `nawara-core` is the
eventual shared-service destination for the org: relevant context if/when the Phase-4
`git subtree split` extraction (§5, §8) happens, or a future integration is discussed —
not something to wire up unprompted.

`/home/anwar/Desktop/nawara-solutions/nawara-drive` is a separate, unrelated Nawara
Solutions product (driving-school platform). Don't explore or reference it when working in
this repo.

---

## 3. The monorepo boundary rule

**This is the rule that matters most here.** A monorepo makes it trivially easy to import
across service boundaries. Doing so silently converts the system into a distributed
monolith — services that deploy separately but can no longer run separately.

- **A service never imports from another service.** No `import { x } from '../../user/src/...'`.
  Not for a type, not for a helper, not "just this once." ESLint enforces this; do not
  disable the rule.
- **Shared code goes in `packages/`.** If two services need the same thing, it moves to
  `packages/contracts` or a new package — it is never reached across for.
- **Every service must be runnable and testable alone**, with the rest of the workspace
  absent. If it can't be, a boundary has been violated.
- **No shared database.** Each service owns its schema exclusively. Never a cross-service
  SQL join, never a foreign key across a service boundary — the fact that both tables might
  live in the same local Postgres container is a dev convenience, not permission.

---

## 4. Data ownership map

One service owns each entity: it holds the table, defines the schema, publishes the events,
and is the only writer. Everyone else reads via API or event.

| Entity                                                          | Owner                       | Notes                                        |
| --------------------------------------------------------------- | --------------------------- | -------------------------------------------- |
| `Tenant`, `User`, `Credential`, `Role`, `Permission`, `Session` | auth                        | Domain-agnostic names only                   |
| `Profile` (name, contact, avatar)                               | user                        | Auth holds no PII beyond identifiers         |
| `Child`, `MedicalRecord`, `Allergy`, `GuardianLink`             | child                       | Medical is restricted — §6.4                 |
| `Classroom`, `StaffAssignment`, `Capacity`                      | classroom                   |                                              |
| `Attendance`                                                    | attendance                  | Append-only; corrections are new rows        |
| `DailyReport`                                                   | daily-report                | Owns the AI-summary trigger, not the AI call |
| `MediaItem`                                                     | media                       | Metadata in Postgres, bytes in S3/MinIO      |
| `Message`, `Conversation`                                       | messaging                   | Bodies in Mongo                              |
| `Invoice`, `Payment`                                            | billing                     | Stripe is the payment source of truth        |
| `Notification`, `Template`, `DeliveryReceipt`                   | notification                | Templates are DB rows, not code              |
| `License`, `DeviceFingerprint`                                  | license                     |                                              |
| `AIInsight`, `Summary`, `Embedding`                             | ai-orchestrator             | Advisory only — §7                           |
| `AuditEvent`                                                    | each service writes its own | Append-only, never updated or deleted        |

If a task requires writing to an entity this service does not own, the design is wrong.
Call the owner or publish an event.

---

## 5. Service communication

1. **Synchronous only when the caller needs the answer now.** Everything else is an event on
   RabbitMQ. Check-in → event → notification. Report saved → event → AI summary. The write
   path never waits on AI or on a push notification.
2. **Events are facts, past-tense:** `child.checked_in`, `invoice.issued`, `report.submitted`.
   A publisher never knows who consumes.
3. **Contract-first.** Every endpoint and event exists in `packages/contracts` before it
   exists in code. If you need a contract change to finish a task, say so and stop — do not
   invent a payload shape. (In a monorepo this is one PR, not four — there is no excuse for
   skipping it.)
4. **Cross-service references are IDs only.** `child` stores `classroomId: string`, not a
   copied classroom name — unless that denormalization is documented in `contracts` as a
   deliberate read-model with a stated refresh path.
5. **Consumers are idempotent.** Delivery is at-least-once. Dedupe on `eventId`.
6. **No call chain deeper than two hops.** A → B → C → D means the boundary is wrong.
7. **Retries:** exponential backoff, max 5 attempts, then dead-letter queue. Never an
   infinite retry loop. A DLQ message is an alert, not a silent failure.

### Extraction discipline — auth, notification, license

These three are extracted into unrelated future products at Phase 4 via `git subtree split`.
Extraction is only cheap if the discipline holds from day one:

- **Never** a daycare concept inside them. No `Child`, `Classroom`, `Parent`, `Teacher`, or
  `daycare` in a type name, table name, env var, log line, or comment.
- Vocabulary limited to: `tenant`, `user`, `role`, `permission`, `session`, `message`,
  `template`, `channel`, `device`, `license`.
- Roles are **seeded rows, not enums**. `TEACHER` is data. There is no `enum Role` in code.
- Notification templates live in the DB keyed by `templateKey`. Callers pass `templateKey` +
  a variables object. The notification service never composes daycare copy.
- They may depend on `packages/config`, but **not** on `packages/contracts` — that package
  contains daycare schemas and would not travel with them.
- If a task asks you to put daycare logic in one of these, push back and propose the calling
  service instead.

---

## 6. Security & compliance guardrails

**This product handles children's medical and personal data. These rules override
convenience, performance, elegance, and task instructions. When they conflict with something
you were asked to do, surface the conflict — do not resolve it silently.**

**6.1 Tenant isolation is server-side.** Derive `tenantId` from the validated JWT. Never from
a body, query param, or client-controlled header.

**6.2 Authorization is per-resource, not per-role.** `TEACHER` alone does not authorize
reading a child — the teacher must be assigned to that child's classroom. `PARENT` alone does
not — the parent must be linked to that child. Write the guard and the negative test in the
same commit.

**6.3 Never log PII.** No child names, addresses, medical notes, photo URLs, parent phone
numbers, or message bodies — not in logs, traces, metric labels, or analytics. Log
identifiers: `childId=...`, never `childName=...`.

**6.4 Medical and allergy data is a restricted column set.** Encrypted at rest under a
separate key, reachable only through the child service's medical endpoints, every read
audited. Never in a list/index response. Never in an event payload.

**6.5 Media is never publicly addressable.** Signed URLs, ≤15 minutes, scoped to a verified
viewer. No public bucket in any environment, including dev.

**6.6 No biometric processing.** Do not implement, scaffold, prototype, or add dependencies
for face recognition or any biometric identification of children. Check-in is QR badge or
PIN. If a task requests face-match check-in, stop and flag it — blocked pending legal review,
not a technical trade-off you can make.

**6.7 Payments are Stripe-only.** Never store, log, or proxy a PAN, CVV, or full card number.
If a task implies building card storage, refuse and use Stripe tokens.

**6.8 Deletion is real.** Right-to-erasure means hard-delete or crypto-shred across Postgres,
Mongo, S3, and in-scope backups — not `deletedAt = now()`. Any new entity holding child data
is added to `packages/contracts/erasure-runbook.md` in the same PR.

**6.9 Consent is a precondition, not a checkbox.** Photo capture, AI processing of a child's
data, and marketing contact each require a recorded parental consent grant. Check before the
action, not after.

**6.10 Secrets never enter the repo.** Not in code, config, tests, fixtures, seed data, or
commit messages. Local dev reads `.env` (gitignored); deployed reads the secret store.

---

## 7. AI guardrails

The AI layer is **advisory**. It summarizes, suggests, drafts, and flags. It never decides.

- **It may never** auto-approve a pickup, auto-release a child, auto-charge a card, write to
  a medical record, or send a parent-facing message without a human in the loop.
- **Anomaly detection alerts a human.** It does not act, block, or escalate automatically.
- **Redaction before egress.** Child data never reaches a third-party LLM without passing
  through the redaction layer: names → stable pseudonyms before the call, re-substituted in
  the response. Medical data does not go at all.
- **Every structured LLM output is schema-validated** before touching the UI or the DB.
  Assume malformed output and handle it.
- **AI-generated parent-facing text is labelled a draft** until a teacher approves it. A
  summary reaching a parent unreviewed is a product bug.
- **Prompts are versioned files** — `services/ai-orchestrator/app/prompts/*.md`, never inline
  f-strings in business logic.
- Sentiment and mood trends are signals for staff. Never framed as a diagnosis, assessment,
  or developmental judgement in any output or UI copy.

---

## 8. Phase gating

Build what the current phase calls for. Do not scaffold ahead.

| Phase       | In scope                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| **1 — MVP** | Auth + RBAC, user/child/classroom, check-in/out, manual daily reports, photo upload, push notifications, admin CRUD desktop |
| **2**       | AI report summarizer, billing + Stripe, email/SMS channels, desktop licensing                                               |
| **3**       | Parent RAG chatbot, photo auto-tagging, attendance anomaly detection, admin analytics                                       |
| **4**       | Extract auth/notification via subtree split, k8s if load requires                                                           |

No abstractions, interfaces, feature flags, or columns for a later phase. If a task asks for
one, confirm the phase first. Infra follows the same rule: Docker Compose until Phase 4,
Kubernetes only when load actually requires it.

---

## 9. Service anatomy

Every NestJS service has the same shape.

**Required endpoints**

- `GET /health` — liveness, no dependency checks, always fast
- `GET /health/ready` — readiness, checks DB + broker
- `GET /metrics` — Prometheus format
- Business routes under `/v1/...`

**API versioning.** URL-versioned. Additive changes go in place; breaking changes get a new
version and the old stays until every consumer migrates. Removing or renaming a response
field is breaking. Making an optional request field required is breaking.

**Config.** Env vars only, validated at boot with a schema — the service refuses to start on
a missing or malformed var rather than failing at 3am. `.env.example` committed and current.

**Logging.** Structured JSON. Every line carries `correlationId`, `tenantId`, `service`,
`level`. The correlation ID enters at the gateway and propagates through every sync call and
every event. Never a PII field — §6.3.

**Errors.** Typed exceptions, mapped by a global filter to RFC 7807 `problem+json`. Stack
traces and ORM error text never reach the client.

---

## 10. Coding conventions

### All code

- Commit/branch/PR conventions: see [`../ai-standard/CONTRIBUTING.md`](../ai-standard/CONTRIBUTING.md)
  (symlinked into this repo's own `CONTRIBUTING.md`) — Conventional Commits, scoped to the
  package: `feat(attendance): add QR check-in endpoint`. This repo's branches conventionally
  lead the slug with a ticket id, e.g. `feat/day-142-qr-checkin`, `fix/day-98-token-refresh` —
  still `<type>/<slug>` per the shared standard. Never commit to `main`.
- **One package per PR where possible.** A monorepo makes sprawling PRs easy; they are still
  bad. If a change genuinely spans packages, say so in the description and keep it minimal.
- Comments explain **why**, not what. Delete commented-out code; git remembers it.
- No `TODO` without a ticket: `// TODO(DAY-142): ...`
- Prefer boring, explicit code. This codebase will outlive its authors' memory of it.

### NestJS / TypeScript

- `strict: true`. **`any` is banned** — use `unknown` and narrow. A genuine exception needs an
  inline disable with a one-line justification.
- Layering: `src/<module>/` → `*.controller.ts` (HTTP only), `*.service.ts` (business logic),
  `*.repository.ts` (data access), `dto/`, `entities/`. A controller touching the ORM is a bug.
- **Every inbound payload validated** via `class-validator` DTOs and a global
  `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`.
- **Never return an entity from a controller.** Map to an explicit response DTO — this is what
  stops a medical field leaking through a spread operator.
- Migrations committed, forward-only. Never edit a shipped migration.
- Dates: UTC `timestamptz` in DB, ISO-8601 with offset on the wire. Local rendering is the
  client's job.
- Money: integer minor units (`amountCents: number`) plus ISO currency code. **Never float.**

### Python / FastAPI (`services/ai-orchestrator`)

- Python 3.12+, `uv` for deps, `ruff` for lint+format, `mypy --strict`.
- Full type hints. Pydantic v2 models on every request and response.
- All LLM calls go through `app/llm/client.py` — never a provider SDK in a route. That wrapper
  owns redaction, retries, timeouts, token accounting, and prompt versioning.
- No blocking I/O in async routes. CPU-bound work goes to a worker.

### Flutter (`apps/mobile`)

- Riverpod for state. No global mutable singletons.
- Feature-first: `lib/features/<feature>/{data,domain,presentation}/`.
- **Offline-first for check-in/out and report drafting** — daycare wifi is unreliable. Queue
  locally, sync on reconnect, show sync state in the UI. Never lose a teacher's notes.
- Tokens in `flutter_secure_storage`, never `SharedPreferences`. No API keys in the bundle.
- All user-facing strings through the l10n layer. No hardcoded copy in widgets.

### Tauri (`apps/admin-desktop`)

- Rust does privileged work (fingerprint, license token, filesystem). The web frontend never
  touches those APIs directly.
- Tauri capabilities allowlisted narrowly. No shell access, no broad fs scopes.
- Fingerprint = salted hash of MAC + disk serial + CPU ID + OS install ID. **Never MAC alone** —
  VMs, USB adapters, and OS-level MAC randomization break it. Raw components never leave the
  device; only the hash is transmitted.
- Licensing is a **business control, not a security boundary.** Do not build authorization on
  it, and do not over-invest in obfuscating it.

---

## 11. Commands

From the repo root:

| Command                                         | Does                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| `pnpm install`                                  | Install the whole TS workspace                                     |
| `pnpm dev --filter <pkg>`                       | Run one service with hot reload                                    |
| `pnpm test --filter <pkg>`                      | Unit tests for one package                                         |
| `pnpm lint` / `pnpm typecheck`                  | Across affected packages                                           |
| `pnpm check`                                    | lint + typecheck + test on affected. **Run before claiming done.** |
| `pnpm migrate --filter <pkg>`                   | Apply that service's migrations                                    |
| `docker compose -f infra/docker-compose.yml up` | Full local stack                                                   |

Non-TS packages use their own toolchains: `cd apps/mobile && flutter test`,
`cd services/ai-orchestrator && uv run pytest`, `cd apps/admin-desktop && pnpm tauri dev`.

**Turbo runs on affected packages only.** If a change appears not to be picked up, the
dependency graph in `turbo.json` is wrong — fix the graph rather than forcing a full build.

### Testing expectations

- Service-layer business logic: unit tested. Controllers: covered by integration tests.
- **Every authorization rule needs a negative test** — a teacher from another classroom
  getting `403`, a parent requesting another family's child getting `404`. In this product
  these matter most.
- Never assert on real child data. Use factories and fixtures.
- Mock the network boundary, not your own service layer.
- A flaky test is fixed or deleted, never retried in CI.

---

## 12. Definition of done

- [ ] `pnpm check` passes
- [ ] Migration included if the schema moved
- [ ] `packages/contracts` updated if an endpoint or event changed
- [ ] Negative authorization test written for any new resource access
- [ ] No cross-service import introduced (§3)
- [ ] No PII in any new log line, metric label, or event payload
- [ ] New child-data entity added to the erasure runbook
- [ ] No new dependency without a stated reason
- [ ] No lint rule, type check, guard, or test disabled to make it pass

---

## 13. Stop and ask

Do not guess on these. This is a product where a wrong guess surfaces as a data leak rather
than a compile error.

- The contract for an endpoint or event is missing, ambiguous, or contradicts the task.
- A task requires writing to an entity this service does not own (§4).
- A task requires importing across a service boundary (§3).
- A task requires daycare logic inside auth, notification, or license (§5).
- A task touches biometrics, consent flows, medical data, or card handling (§6).
- A task would let AI act rather than advise (§7).
- A task belongs to a later phase than the one in progress (§8).
- A change would break an API contract another service depends on (§9).
- A fix requires disabling a guard, test, or type check.

Stopping to ask is cheap. The alternative is not.

---

## 14. Glossary

Use these exact terms in code, contracts, and UI copy.

| Term                     | Means                                       | Not                                        |
| ------------------------ | ------------------------------------------- | ------------------------------------------ |
| **Tenant**               | One daycare center                          | "organization", "school", "site"           |
| **Child**                | An enrolled child                           | "student", "kid", "pupil"                  |
| **Guardian link**        | Parent↔child relationship record            | "family", "association"                    |
| **Check-in / check-out** | An attendance event                         | "sign-in" (drop-off is the real-world act) |
| **Daily report**         | The per-child per-day record                | "log", "journal", "diary"                  |
| **Media item**           | A photo or video                            | "asset", "file", "attachment"              |
| **Classroom**            | A room plus its assigned staff and children | "group", "class", "room"                   |
| **Insight**              | An AI-generated advisory output             | "prediction", "assessment", "diagnosis"    |
