# Daycare Management App — Full Project Study

## 1. Executive Summary

A multi-actor daycare platform with three roles — **Admin**, **Teachers/Staff**, **Parents** — delivered as a **mobile app** (Android/iOS) and a **desktop app for Admin** (Windows/Mac, license-locked per device). Backend is built as **microservices**, with **Auth** and **Notification** designed from day one as standalone, reusable services you can plug into future products. An **AI layer** sits on top to make the app genuinely smart rather than just "chatbot-branded."

This document covers: roles & features, AI ideas, recommended tech stack, microservices architecture (diagram), data model (class diagram), the MAC-based desktop licensing approach, security/compliance notes, and a phased roadmap.

Two diagrams are attached alongside this report:
- `architecture.mermaid` — microservices architecture
- `class_diagram.mermaid` — core data model

---

## 2. Actors & Roles

### 2.1 Admin (desktop-first, mobile-secondary)
- Manage staff accounts, classrooms, capacity, schedules
- Manage children enrollment, parent linking, medical/allergy records
- Billing: invoices, payment tracking, financial reports
- View analytics dashboards (attendance trends, revenue, staff ratios)
- Manage licenses for desktop installs (activate/revoke per device)
- Global notifications / announcements
- Audit logs, compliance exports

### 2.2 Teacher / Staff (mobile-first)
- Check in / check out children (QR code, manual, or AI-assisted)
- Write daily reports (meals, naps, mood, activities, incidents)
- Upload photos/videos of the day
- Message parents (1:1 or classroom broadcast)
- View own schedule and classroom roster

### 2.3 Parent (mobile-first)
- View child's live status (checked in/out, who dropped off/picked up)
- Read daily reports, photos, videos
- Chat with teacher
- Pay invoices, view billing history
- Receive smart notifications ("pickup reminder," "low on diapers," etc.)
- Ask the AI assistant questions ("How did my child sleep this week?")

---

## 3. Where AI Actually Adds Value

You asked to push AI hard — here's where it's genuinely useful versus where it's just decoration:

| Feature | Value | Notes |
|---|---|---|
| **Daily report auto-summarizer** | High | Teacher jots quick notes/voice memo → AI turns it into a clean parent-facing summary. Saves teacher time daily. |
| **Parent chatbot (RAG-based)** | High | Answers "when was last diaper change," "what's the allergy policy" from the child's own data + your center's policies. |
| **Voice-to-text for teachers** | High | Teachers are busy with kids — talking is faster than typing. |
| **Smart notification timing** | Medium | Learn when parents actually read notifications; avoid 3am pushes. |
| **Attendance anomaly detection** | Medium | Flags unusual pickup patterns (different person, unusual time) for safety review — **alerts staff, does not auto-decide**. |
| **Photo auto-tagging by child** | Medium | Tag which child appears in which photo so parents only see their own kid — big privacy win, not just convenience. |
| **Sentiment trend on daily notes** | Medium | Track mood trends over weeks — useful signal for staff, not a diagnosis. |
| **Predictive enrollment/capacity planning** | Low-Medium | Useful for admin forecasting revenue and staffing needs. |
| ⚠️ **Face recognition check-in** | Use with caution | Technically doable, but children's biometric data is legally sensitive in most countries (GDPR Art. 9, COPPA implications, some US states ban biometric collection of minors outright). Recommend **QR badge or PIN check-in** as default, with face-match as an optional premium add-on only where legally cleared. |

**Suggested AI architecture:** one Python **AI Orchestrator** service (FastAPI) fronting a few specialized components: LLM calls (via Anthropic/OpenAI API) for chat + summarization, a small vision model or hosted vision API for photo tagging, and a lightweight anomaly-detection job (rules + basic ML) for attendance. Don't over-engineer this at first — start with LLM API calls for report-summary + chatbot, add the rest incrementally.

---

## 4. Recommended Tech Stack

### Mobile app (Parent + Teacher)
- **Flutter** (Dart) — single codebase for iOS + Android, strong performance, good camera/QR/offline support (daycares often have spotty wifi).
  - Alternative: React Native if your team is already JS-heavy.

### Desktop app (Admin, license-locked)
- **Tauri** (Rust + web frontend, React/Vue) — lightweight, small binary, easy native access to system info (MAC address, disk serial) for licensing, cross-platform (Windows/Mac/Linux) from one codebase.
  - Alternative: **Electron** if your team prefers pure JS and binary size/RAM aren't a concern.
  - Avoid .NET MAUI unless you specifically want a Windows-first, C#-based team.

### Backend — microservices
- **NestJS (Node.js/TypeScript)** for most business services (Auth, User, Child, Classroom, Attendance, Billing, Messaging, Notification, License) — fast to build, strong typing, good DX, huge ecosystem.
- **FastAPI (Python)** for the AI Orchestrator service specifically — Python is where the AI/ML ecosystem lives.
- **API Gateway**: Kong or a NestJS-based gateway for routing, auth checks, rate limiting.

### Data layer
- **PostgreSQL** — core relational data (users, children, attendance, billing). Use **pgvector** extension if you want to avoid running a separate vector DB.
- **MongoDB** — chat messages, activity logs, AI outputs (flexible schema, high write volume).
- **Redis** — sessions, caching, rate limiting.
- **S3-compatible object storage (MinIO self-hosted, or AWS S3)** — photos, videos, documents.
- **Vector DB** (pgvector or Pinecone) — only needed once you build the RAG chatbot.

### Messaging / events
- **RabbitMQ** to start (simpler ops than Kafka); migrate to **Kafka** only if you hit real throughput needs. Used for: attendance events → trigger notifications, billing events → trigger reminders, report events → trigger AI summarization.

### Infra
- **Docker** everywhere; **Kubernetes** once you have more than ~4-5 services in production (don't start here — start with Docker Compose for MVP).
- **CI/CD**: GitHub Actions.
- **Monitoring**: Prometheus + Grafana; **Logging**: ELK or Grafana Loki.
- **Push notifications**: Firebase Cloud Messaging (FCM) for both iOS and Android.
- **Email**: SendGrid or AWS SES. **SMS**: Twilio.
- **Payments**: Stripe (handles PCI compliance for you — don't build your own card storage).

---

## 5. Microservices Architecture

See `architecture.mermaid` for the full diagram. Summary of services:

| Service | Responsibility | Reusable in future apps? |
|---|---|---|
| **Auth Service** | Signup/login, JWT/OAuth2, RBAC, password reset, MFA | ✅ Yes — build this generically from day one |
| **Notification Service** | Unified push/email/SMS dispatch, templating, delivery tracking | ✅ Yes — same reasoning |
| **License Service** | Desktop app activation, device fingerprint validation, revocation | Possibly reusable for any desktop-licensed product |
| User/Profile Service | Profile data, role management | App-specific |
| Child Service | Child records, medical/allergy data | App-specific |
| Classroom Service | Classrooms, capacity, staff assignment | App-specific |
| Attendance Service | Check-in/out, history | App-specific |
| Messaging Service | Parent-teacher chat | Could be genericized later |
| Billing Service | Invoices, Stripe integration | Could be genericized later |
| Media Service | Photo/video storage & retrieval | App-specific |
| Daily Report Service | Report CRUD, triggers AI summary | App-specific |
| AI Orchestrator | Routes to chatbot, NLP, vision, anomaly detection | App-specific glue, but individual AI skills are reusable |

**Design tip for reusability:** Build Auth and Notification with zero daycare-specific logic inside them — they should only know about "users," "tenants," and "messages/events." Anything daycare-specific stays in the calling services. This is what makes them portable to your next product.

---

## 6. Data Model — Class Diagram

See `class_diagram.mermaid` for the full entity/relationship diagram. Core entities: `User` (abstract, extended by `Admin`/`Teacher`/`Parent`), `Child`, `Classroom`, `Attendance`, `DailyReport`, `MediaItem`, `Message`, `Notification`, `Invoice`, `Payment`, `License`, `AIInsight`.

---

## 7. Desktop Licensing (MAC-address / device-locked)

You mentioned wanting the desktop admin app locked to a specific device via MAC address. A few practical notes:

- **Don't rely on MAC address alone** — it can change (VMs, USB adapters, some OSes randomize MAC for privacy). Instead build a **composite hardware fingerprint**: hash of `MAC address + disk serial number + CPU ID + OS install ID`, combined and salted.
- **Flow**:
  1. On first launch, the desktop app computes the hardware fingerprint locally.
  2. It sends fingerprint + license key to the **License Service**.
  3. License Service validates key, ties it to that fingerprint, issues a **signed license token** (JWT, short-lived, refreshed periodically while online).
  4. App checks the token locally on each launch; periodically re-validates online (e.g. every 7 days) so revocation actually works.
  5. Admin panel lets you (the company) revoke/transfer a license from the backend.
- This is a licensing/anti-piracy mechanism, not a security boundary — treat it as a business control, not as protection against a determined attacker.

---

## 8. Security & Compliance — This Matters More Than Usual Here

You're handling **children's personal and medical data**, which is one of the most sensitive data categories in almost every jurisdiction:

- **GDPR** (EU/wide relevance) — children's data requires extra safeguards, parental consent flows, data minimization, right to erasure.
- **COPPA** (US) — if any AI feature processes a child's data, especially biometric/photo data, review this carefully.
- Encrypt data at rest and in transit. Role-based access control everywhere (a teacher should only see their own classroom's children).
- Avoid biometric check-in (face recognition) unless you've explicitly cleared it legally — flagged above.
- Have a clear data retention/deletion policy, especially for photos/videos of children.
- Get a lawyer to review consent flows before launch — this isn't optional for a children's-data product.

---

## 9. Suggested Roadmap

**Phase 1 — MVP (8-12 weeks)**
- Auth Service + basic RBAC (3 roles)
- Child/Classroom/User services
- Mobile app: check-in/out, daily report (manual, no AI yet), photo upload
- Desktop app: admin CRUD for staff/children/classrooms, no licensing yet
- Notification Service: push only

**Phase 2 — Core AI + Billing (6-8 weeks)**
- Daily report AI summarizer
- Billing Service + Stripe
- Email/SMS added to Notification Service
- Desktop licensing (MAC/HW fingerprint)

**Phase 3 — Smart features (ongoing)**
- Parent chatbot (RAG)
- Photo auto-tagging
- Attendance anomaly detection
- Analytics dashboards for Admin

**Phase 4 — Scale & extract**
- Harden Auth + Notification as standalone, documented, versioned services
- Kubernetes migration if load requires it
- Package Auth/Notification as internal libraries/templates for your next product

---

## 10. Key Recommendations, Summarized

1. Start with **Flutter (mobile) + Tauri (desktop)** — one team, two platforms each, minimal duplicated effort.
2. Build backend as **NestJS microservices + one FastAPI AI service**, not a monolith — but don't over-fragment for MVP; ~6-8 services is enough to start.
3. Design **Auth and Notification as tenant-agnostic services from day one** — this is what makes them reusable later, not a refactor after the fact.
4. Be deliberate about **which AI features are actually useful** (summarization, chatbot, smart tagging) versus which are legally risky (face recognition) — start with the safe, high-value ones.
5. Treat **children's data compliance** as a first-class requirement, not an afterthought — involve a lawyer before launch.
6. MAC-based licensing works, but pair it with a **composite hardware fingerprint** and a **license server that can revoke**, not a static MAC check.
