# Backend Guidelines & Instructions — NexusShare
> Mandatory coding rules, Express 5 patterns, Prisma 7 transaction rules, file upload handling, and the copy-paste AI Backend Prompt.

---

## Section 1 — Non-Negotiable Backend Rules

1. **Express 5 (`^5.1.x`) Error Handling**:
   - Express 5 automatically catches rejected promises in `async` route handlers and forwards them to the global error handler.
   - Do **NOT** wrap standard CRUD controllers in `try/catch`.
   - **DO** use `try/catch` in `ai.controller.ts` (to return `503 AI_UNAVAILABLE`) and `upload.controller.ts` (to handle stream errors).
   - Express 5 removed `:param?` optional route syntax. Use array paths `app.get(['/items', '/items/:id'], handler)` if needed.

2. **Consistent Response Envelope (`src/utils/response.ts`)**:
   - Never call `res.json()` directly in controllers. Always use `sendSuccess(res, data, message, status)` or `sendError(res, error, status, code, details)`.
   - All list endpoints (`GET /api/resources`, `GET /api/bookings`, `GET /api/incidents`, `GET /api/audit`, `GET /api/admin/users`) must use the `paginate()` helper and accept `?page=1&limit=20`.

3. **Atomic Audit Logging (`prisma.$transaction`)**:
   - Every mutation across the 10-step lifecycle **MUST** write an `AuditLog` record inside the same database transaction.
   - Example pattern:
     ```typescript
     const updatedBooking = await prisma.$transaction(async (tx) => {
       const booking = await tx.booking.update({
         where: { id: bookingId },
         data: {
           status: 'CHECKED_IN',
           checkedInAt: new Date(),
           checkInCondition,
           checkInNotes,
           checkInPhotoUrl,
         },
       });

       await tx.auditLog.create({
         data: {
           action: 'RESOURCE_CHECKED_IN',
           actorId: req.user!.userId,
           resourceId: booking.resourceId,
           bookingId: booking.id,
           details: `Checked in with initial condition: ${checkInCondition}. Notes: ${checkInNotes}`,
         },
       });

       return booking;
     });
     ```

4. **AuditLog is Append-Only — No Mutation Routes, Ever**:
   - The `AuditLog` table **must never** have `PUT`, `PATCH`, or `DELETE` endpoints — not now, not in future sprints.
   - `audit.routes.ts` exposes only `GET /`. Add this comment at the top of that file:
     ```typescript
     // audit.routes.ts
     // ⚠️  APPEND-ONLY — DO NOT add PUT, PATCH, or DELETE routes here.
     // AuditLog rows are immutable by design. Every write happens inside a
     // prisma.$transaction alongside the state change it records.
     ```
   - The `AuditLog` Prisma model intentionally has no `updatedAt` field. Do not add one.

5. **Automatic Incident Creation on Damaged Return**:
   - In `POST /api/bookings/:id/check-out`, if `checkOutCondition === 'DAMAGED'` or `reportIncident === true`, automatically create an `IncidentReport` record and update `Resource.currentCondition` inside the same `$transaction`, plus log `INCIDENT_REPORTED` in `AuditLog`.

6. **Waitlist Position Recalculation on Approval or Cancellation**:
   - Call `recalculateWaitlistPositions(resourceId, tx)` from `booking.service.ts` **inside the same `prisma.$transaction`** in two situations:
     - When `PATCH /api/bookings/:id/review` sets `status = 'APPROVED'` — the approved booking leaves the waitlist queue, so positions must shift.
     - When `POST /api/bookings/:id/cancel` cancels a booking whose previous `status === 'WAITLISTED'` — the gap in the queue must be closed.
   - After recalculation, write a `WAITLIST_RECALCULATED` `AuditLog` entry (only if `remainingWaitlisted > 0`) so the position change is fully traceable.
   - **Known scope boundary**: Automatic promotion (moving the position-1 user from `WAITLISTED` to `APPROVED` automatically) is **out of scope** for this hackathon. The Admin still manually approves after seeing the updated queue. This is listed in the Future Roadmap.

7. **AI Rate Limiter Scope — Two Paths, One Quota**:
   - There are **two ways** the Gemini API is called in this codebase:
     - **Path A**: `POST /api/ai/analyze` → `ai.controller.ts` → `aiService.analyze()`. This path is guarded by `aiLimiter` (10 req/min).
     - **Path B**: `POST /api/bookings/:id/check-out` → `booking.controller.ts` → `aiService.analyzeInline()`. This path calls the AI service **directly** without going through the `/api/ai/analyze` HTTP route, so `aiLimiter` is **not consumed**.
   - Both paths share the same Gemini API key and its 15 RPM free-tier quota. Under normal demo conditions, Path B triggers at most 1–2 times per minute, keeping total combined calls well under 15 RPM.
   - **Rule**: Do **not** add `aiLimiter` middleware to the booking routes. Do **not** route checkout through `/api/ai/analyze`. Keep the two paths separate.
   - `analyzeInline()` is non-fatal: if the Gemini call fails inside checkout, it logs the error, stores `null` in `aiConditionSummary`, and allows the checkout to complete normally. The checkout must never be blocked by an AI failure.

8. **File Upload Rules (`multer.memoryStorage()`)**:
   - Use `multer.memoryStorage()` with a `5MB` limit and MIME allowlist (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`).
   - Form field name **must** be `"file"`.
   - Stream `req.file.buffer` to Cloudinary via `uploadBuffer()`. Never reference `req.file.path`.

9. **Gemini 2.5 Flash Rules (`@google/genai`)**:
   - Initialize with `import { GoogleGenAI } from '@google/genai';`.
   - Call `genAI.models.generateContent({ model: 'gemini-2.5-flash', contents })`.
   - Never use `gemini-2.0-flash` (deprecated/shut down).
   - Never add Redis caching.

---

## Section 2 — Seed Data Requirements (`prisma/seed.ts`)

Your `prisma/seed.ts` file must seed the following data so the 10-step lifecycle is immediately demonstrable on first boot:

1. **Users (Year-Agnostic Passwords, `bcrypt` 10 rounds)**:
   - **Demo User (Researcher)**: `demo@yourapp.com` / `HackDemo@Hack` (`role: 'USER'`, `qualifications: ['LASER_SAFETY_L1', '3D_PRINT_PRO']`, `trustScore: 98`)
   - **Admin User (Lab Director)**: `admin@yourapp.com` / `HackAdmin@Hack` (`role: 'ADMIN'`, `qualifications: ['LASER_SAFETY_L1', '3D_PRINT_PRO', 'CNC_5AXIS_CERT', 'BIO_SAFETY_L2']`, `trustScore: 100`)

2. **Resources (4 Realistic Institutional Assets)**:
   - **Haas 5-Axis CNC Machining Center** (`MAKERSPACE_TOOL`, `requiredCerts: ['LASER_SAFETY_L1']`, `maxHoursPerWeek: 8`)
     > ⚠️ **Intentional seed design**: The CNC machine requires only `LASER_SAFETY_L1`, which the demo user (`demo@yourapp.com`) already holds. This means the demo user shows as **Eligible** for the CNC during the live judge demo — this is deliberate and required for the 3-minute demo script to work without a qualification-granting step.
   - **Prusa Pro AFS Industrial 3D Farm** (`MAKERSPACE_TOOL`, `requiredCerts: ['3D_PRINT_PRO']`, `maxHoursPerWeek: 10`)
   - **Keysight 10GHz Mixed-Domain Oscilloscope** (`TESTING_DEVICE`, `requiredCerts: []`, `maxHoursPerWeek: 6`)
   - **Cleanroom Bio-Optics Imaging Suite B** (`LABORATORY`, `requiredCerts: ['BIO_SAFETY_L2']`, `maxHoursPerWeek: 4`, `requiresSupervision: true`)

3. **Pre-Seeded Bookings Across All Lifecycle States**:
   - **Booking 1 (`APPROVED`)**: Ready for live **Step 7 Check-In** and **Step 8 Return** during the 3-minute judge demo.
   - **Booking 2 (`PENDING`)**: Ready for live **Step 5 & 6 Admin Review** (Approve / Waitlist / Reject).
   - **Booking 3 (`WAITLISTED`)**: Shows explainable Fair-Access Priority Score & Waitlist Position. `waitlistPosition: 1`. (Position is recalculated live when Booking 2 gets approved during the demo.)
   - **Booking 4 (`COMPLETED` with `IncidentReport`)**: Complete with Check-In notes, Check-Out notes, AI Condition Summary, and all 10 `AuditLog` entries so Step 10 can be shown immediately without any live actions.

---

## Section 3 — Copy-Paste AI Prompt for Backend Sessions

```text
You are building the Express 5 + TypeScript 5.6 + Prisma 7 backend for "NexusShare" (Institutional Resource Sharing Platform).

STRICT RULES:
1. Express 5 (^5.1.x) is in use — async rejected promises auto-forward to the global error handler. Do NOT wrap simple routes in try/catch. Use try/catch ONLY in AI (to return 503 AI_UNAVAILABLE) and Upload controllers.
2. All responses MUST use `sendSuccess(res, data, message, status)` or `sendError(res, error, status, code, details)` from `src/utils/response.ts`.
3. Every list endpoint must use `paginate()` and return `{ items, total, page, limit, totalPages, hasNextPage, hasPrevPage }`.
4. All protected routes require `authenticateToken`. Owner/Manager routes require `requireRole('ADMIN')`.
5. Roles are strictly `'USER'` and `'ADMIN'` only. No `'SUPER_ADMIN'`.
6. Every booking, resource, or incident mutation MUST run inside `prisma.$transaction` and append an immutable `AuditLog` entry.
7. AuditLog is APPEND-ONLY. audit.routes.ts exposes GET / ONLY. Never add PUT, PATCH, or DELETE to audit routes.
8. When a booking is APPROVED or CANCELLED (from WAITLISTED), call recalculateWaitlistPositions(resourceId, tx) inside the same prisma.$transaction and write a WAITLIST_RECALCULATED AuditLog entry.
9. The AI service has TWO methods: analyze() used by POST /api/ai/analyze (counts against aiLimiter 10 req/min), and analyzeInline() used directly inside booking.controller.ts check-out (does NOT count against aiLimiter). Keep them separate.
10. analyzeInline() is non-fatal — if Gemini fails, store null in aiConditionSummary and complete the checkout normally. Never block a checkout on an AI failure.
11. Password hashing: `bcrypt` with `saltRounds = 10`.
12. JWT: Access token (`15m`) in `Authorization: Bearer <token>`. Refresh token (`7d`) in `httpOnly` cookie (`sameSite: 'strict'`).
13. File upload: `multer.memoryStorage()`, 5MB max, field name `"file"`, uploaded via `uploadBuffer(req.file.buffer, 'nexusshare')`.
14. AI: `import { GoogleGenAI } from '@google/genai'`, model `'gemini-2.5-flash'` (NEVER `gemini-2.0-flash`). No Redis.
15. UptimeRobot: GET /health must be pingable every 5 minutes (not 6 days — use 5-minute interval in UptimeRobot).
```
