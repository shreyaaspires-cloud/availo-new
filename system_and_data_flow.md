# System & Data Flow — NexusShare
> End-to-end data flows for the 10-Step Resource Sharing Lifecycle, Auth, Fair-Access Allocation, Check-In/Out Condition Handoffs, Gemini 2.5 Flash Auditing, and Waitlist Recalculation.

---

## Section 1 — Complete 10-Step Resource Sharing Lifecycle Flow

```
[STEP 1: LIST]        ADMIN creates Resource (requiredCerts: ["LASER_L1"], maxHoursPerWeek: 6)
                             |--> Prisma Transaction: INSERT Resource + INSERT AuditLog("RESOURCE_LISTED")
                             v
[STEP 2: DISCOVER]    USER views /resources -> Backend compares user.qualifications vs resource.requiredCerts
                             |--> UI renders Badge: "Eligible (Cert Verified)" + "Quota: 2/6 hrs used this week"
                             v
[STEP 3: REQUEST]     USER submits POST /api/bookings { resourceId, startTime, endTime, purpose, agreedToRules }
                             v
[STEP 4: VERIFY]      Backend BookingService runs automated verification:
                             |-- Checks missingCerts ([])
                             |-- Calculates rolling 7-day usage (2 hrs) + requested (2 hrs) <= 6 hrs (PASS)
                             |-- Computes fairnessPriorityScore = 100 - (2 * 12) = 76
                             |-- Detects time slot overlap with other APPROVED bookings
                             |--> Prisma Transaction: INSERT Booking(status: PENDING) + INSERT AuditLog("BOOKING_REQUESTED_AND_VERIFIED")
                             v
[STEP 5: REVIEW]      ADMIN opens Approval Queue -> Sees Verification Badge, Fairness Score (76/100), & Overlap warning
                             v
[STEP 6: ALLOCATE]    ADMIN submits PATCH /api/bookings/:id/review { status, decisionReason }
                             |-- If APPROVED:   status = APPROVED
                             |                  --> recalculateWaitlistPositions(resourceId, tx)  [see Section 3]
                             |                  --> INSERT AuditLog("BOOKING_ALLOCATION_DECIDED")
                             |                  --> INSERT AuditLog("WAITLIST_RECALCULATED") [if any waitlisted remain]
                             |-- If WAITLISTED: status = WAITLISTED, waitlistPosition assigned by fairnessPriorityScore DESC
                             |                  --> INSERT AuditLog("BOOKING_ALLOCATION_DECIDED")
                             |-- If REJECTED:   status = REJECTED
                             |                  --> INSERT AuditLog("BOOKING_ALLOCATION_DECIDED")
                             |--> All writes inside prisma.$transaction
                             v
[STEP 7: CHECK-IN]    USER arrives at lab -> Uploads pre-use photo -> POST /api/bookings/:id/check-in
                             |--> Records checkInCondition, checkInNotes, checkInPhotoUrl, checkedInAt
                             |--> Prisma Transaction: UPDATE Booking(CHECKED_IN) + INSERT AuditLog("RESOURCE_CHECKED_IN")
                             v
[STEP 8: RETURN]      USER finishes work -> Uploads post-use photo -> POST /api/bookings/:id/check-out
                             |--> Records checkOutCondition, checkOutNotes, checkOutPhotoUrl, checkedOutAt
                             |--> Calls aiService.analyzeInline() BEFORE the prisma.$transaction  [see Section 4B]
                             v
[STEP 9: INCIDENT]    Did checkOutCondition degrade (e.g., EXCELLENT -> DAMAGED) or did user flag an issue?
                             |-- YES: Auto-creates IncidentReport(OPEN) + updates Resource.currentCondition = DAMAGED
                             |        + stores aiConditionSummary (from analyzeInline — null if AI unavailable)
                             |-- NO:  Stores aiConditionSummary (from analyzeInline — null if AI unavailable)
                             |--> Prisma Transaction: UPDATE Booking(COMPLETED)
                             |                        + INSERT AuditLog("RESOURCE_RETURNED")
                             |                        + INSERT AuditLog("INCIDENT_REPORTED") [if DAMAGED]
                             v
[STEP 10: AUDIT]      Both USER and ADMIN open AuditTimelineDrawer -> GET /api/audit?bookingId=:id
                             |--> Displays chronological, tamper-evident log of Steps 1 through 9 with timestamps & actors
                             |--> AuditLog is APPEND-ONLY — no PUT/PATCH/DELETE routes exist for this table
```

---

## Section 2 — Auth & Silent Refresh Flow

```
Browser (Next.js 16)                          Backend (Express 5)
   |                                                   |
   |  1. Page load -> AuthProvider mounts              |
   |  POST /api/auth/refresh (httpOnly cookie sent)    |
   |-------------------------------------------------->|
   |                                                   |  Verify refreshToken JWT
   |                                                   |  Rotate tokens (15m access, 7d refresh)
   |<--------------------------------------------------|
   |  200 { data: { user, accessToken } }              |
   |  authStore.setAuth(user, accessToken) (in memory) |
   |  authStore.setHydrated()                          |
```

---

## Section 3 — Waitlist Recalculation Flow

> Triggered inside `prisma.$transaction` whenever a booking is **APPROVED** (leaves the queue) or **CANCELLED** from `WAITLISTED` status (creates a gap in the queue).

```
Trigger event: Booking X is APPROVED  (or CANCELLED from WAITLISTED)
       |
       v
booking.controller.ts calls recalculateWaitlistPositions(resourceId, tx) inside prisma.$transaction
       |
       v
booking.service.ts:
  1. Query all WAITLISTED bookings for this resourceId
     ORDER BY fairnessPriorityScore DESC
  2. Re-assign waitlistPosition = index + 1  (position 1 = highest fairness score)
  3. Bulk update all affected Booking rows via Promise.all(updates)
       |
       v
Returns count of re-ranked bookings
       |
       v
booking.controller.ts writes AuditLog entry:
  action: 'WAITLIST_RECALCULATED'
  details: "Waitlist recalculated after booking X was APPROVED/CANCELLED.
            N booking(s) re-ranked by fairnessPriorityScore DESC."
  [only written when remainingWaitlisted > 0]
       |
       v
Frontend: useBookings() query invalidated -> /bookings re-renders with updated positions
  User sees: "Waitlist Position: 1 (was 2)" with updated fairness explanation
```

**Known scope boundary**: Automatic promotion (auto-advancing position-1 user from `WAITLISTED` → `APPROVED`) is a Future Roadmap item. Admin still manually reviews and approves after seeing the refreshed queue.

---

## Section 4 — AI Analysis: Two Distinct Paths

### Path A — User-Triggered HTTP Analysis (`/api/ai/analyze`)

```
User or Admin clicks "Run AI Condition & Fairness Audit"
       |
       v
Frontend: useAnalyzeContent() mutation -> POST /api/ai/analyze
  Payload: {
    content: "Resource: Prusa Pro 3D Printer. Check-In: EXCELLENT ('Clean nozzle and bed').
              Check-Out: FAIR ('Resin residue on build plate, slight scratch on PEI sheet').
              User 7-day hours: 4/8."
  }
       |
       v
Backend:
  1. aiLimiter (10 req/min — safely below Gemini 2.5 Flash 15 RPM free limit)
  2. authenticateToken
  3. validate(aiAnalyzeSchema)
  4. aiService.analyze(content) -> @google/genai -> model: 'gemini-2.5-flash'
       |-- Success (2-5s reasoning): sendSuccess(res, { result })
       +-- Failure: catches error -> returns 503 { success: false, error: 'AI temporarily unavailable', code: 'AI_UNAVAILABLE' }
```

### Path B — Automatic Inline Analysis during Check-Out

```
User submits POST /api/bookings/:id/check-out
       |
       v
booking.controller.ts builds aiContent string:
  "Resource: <name>. Check-In: <condition> ('<notes>'). Check-Out: <condition> ('<notes>').
   User 7-day hours: <X>/<maxHoursPerWeek>."
       |
       v
Calls aiService.analyzeInline(aiContent)  ← Direct service call — does NOT route through /api/ai/analyze
                                            ← aiLimiter is NOT consumed by this call
       |-- Success: aiSummary = response.text
       +-- Failure: aiSummary = null  (non-fatal — checkout is never blocked by AI failure)
       |
       v
prisma.$transaction:
  UPDATE Booking { status: COMPLETED, aiConditionSummary: aiSummary | null, ... }
  + optional IncidentReport creation
  + AuditLog entries
       |
       v
sendSuccess(res, updatedBooking)

NOTE ON QUOTA:
  Path A (HTTP) is capped at 10 req/min by aiLimiter.
  Path B (inline) adds at most 1–2 req/min during normal demo usage.
  Combined total stays comfortably under Gemini's 15 RPM free-tier cap.
```

---

## Section 5 — Check-In / Check-Out Photo Upload Flow (`memoryStorage`)

```
User selects condition photo (JPEG/PNG/WebP <= 5MB)
       |
       v
Frontend validates size <= 5MB & MIME type
       |  FormData: formData.append('file', file)  <-- MUST be named "file"
       |  POST /api/upload
       v
Backend:
  1. uploadLimiter (5 req/min)
  2. authenticateToken
  3. uploadMiddleware (multer.memoryStorage()) -> req.file.buffer
  4. uploadBuffer(req.file.buffer, 'nexusshare/conditions') -> Cloudinary upload_stream
       |
       v
Returns { success: true, data: { url: "https://res.cloudinary.com/...", publicId: "..." } }
       |
       v
Frontend passes returned `url` into `checkInPhotoUrl` or `checkOutPhotoUrl`
```

---

## Section 6 — Demo Script (3-Minute Judging Window)

| Time | Action | What Judges See |
|---|---|---|
| **00:00 – 00:30** | **Problem & Pitch** | Open Landing Page (`/`). Show the 10-Step Lifecycle overview. Click **Login as Lab Manager (Admin)** or **Login as Researcher (Demo User)**. |
| **00:30 – 01:15** | **Steps 1–4: Discovery, Eligibility & Fair Quota** | Logged in as `demo@yourapp.com`, browse `/resources`. Point out the green **"Eligible: LASER_SAFETY_L1 Verified"** badge and the **"Fair-Access Quota: 2 / 8 hrs used this week (Priority Score: 76/100)"**. Submit a booking request for the **Haas 5-Axis CNC Machining Center**. |
| **01:15 – 02:00** | **Steps 5–6: Owner Review, Fair Waitlist & Recalculation** | Switch to `admin@yourapp.com`. In `/admin`, inspect the automated verification report. Approve the booking with a note. Show how the pre-seeded **WAITLISTED** booking (Booking 3) automatically updates its position after approval — its `waitlistPosition` is visible in the queue. |
| **02:00 – 02:40** | **Steps 7–9: Check-In, Return, Incident & Inline AI** | Open `/bookings`. Perform **Check-In** on Booking 1 (initial condition: `EXCELLENT`), then **Check-Out / Return** (final condition: `FAIR` with minor wear note). The system automatically calls `analyzeInline()` and populates `aiConditionSummary`. Click **"AI Condition Diff Audit"** (`/api/ai/analyze`) to run an additional user-triggered Gemini 2.5 Flash analysis live. |
| **02:40 – 03:00** | **Step 10: Immutable Audit History** | Click **"View Audit Trail"** on the booking. Show all timestamped, tamper-evident lifecycle events from listing to return, including the `WAITLIST_RECALCULATED` entry from Step 6. |
