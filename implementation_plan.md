# Implementation Plan — NexusShare (24-Hour Execution Guide)
> Hour-by-hour build plan engineered to deliver all 10 steps of the Resource Sharing Challenge Objective with zero integration bottlenecks.

---

## Section 1 — Timeline Overview

| Phase | Hours | Focus | Definition of Done |
|---|---|---|---|
| **1. Documentation & Setup** | 0 – 1 | Lock docs, repo, Supabase, Railway, Vercel, env vars | Repo cloned, DB connected, SDK versions verified |
| **2. Foundation & Primitives** | 1 – 3 | Prisma 7 migration + seed, Auth endpoints, 9 UI Primitives | Login/Register/Refresh work; all UI primitives built |
| **3. Core Backend (Steps 1–10)** | 3 – 9 | Resource, Booking (Fair-Access Engine + Waitlist Recalculation), Check-In/Out, Incident, Audit APIs | All endpoints tested and writing atomic `AuditLog` entries |
| **4. Core Frontend** | 3 – 12 | Catalog, Eligibility Badges, Booking Lifecycle UI, Check-In/Out Modals, Audit Drawer | User & Admin flows navigable end-to-end |
| **5. Integration Handshake** | 10 – 16 | Connect React Query hooks to Express 5 API + Cloudinary upload | Live DB state transitions work in browser |
| **6. Gemini 2.5 Flash AI** | 13 – 17 | AI Condition Diff Auditor (HTTP) + `analyzeInline()` in checkout + 503 fallback | Live Gemini 2.5 Flash analysis + 503 fallback working; checkout completes even when AI fails |
| **7. Polish & Guardrails** | 16 – 20 | 4-state coverage (loading/empty/error/data), RBAC checks, mobile responsive | Zero console errors, all 10 lifecycle steps verified |
| **8. Testing & Demo Rehearsal** | 20 – 24 | Production seed, UptimeRobot (5 min), 3x full demo rehearsal | 3-minute demo runs smoothly 3 times in a row |

---

## Section 2 — Hour-by-Hour Checklist

### Hours 0–1: Environment & Verification Sprint
- [ ] Initialize `frontend/` (Next.js 16, React 19, Tailwind 3.4, Zustand 5, TanStack Query 5, Lucide React) and `backend/` (Express `^5.1.0`, Prisma 7, Zod 3, `bcrypt`, `jsonwebtoken`, `@google/genai`, `multer`, `cloudinary`).
- [ ] Verify `@google/genai` version (`npm info @google/genai version`) and lock model string to `'gemini-2.5-flash'`.
- [ ] Verify `tsconfig.json` has `"strict": true` in both frontend and backend.
- [ ] Configure `.env` files on local machines, Railway/Koyeb, and Vercel (`NEXT_PUBLIC_API_URL` ending in `/api`).

### Hours 1–3: Foundation & UI Primitives
- [ ] **Backend**: Apply `prisma/schema.prisma` (`npx prisma migrate dev --name init`) with `User`, `Resource`, `Booking`, `IncidentReport`, and `AuditLog`.
  - Confirm `AuditLog` model has **no `updatedAt` field** — this is intentional and signals append-only intent.
- [ ] **Backend**: Run `npx prisma db seed` to create:
  - `demo@yourapp.com` (`HackDemo@Hack`, qualifications: `['LASER_SAFETY_L1', '3D_PRINT_PRO']`)
  - `admin@yourapp.com` (`HackAdmin@Hack`)
  - 4 resources including the Haas CNC with `requiredCerts: ['LASER_SAFETY_L1']` (deliberate — demo user is eligible for CNC)
  - Pre-staged bookings: `APPROVED` (for live check-in demo), `PENDING` (for admin review demo), `WAITLISTED` (shows `waitlistPosition: 1`), `COMPLETED` with full 10-entry `AuditLog`.
- [ ] **Backend**: Complete `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, and `/health`.
- [ ] **Frontend**: Build `apiClient.ts` (unwrapping `response.data.data` + 401 refresh queue), `authStore.ts`, and `uiStore.ts`.
- [ ] **Frontend**: Build all 9 UI primitives (`Button`, `Input`, `Badge`, `Card`, `Modal`, `Skeleton`, `EmptyState`, `ErrorBanner`, `ToastContainer`) + `AuthGuard`.

### Hours 3–9: Core Backend (All 10 Challenge Steps)
- [ ] **Step 1 (`resource.controller.ts`)**: `GET /api/resources`, `GET /api/resources/:id`, `POST /api/resources` (`ADMIN`), `PUT /api/resources/:id` (`ADMIN`). Compute live eligibility for the requesting user.
- [ ] **Steps 3 & 4 (`booking.service.ts`)**: Implement `verifyEligibilityAndFairness()` (checks `requiredCerts`, calculates rolling 7-day hours vs `maxHoursPerWeek`, computes `fairnessPriorityScore`, checks time conflicts) inside `POST /api/bookings`.
- [ ] **Steps 5 & 6 (`booking.controller.ts`)**: Implement `PATCH /api/bookings/:id/review` (`ADMIN`) supporting `APPROVED`, `REJECTED`, and `WAITLISTED` (auto-assigning `waitlistPosition` by `fairnessPriorityScore DESC`).
  - On `APPROVED`: call `recalculateWaitlistPositions(booking.resourceId, tx)` inside the same `prisma.$transaction`. Write `WAITLIST_RECALCULATED` AuditLog entry if any positions changed.
- [ ] **Waitlist Recalculation (`booking.service.ts`)**: Implement `recalculateWaitlistPositions(resourceId, tx)` — fetches all `WAITLISTED` bookings for the resource ordered by `fairnessPriorityScore DESC` and re-assigns sequential `waitlistPosition` values starting from 1.
- [ ] **Booking Cancellation (`booking.controller.ts`)**: Implement `POST /api/bookings/:id/cancel`. If the cancelled booking had `status === 'WAITLISTED'`, call `recalculateWaitlistPositions()` inside the same `prisma.$transaction`.
- [ ] **Step 7 (`booking.controller.ts`)**: Implement `POST /api/bookings/:id/check-in` recording initial condition, notes, and photo URL.
- [ ] **Steps 8 & 9 (`booking.controller.ts` & `incident.controller.ts`)**: Implement `POST /api/bookings/:id/check-out`:
  - Call `aiService.analyzeInline(aiContent)` **before** the `prisma.$transaction` (non-fatal — `null` on failure).
  - Store result in `aiConditionSummary` on the Booking record.
  - If `checkOutCondition === 'DAMAGED'` or `reportIncident === true`: auto-create `IncidentReport`, update `Resource.currentCondition`, write `INCIDENT_REPORTED` AuditLog — all inside the same `$transaction`.
- [ ] **Step 10 (`audit.controller.ts`)**: Implement `GET /api/audit` returning the chronological, paginated `AuditLog` trail.
  - **Add the comment lock at the top of `audit.routes.ts`**:
    ```typescript
    // ⚠️  APPEND-ONLY — DO NOT add PUT, PATCH, or DELETE routes here.
    ```
- [ ] **AI Service (`ai.service.ts`)**: Implement **both** `analyze(content)` (for HTTP route, throws on failure) and `analyzeInline(content)` (for checkout controller, returns `null` on failure, never throws).
- [ ] **Rate Limiter (`rateLimiter.ts`)**: Confirm `aiLimiter` is applied only to `POST /api/ai/analyze` in `ai.routes.ts`. Do **not** add `aiLimiter` to booking routes.
- [ ] **Admin (`admin.controller.ts`)**: Implement `GET /api/admin/users` and `PATCH /api/admin/users/:id` so Admin can grant qualifications (e.g., `LASER_SAFETY_L1`).

### Hours 3–12: Core Frontend (Parallel with Backend)
- [ ] Build `DashboardLayout`, `Sidebar`, and `TopBar` (displaying user's Role badge and Trust Score).
- [ ] Build `/login` (with one-click Demo User & Admin autofill buttons, **no** forgot-password link) and `/register`.
- [ ] Build `/resources` and `/resources/[id]` with Category filter, Eligibility & Fair-Quota banner, Booking Request form, and Admin "List Resource" modal.
- [ ] Build `/bookings` featuring `<LifecycleStepper />`, `CheckInModal`, `CheckOutModal`, and `AuditTimelineDrawer`.
  - `AuditTimelineDrawer` must display `WAITLIST_RECALCULATED` events in the timeline when present.
- [ ] Build `/admin` featuring the Pending Booking Review Queue (with Fairness Score & Qualification match badges), Waitlist Priority Queue (showing live `waitlistPosition` after recalculation), and User Qualifications manager.
- [ ] Build `/incidents` and `/profile`.

### Hours 10–16: Integration Handshake
- [ ] Connect all TanStack Query hooks (`useResources`, `useBookings`, `useIncidents`, `useAuditLogs`) to real backend endpoints.
- [ ] Test Cloudinary photo upload (`POST /api/upload` with `formData.append('file', file)`) inside `CheckInModal` and `CheckOutModal`.
- [ ] Verify all Zustand multi-value selectors use `useShallow`.
- [ ] Verify `aiConditionSummary` is displayed on the completed booking card when non-null (monospace `font-mono` style per design system).

### Hours 13–17: Gemini 2.5 Flash AI Integration
- [ ] Wire `POST /api/ai/analyze` (`aiLimiter` 10 req/min) to `@google/genai` with model `'gemini-2.5-flash'` via `aiService.analyze()`.
- [ ] Confirm `booking.controller.ts` checkout uses `aiService.analyzeInline()` — direct call, no HTTP route, no `aiLimiter` consumed.
- [ ] Test `analyzeInline()` failure path: with an invalid key, confirm checkout still returns `200` with `aiConditionSummary: null`.
- [ ] Connect **"AI Condition Diff & Fairness Audit"** button on `/bookings`, `/incidents`, and `/ai-audit` to `POST /api/ai/analyze`.
- [ ] Verify `503 AI_UNAVAILABLE` error state renders `<ErrorBanner />` with a working Retry button on the HTTP path.

### Hours 16–20: Scope Freeze & Polish
- [ ] **Scope Freeze at Hour 14**: No new endpoints or schema changes.
- [ ] Audit every screen for the 4 mandatory states (Loading Skeleton, EmptyState, ErrorBanner, Data).
- [ ] Verify mobile responsiveness at `375px` and desktop layout at `1280px`.

### Hours 20–24: Production Verification & Rehearsal
- [ ] Run `npx prisma migrate deploy` and `npx prisma db seed` on production Supabase DB.
- [ ] Configure UptimeRobot to ping `GET /health` **every 5 minutes** (not 6 days — set the interval explicitly to 5 min in the UptimeRobot dashboard).
- [ ] Run one live `POST /api/ai/analyze` Gemini query 10 minutes before judging to warm up the service.
- [ ] Verify `audit.routes.ts` has the comment lock and zero mutation routes.
- [ ] Execute the 3-minute Demo Script (from `SYSTEM_FLOW.md` Section 6) 3 times end-to-end.
