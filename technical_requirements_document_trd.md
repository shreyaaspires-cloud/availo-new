# Technical Requirements Document (TRD) — NexusShare
> Security requirements, performance targets, rate limiting, and architecture decisions for the Institutional Resource Sharing Platform.
> **Database Chosen**: **PostgreSQL via Supabase + Prisma 7** (Relational integrity and ACID transactions are mandatory for booking conflicts, quota calculations, and immutable audit logs).

---

## Section 1 — Security Requirements

### Section 1.1 — Authentication and Session

| Requirement | Specification | Notes |
|---|---|---|
| **Password Hashing** | `bcrypt`, `saltRounds = 10` | ~100ms per hash — intentionally slow, never reduce. |
| **Token Type** | JWT, signed `HS256` | Stateless auth verified on every protected Express 5 route. |
| **Access Token Expiry** | `15m` | Short-lived to limit exposure. |
| **Refresh Token Expiry** | `7d` | Rotated on every `/api/auth/refresh` call. |
| **Access Token Storage** | **Zustand memory only** (NOT `localStorage`) | Prevents XSS token theft. |
| **Refresh Token Storage** | `httpOnly` cookie (`SameSite=Strict`, `Secure` in prod) | Inaccessible to client-side JavaScript. |
| **Roles** | `USER`, `ADMIN` only | `USER` = Resource Borrower/Researcher; `ADMIN` = Institutional Owner/Manager. No `SUPER_ADMIN`. |

### Section 1.2 — Security Essentials (OWASP & Institutional Trust Must-Haves)

| Threat | Mitigation |
|---|---|
| **Broken Access Control** | `authenticateToken` on all protected routes; `requireRole('ADMIN')` on resource creation, booking approval/rejection/waitlisting, and user qualification management. Ownership checks ensure users can only check-in/out their own bookings. |
| **Audit Tampering** | The `AuditLog` table is append-only. No `PUT`, `PATCH`, or `DELETE` routes exist for audit logs — now or ever. Every state transition runs inside a `prisma.$transaction` that writes both the state change and the `AuditLog` atomically. The `AuditLog` Prisma model intentionally has no `updatedAt` field. A comment lock at the top of `audit.routes.ts` prevents accidental mutation routes from being added. |
| **Waitlist Manipulation** | `waitlistPosition` is never set by the user; it is computed exclusively by `recalculateWaitlistPositions()` inside a `prisma.$transaction`, ordered by `fairnessPriorityScore DESC`. Any change to queue order is recorded in a `WAITLIST_RECALCULATED` AuditLog entry. |
| **Injection (SQL/XSS)** | Prisma 7 parameterized queries prevent SQL injection; Zod schemas strip and validate all inputs; Helmet 8 sets strict security headers. |
| **Unfair Resource Hogging** | Server-side Fair-Access Verification calculates rolling 7-day booked hours per user before permitting approval. |

### Section 1.3 — Transport Security

```typescript
// src/index.ts
import helmet from 'helmet';
import cors from 'cors';

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true, // Required for httpOnly refreshToken cookie
}));
```

---

## Section 2 — Performance & Rate Limiting Requirements

### Section 2.1 — Response Time Targets

| Endpoint Type | Target p95 | Max |
|---|---|---|
| Auth endpoints (`/login`, `/register`, `/refresh`) | 200ms | 500ms |
| Read — Resource catalog, eligibility check, audit trail | 100ms | 300ms |
| Write — Booking request, approval, check-in, check-out | 200ms | 500ms |
| AI — Gemini 2.5 Flash condition diff & fairness analysis | 3000ms | 8000ms |
| File Upload — Condition photo to Cloudinary | 1000ms | 3000ms |

### Section 2.2 — Rate Limiting (`express-rate-limit` in-memory)

| Endpoint Group | Limit | Window | Notes |
|---|---|---|---|
| `POST /api/auth/login` | 5 requests | 15 minutes | |
| `POST /api/auth/register` | 3 requests | 1 hour | |
| `GET /api/*` (authenticated) | 100 requests | 1 minute | |
| `POST /api/ai/analyze` | 10 requests | 1 minute | Safe under Gemini 2.5 Flash 15 RPM free cap. Applied to HTTP route only — does NOT cover `analyzeInline()` calls inside checkout. See Section 2.3. |
| `POST /api/upload` | 5 requests | 1 minute | |

### Section 2.3 — AI Rate Limiter Scope Clarification

The `aiLimiter` (10 req/min) is applied only to `POST /api/ai/analyze`. A second Gemini call path exists inside `POST /api/bookings/:id/check-out`, which calls `aiService.analyzeInline()` directly — this does **not** go through the `/api/ai/analyze` HTTP route and therefore does **not** consume `aiLimiter` quota.

| Call Path | Route | `aiLimiter` Applied | Max Expected Rate |
|---|---|---|---|
| User-triggered audit | `POST /api/ai/analyze` | **Yes** — 10 req/min | Up to 10/min |
| Auto inline on checkout | Inside `POST /api/bookings/:id/check-out` | **No** — direct service call | ~1–2/min during demo |
| **Combined total** | — | — | Well under 15 RPM free cap |

`analyzeInline()` is **non-fatal**: if the Gemini call fails, `aiConditionSummary` is stored as `null` and checkout completes normally. The checkout endpoint is never blocked by an AI failure.

---

## Section 3 — Architecture Decisions (ADRs)

### ADR-001: Next.js 16 + React 19 (Frontend)
**Why**: App Router, Server Components, Turbopack default bundler, async `params`/`searchParams`, and React 19 ref-as-prop support allow rapid, type-safe UI construction.

### ADR-002: PostgreSQL via Supabase + Prisma 7 (Database & ORM)
**Chosen**: PostgreSQL 16 (Supabase) with Prisma 7.x.
**Why**: Resource sharing requires strict relational links (`User -> Booking -> Resource -> ConditionLog / IncidentReport / AuditLog`), time-range overlap queries (`startTime < reqEnd AND endTime > reqStart`), and atomic ACID transactions (`prisma.$transaction`) so a booking status change never occurs without a corresponding `AuditLog` entry. Prisma 7's pure TypeScript engine eliminates Rust binary issues.

### ADR-003: Gemini 2.5 Flash via `@google/genai`
**Why**: Used for two high-value institutional tasks:
1. **AI Condition & Damage Auditor (HTTP, Path A)**: User/Admin manually triggers `POST /api/ai/analyze` to compare Check-In vs. Check-Out condition notes and flag unreported wear. Governed by `aiLimiter`.
2. **AI Inline Condition Summary (Checkout, Path B)**: `analyzeInline()` is called automatically inside `POST /api/bookings/:id/check-out` when condition data is fresh. Stores result in `aiConditionSummary` on the Booking record. Not governed by `aiLimiter`. Non-fatal.
3. **AI Fair-Access Advisor**: Explains in plain language why a booking was prioritized, waitlisted, or flagged.
*(Note: Uses `gemini-2.5-flash` exclusively; `gemini-2.0-flash` is deprecated. No Redis/caching in current scope).*

### ADR-004: Express 5 (`^5.1.x`)
**Why**: Express 5 forwards rejected promises in `async` route handlers directly to the global error handler automatically, eliminating repetitive `try/catch` blocks on standard CRUD routes while allowing explicit `try/catch` on AI (`503`) and Upload routes.

### ADR-005: Zustand 5 (`useShallow`) + TanStack Query 5
**Why**: Zustand 5 stores the JWT access token strictly in memory (zero XSS `localStorage` risk) and manages toast notifications. All multi-property selectors use `useShallow` from `zustand/shallow`. TanStack Query 5 manages server cache, pagination (`keepPreviousData`), and automatic query invalidation across the 10-step booking lifecycle.

### ADR-006: Waitlist Recalculation via `recalculateWaitlistPositions()`
**Why**: `waitlistPosition` must always reflect current fair-access priority, not historical assignment order. A dedicated `recalculateWaitlistPositions(resourceId, tx)` service function re-ranks all `WAITLISTED` bookings by `fairnessPriorityScore DESC` inside the same `prisma.$transaction` as the triggering event (approval or cancellation). This ensures:
- The position ordering is always consistent with the fairness engine.
- Every re-ranking is atomically paired with a `WAITLIST_RECALCULATED` AuditLog entry.
- No position can be set by user input — it is always server-computed.

---

## Section 4 — Reliability and Pre-Demo Verification

- [ ] `.env` never committed to Git.
- [ ] Supabase kept awake via UptimeRobot hitting `GET /health` **every 5 minutes** (not 6 days — set the UptimeRobot monitor interval to 5 minutes).
- [ ] Pre-seeded demo credentials (`demo@yourapp.com` / `HackDemo@Hack` and `admin@yourapp.com` / `HackAdmin@Hack`) with pre-populated resources, qualifications, bookings in every lifecycle state, and audit logs so judges can immediately inspect any of the 10 lifecycle steps.
- [ ] Seed data intentionally gives `demo@yourapp.com` the `LASER_SAFETY_L1` qualification, matching the Haas CNC machine's `requiredCerts`. This makes the demo user show as **Eligible** immediately on the resources page — deliberate, required for the demo script.
- [ ] Run one live `POST /api/ai/analyze` call 10 minutes before judging to warm up the Gemini service.
- [ ] Verify `analyzeInline()` fallback works: temporarily pass an invalid API key, confirm checkout still completes with `aiConditionSummary: null` and no error response.
- [ ] Confirm `audit.routes.ts` has the comment lock at the top and no mutation routes.
