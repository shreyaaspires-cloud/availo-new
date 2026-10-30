# Backend Architecture — NexusShare
> Express 5 + Prisma 7 + PostgreSQL + Zod 3 + `@google/genai` (`gemini-2.5-flash`).
> Covers the complete 10-step resource sharing lifecycle, fair-access verification, condition documentation, incident reporting, and immutable audit logging.

---

## Section 1 — Folder Layout

```
backend/
├── src/
│   ├── index.ts                        # Express 5 entry — Helmet, CORS, routes, global error handler
│   ├── routes/
│   │   ├── auth.routes.ts              # POST /register, POST /login, POST /refresh, DELETE /logout
│   │   ├── user.routes.ts              # GET /me, PUT /profile, PUT /password
│   │   ├── resource.routes.ts          # GET /, GET /:id, POST / (ADMIN), PUT /:id (ADMIN), DELETE /:id (ADMIN)
│   │   ├── booking.routes.ts           # GET /, POST /, GET /:id, PATCH /:id/review (ADMIN), POST /:id/check-in, POST /:id/check-out, POST /:id/cancel
│   │   ├── incident.routes.ts          # GET /, POST /, PATCH /:id/resolve (ADMIN)
│   │   ├── audit.routes.ts             # GET / ONLY — NO PUT, PATCH, or DELETE routes ever (AuditLog is APPEND-ONLY)
│   │   ├── ai.routes.ts                # POST /analyze  (uses shared aiLimiter — see rateLimiter.ts)
│   │   ├── upload.routes.ts            # POST / (Cloudinary memoryStorage)
│   │   └── admin.routes.ts             # GET /users, PATCH /users/:id (manage role & qualifications)
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── resource.controller.ts
│   │   ├── booking.controller.ts
│   │   ├── incident.controller.ts
│   │   ├── audit.controller.ts
│   │   ├── ai.controller.ts
│   │   ├── upload.controller.ts
│   │   └── admin.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── resource.service.ts
│   │   ├── booking.service.ts          # Fair-access quota engine, overlap check, lifecycle transactions, waitlist recalculation
│   │   ├── audit.service.ts            # Append-only audit logger (no update/delete methods exposed)
│   │   ├── ai.service.ts               # Gemini 2.5 Flash — analyze() for HTTP route, analyzeInline() for checkout
│   │   └── upload.service.ts           # Cloudinary buffer stream upload
│   ├── middleware/
│   │   ├── auth.middleware.ts          # JWT verify -> req.user
│   │   ├── rbac.middleware.ts          # requireRole('ADMIN')
│   │   ├── rateLimiter.ts              # loginLimiter, registerLimiter, aiLimiter (SHARED), uploadLimiter, globalLimiter
│   │   ├── upload.middleware.ts        # multer.memoryStorage() 5MB max
│   │   └── validate.ts                 # Zod safeParse -> 422 VALIDATION_ERROR
│   ├── lib/
│   │   ├── prisma.ts                   # Prisma 7 client singleton
│   │   ├── gemini.ts                   # GoogleGenAI({ apiKey })
│   │   └── cloudinary.ts               # Cloudinary v2 config
│   ├── schemas/
│   │   ├── auth.schema.ts
│   │   ├── resource.schema.ts
│   │   ├── booking.schema.ts
│   │   ├── incident.schema.ts
│   │   └── ai.schema.ts
│   ├── utils/
│   │   └── response.ts                 # sendSuccess, sendError, paginate
│   └── types/
│       └── index.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── package.json
```

---

## Section 2 — Prisma 7 Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// Strictly TWO roles per v4 Architecture Rules
enum Role {
  USER
  ADMIN
}

enum ResourceCategory {
  LABORATORY
  CLASSROOM
  MAKERSPACE_TOOL
  CAMERA_AV
  TESTING_DEVICE
  COMPUTE_WORKSTATION
}

enum BookingStatus {
  PENDING
  APPROVED
  REJECTED
  WAITLISTED
  CHECKED_IN
  COMPLETED
  CANCELLED
}

enum ConditionState {
  EXCELLENT
  GOOD
  FAIR
  DAMAGED
}

enum IncidentType {
  DAMAGE
  LATE_RETURN
  SCHEDULING_CONFLICT
  UNAUTHORIZED_USE
}

enum IncidentStatus {
  OPEN
  UNDER_REVIEW
  RESOLVED
}

model User {
  id             String   @id @default(cuid())
  email          String   @unique
  name           String
  password       String
  role           Role     @default(USER)
  department     String   @default("General Research")
  qualifications String[] @default([]) // e.g., ["LASER_SAFETY_L1", "CNC_CERT", "BIO_LAB_101"]
  trustScore     Int      @default(100)
  avatarUrl      String?
  active         Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  ownedResources   Resource[]       @relation("ResourceOwner")
  bookings         Booking[]        @relation("BookingUser")
  reviewedBookings Booking[]        @relation("BookingReviewer")
  incidents        IncidentReport[] @relation("IncidentReporter")
  auditLogs        AuditLog[]

  @@map("users")
}

model Resource {
  id                  String           @id @default(cuid())
  name                String
  category            ResourceCategory
  location            String
  description         String
  imageUrl            String?
  requiredCerts       String[]         @default([]) // Qualifications user must hold
  requiresSupervision Boolean          @default(false)
  depositAmount       Float            @default(0)
  maxHoursPerWeek     Int              @default(8)  // Fair-access cap per user per 7 days
  usageRules          String
  currentCondition    ConditionState   @default(EXCELLENT)
  isAvailable         Boolean          @default(true)
  ownerId             String
  owner               User             @relation("ResourceOwner", fields: [ownerId], references: [id])
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt

  bookings            Booking[]
  incidents           IncidentReport[]
  auditLogs           AuditLog[]

  @@map("resources")
}

model Booking {
  id                   String          @id @default(cuid())
  resourceId           String
  resource             Resource        @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  userId               String
  user                 User            @relation("BookingUser", fields: [userId], references: [id], onDelete: Cascade)
  startTime            DateTime
  endTime              DateTime
  purpose              String
  agreedToRules        Boolean         @default(true)
  status               BookingStatus   @default(PENDING)

  // Step 4: Automated System Verification & Fair-Access Engine fields
  meetsEligibility     Boolean         @default(false)
  missingCerts         String[]        @default([])
  userHoursLast7Days   Float           @default(0)
  withinFairQuota      Boolean         @default(true)
  fairnessPriorityScore Int            @default(100) // 100 - (userHoursLast7Days * 12) + (trustScore - 100)
  waitlistPosition     Int?            // Assigned on WAITLISTED; recalculated on any cancel/approval ahead in queue

  // Step 5 & 6: Owner Review fields
  reviewerId           String?
  reviewer             User?           @relation("BookingReviewer", fields: [reviewerId], references: [id])
  decisionReason       String?         // Explainable reason for Approval, Rejection, or Waitlist
  reviewedAt           DateTime?

  // Step 7: Check-In & Initial Condition
  checkedInAt          DateTime?
  checkInCondition     ConditionState?
  checkInNotes         String?
  checkInPhotoUrl      String?

  // Step 8: Return (Check-Out) & Final Condition
  checkedOutAt         DateTime?
  checkOutCondition    ConditionState?
  checkOutNotes        String?
  checkOutPhotoUrl     String?
  aiConditionSummary   String?         // Populated by analyzeInline() in check-out controller (no HTTP limiter consumed)

  createdAt            DateTime        @default(now())
  updatedAt            DateTime        @updatedAt

  incidents            IncidentReport[]
  auditLogs            AuditLog[]

  @@index([resourceId, startTime, endTime])
  @@index([userId, status])
  @@map("bookings")
}

model IncidentReport {
  id             String         @id @default(cuid())
  bookingId      String
  booking        Booking        @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  resourceId     String
  resource       Resource       @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  reportedById   String
  reportedBy     User           @relation("IncidentReporter", fields: [reportedById], references: [id])
  type           IncidentType
  severity       String         @default("MEDIUM") // LOW, MEDIUM, HIGH, CRITICAL
  description    String
  evidenceUrl    String?
  status         IncidentStatus @default(OPEN)
  resolutionNote String?
  resolvedAt     DateTime?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  @@map("incident_reports")
}

// IMMUTABLE — No UPDATE or DELETE operations are ever performed on this table.
// Every write MUST occur inside a prisma.$transaction alongside the state change it records.
model AuditLog {
  id          String    @id @default(cuid())
  action      String    // RESOURCE_LISTED | BOOKING_REQUESTED_AND_VERIFIED | BOOKING_ALLOCATION_DECIDED
                        // | BOOKING_CANCELLED | WAITLIST_RECALCULATED | RESOURCE_CHECKED_IN
                        // | RESOURCE_RETURNED | INCIDENT_REPORTED | INCIDENT_RESOLVED
  actorId     String
  actor       User      @relation(fields: [actorId], references: [id])
  resourceId  String?
  resource    Resource? @relation(fields: [resourceId], references: [id], onDelete: SetNull)
  bookingId   String?
  booking     Booking?  @relation(fields: [bookingId], references: [id], onDelete: SetNull)
  details     String    // Human-readable + JSON summary of before/after state
  createdAt   DateTime  @default(now())
  // NO updatedAt — AuditLog rows are never modified after creation

  @@index([bookingId, createdAt])
  @@index([resourceId, createdAt])
  @@map("audit_logs")
}
```

---

## Section 3 — API Contract & Endpoint Reference

All endpoints return the standard v4 envelope via `sendSuccess` and `sendError`:
- **Success**: `{ success: true, data: T, message?: string }`
- **Error**: `{ success: false, error: string, code?: string, details?: Record<string, string[]> }`

> **AuditLog is APPEND-ONLY**: There are deliberately no `PUT`, `PATCH`, or `DELETE` routes for `/api/audit`. The audit controller exposes only `GET /api/audit`. Any future contributor must NOT add mutation routes here.

| Method | Route | Auth | Role | Lifecycle Step & Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | No | — | Register new user |
| `POST` | `/api/auth/login` | No | — | Login -> set `httpOnly` cookie + return `{ user, accessToken }` |
| `POST` | `/api/auth/refresh` | No | — | Silent refresh via `httpOnly` cookie |
| `DELETE` | `/api/auth/logout` | Yes | `USER` | Clear refresh token cookie |
| `GET` | `/api/user/me` | Yes | `USER` | Current user profile, qualifications, and trust score |
| `PUT` | `/api/user/profile` | Yes | `USER` | Update name, department, avatarUrl |
| `PUT` | `/api/user/password` | Yes | `USER` | Update password |
| `GET` | `/api/resources` | Yes | `USER` | **Step 2**: List resources (paginated) + computed user eligibility |
| `GET` | `/api/resources/:id` | Yes | `USER` | **Step 2**: Resource detail + user's live quota & eligibility check |
| `POST` | `/api/resources` | Yes | `ADMIN` | **Step 1**: Owner lists a new space/device/tool + writes `AuditLog` |
| `PUT` | `/api/resources/:id` | Yes | `ADMIN` | **Step 1**: Owner updates conditions/availability + writes `AuditLog` |
| `GET` | `/api/bookings` | Yes | `USER` | List bookings (User sees own; Admin can pass `?scope=all` to review all) |
| `GET` | `/api/bookings/:id` | Yes | `USER` | Single booking with `resource`, `user`, `incidents`, and `auditLogs` |
| `POST` | `/api/bookings` | Yes | `USER` | **Steps 3 & 4**: Submit request -> runs automated eligibility & fair-quota verification -> writes `AuditLog` |
| `PATCH` | `/api/bookings/:id/review` | Yes | `ADMIN` | **Steps 5 & 6**: Approve, Reject, or Waitlist with mandatory `decisionReason` -> writes `AuditLog` -> triggers `recalculateWaitlistPositions()` on APPROVED |
| `POST` | `/api/bookings/:id/check-in` | Yes | `USER` | **Step 7**: Record initial condition & photo -> status `CHECKED_IN` -> writes `AuditLog` |
| `POST` | `/api/bookings/:id/check-out` | Yes | `USER` | **Step 8**: Record final condition & photo -> calls `analyzeInline()` (not `aiLimiter`-counted) -> auto-creates `IncidentReport` if `DAMAGED` -> writes `AuditLog` |
| `POST` | `/api/bookings/:id/cancel` | Yes | `USER` | Cancel booking -> writes `AuditLog` -> triggers `recalculateWaitlistPositions()` for same resource |
| `GET` | `/api/incidents` | Yes | `USER` | **Step 9**: List incidents (paginated) |
| `POST` | `/api/incidents` | Yes | `USER` | **Step 9**: Report damage, delay, or conflict -> writes `AuditLog` |
| `PATCH` | `/api/incidents/:id/resolve` | Yes | `ADMIN` | **Step 9**: Resolve incident with resolution note -> writes `AuditLog` |
| `GET` | `/api/audit` | Yes | `USER` | **Step 10**: Paginated immutable audit history (`?bookingId=` or `?resourceId=`) — **GET ONLY, no mutation routes** |
| `POST` | `/api/ai/analyze` | Yes | `USER` | Gemini 2.5 Flash analysis — uses shared `aiLimiter` (10 req/min across this route only; checkout uses `analyzeInline()` separately) |
| `POST` | `/api/upload` | Yes | `USER` | Upload check-in/out photo to Cloudinary (`memoryStorage`, field `"file"`) |
| `GET` | `/api/admin/users` | Yes | `ADMIN` | List all users (paginated) |
| `PATCH` | `/api/admin/users/:id` | Yes | `ADMIN` | Grant/update user `qualifications`, `role`, or `active` status |
| `GET` | `/health` | No | — | Health check for UptimeRobot (monitored every 5 minutes) |

---

## Section 4 — Core Business Logic: Fair-Access & Verification Engine (`booking.service.ts`)

```typescript
// src/services/booking.service.ts
import { prisma } from '../lib/prisma';

export const verifyEligibilityAndFairness = async (
  userId: string,
  resourceId: string,
  startTime: Date,
  endTime: Date
) => {
  const [user, resource] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.resource.findUniqueOrThrow({ where: { id: resourceId } }),
  ]);

  // 1. Qualification Check
  const missingCerts = resource.requiredCerts.filter(
    (reqCert) => !user.qualifications.includes(reqCert)
  );
  const meetsEligibility = missingCerts.length === 0;

  // 2. Rolling 7-Day Fair-Access Quota Calculation
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentBookings = await prisma.booking.findMany({
    where: {
      userId,
      resourceId,
      status: { in: ['APPROVED', 'CHECKED_IN', 'COMPLETED'] },
      startTime: { gte: sevenDaysAgo },
    },
  });

  const userHoursLast7Days = recentBookings.reduce((acc, b) => {
    const hrs = (b.endTime.getTime() - b.startTime.getTime()) / (1000 * 60 * 60);
    return acc + hrs;
  }, 0);

  const requestedHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  const withinFairQuota = userHoursLast7Days + requestedHours <= resource.maxHoursPerWeek;

  // 3. Explainable Fairness Priority Score (0-100)
  // Users with 0 recent hours get 100 priority; heavy users get lower priority
  const fairnessPriorityScore = Math.max(
    0,
    Math.min(100, Math.round(100 - userHoursLast7Days * 12 + (user.trustScore - 100)))
  );

  // 4. Time Slot Conflict Detection
  const conflictingBookings = await prisma.booking.count({
    where: {
      resourceId,
      status: { in: ['APPROVED', 'CHECKED_IN'] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  return {
    meetsEligibility,
    missingCerts,
    userHoursLast7Days: Number(userHoursLast7Days.toFixed(1)),
    requestedHours: Number(requestedHours.toFixed(1)),
    withinFairQuota,
    fairnessPriorityScore,
    hasTimeConflict: conflictingBookings > 0,
  };
};
```

---

## Section 5 — Waitlist Recalculation Service (`recalculateWaitlistPositions`)

> **When to call**: Inside `booking.controller.ts` — in the same `prisma.$transaction` as:
> 1. `PATCH /api/bookings/:id/review` when status is set to `APPROVED` (the approved booking leaves the queue, positions shift down).
> 2. `POST /api/bookings/:id/cancel` when the cancelled booking had `status === 'WAITLISTED'` (gap in queue must be closed).
>
> **Known simplification**: Positions are recalculated by re-ranking all remaining `WAITLISTED` bookings for the same `resourceId` ordered by `fairnessPriorityScore DESC`. This is a clean, explainable algorithm. Automated promotion (moving position-1 to `APPROVED` automatically on cancellation) is out of scope for this hackathon and is listed in the Future Roadmap.

```typescript
// src/services/booking.service.ts  (append below verifyEligibilityAndFairness)

/**
 * Recalculates waitlistPosition for all WAITLISTED bookings on a given resource.
 * Call this inside the same prisma.$transaction whenever a booking is APPROVED or CANCELLED.
 * Ranks by fairnessPriorityScore DESC so the most "fair" user is always position 1.
 */
export const recalculateWaitlistPositions = async (
  resourceId: string,
  tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
) => {
  // Fetch all WAITLISTED bookings for this resource, best score first
  const waitlisted = await tx.booking.findMany({
    where: { resourceId, status: 'WAITLISTED' },
    orderBy: { fairnessPriorityScore: 'desc' },
    select: { id: true },
  });

  // Assign sequential positions: 1 = highest priority (highest score)
  const updates = waitlisted.map((b, index) =>
    tx.booking.update({
      where: { id: b.id },
      data: { waitlistPosition: index + 1 },
    })
  );

  await Promise.all(updates);

  // Return count for audit log details
  return waitlisted.length;
};
```

### Usage example inside `booking.controller.ts`:

```typescript
// Inside PATCH /api/bookings/:id/review — when status === 'APPROVED'
const result = await prisma.$transaction(async (tx) => {
  const booking = await tx.booking.update({
    where: { id: bookingId },
    data: { status: 'APPROVED', reviewerId: req.user!.userId, decisionReason, reviewedAt: new Date() },
  });

  // Recalculate positions for remaining waitlisted bookings on this resource
  const remainingWaitlisted = await recalculateWaitlistPositions(booking.resourceId, tx);

  await tx.auditLog.create({
    data: {
      action: 'BOOKING_ALLOCATION_DECIDED',
      actorId: req.user!.userId,
      resourceId: booking.resourceId,
      bookingId: booking.id,
      details: `Booking APPROVED. ${remainingWaitlisted} waitlisted booking(s) re-ranked.`,
    },
  });

  // Also write a WAITLIST_RECALCULATED audit entry if any positions shifted
  if (remainingWaitlisted > 0) {
    await tx.auditLog.create({
      data: {
        action: 'WAITLIST_RECALCULATED',
        actorId: req.user!.userId,
        resourceId: booking.resourceId,
        bookingId: null,
        details: `Waitlist recalculated after booking ${booking.id} was APPROVED. ${remainingWaitlisted} booking(s) re-ranked by fairnessPriorityScore DESC.`,
      },
    });
  }

  return booking;
});
```

---

## Section 6 — Zod Validation Schemas

```typescript
// src/schemas/resource.schema.ts
import { z } from 'zod';

export const createResourceSchema = z.object({
  name: z.string().min(3).max(120).trim(),
  category: z.enum([
    'LABORATORY',
    'CLASSROOM',
    'MAKERSPACE_TOOL',
    'CAMERA_AV',
    'TESTING_DEVICE',
    'COMPUTE_WORKSTATION',
  ]),
  location: z.string().min(2).max(120).trim(),
  description: z.string().min(10).max(1000).trim(),
  imageUrl: z.string().url().optional(),
  requiredCerts: z.array(z.string().trim()).default([]),
  requiresSupervision: z.boolean().default(false),
  depositAmount: z.number().min(0).default(0),
  maxHoursPerWeek: z.number().int().min(1).max(40).default(8),
  usageRules: z.string().min(10).max(1000).trim(),
});

// src/schemas/booking.schema.ts
export const createBookingSchema = z.object({
  resourceId: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  purpose: z.string().min(10, 'Please explain why you need this resource (min 10 chars)').max(500).trim(),
  agreedToRules: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the resource usage conditions' }),
  }),
});

export const reviewBookingSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'WAITLISTED']),
  decisionReason: z.string().min(5, 'Provide a clear, explainable reason for the user').max(500).trim(),
});

export const checkInSchema = z.object({
  checkInCondition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED']),
  checkInNotes: z.string().min(5).max(500).trim(),
  checkInPhotoUrl: z.string().url().optional(),
});

export const checkOutSchema = z.object({
  checkOutCondition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED']),
  checkOutNotes: z.string().min(5).max(500).trim(),
  checkOutPhotoUrl: z.string().url().optional(),
  reportIncident: z.boolean().default(false),
  incidentType: z.enum(['DAMAGE', 'LATE_RETURN', 'SCHEDULING_CONFLICT', 'UNAUTHORIZED_USE']).optional(),
  incidentDescription: z.string().max(500).optional(),
});
```

---

## Section 7 — AI Service (`gemini-2.5-flash` via `@google/genai`)

> **Two distinct call paths — one for user-triggered HTTP analysis, one for automatic inline checkout analysis:**
>
> | Method | Used by | Rate-limiter consumed? | When |
> |---|---|---|---|
> | `analyze(content)` | `ai.controller.ts` → `POST /api/ai/analyze` | **Yes** — `aiLimiter` (10 req/min) | User/Admin clicks "Run AI Condition & Fairness Audit" |
> | `analyzeInline(content)` | `booking.controller.ts` → `POST /api/bookings/:id/check-out` | **No** — direct service call, not routed through `/api/ai/analyze` | Auto-triggered when checkout condition is `DAMAGED` |
>
> This separation ensures the `aiLimiter` budget (10 req/min, safely under Gemini's 15 RPM free cap) is not consumed by automatic system events, leaving the full quota available for manual user-triggered audits. Both methods call the same `genAI.models.generateContent` under the hood.

```typescript
// src/services/ai.service.ts
import { genAI } from '../lib/gemini';

const SYSTEM_PROMPT = `You are the NexusShare Institutional Resource Trust & Audit AI.
Analyze the following resource booking, condition handoff (Check-In vs Check-Out), or fair-access allocation scenario.
Provide a concise, structured assessment with:
1. Summary of Findings (Condition Delta or Eligibility/Fairness Status)
2. Risk / Damage Assessment (None, Low, Medium, High)
3. Recommended Action for the Lab Manager & User`;

/**
 * Called by POST /api/ai/analyze via ai.controller.ts.
 * Counts against aiLimiter (10 req/min).
 */
export const analyze = async (content: string): Promise<{ result: string }> => {
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash', // Strictly gemini-2.5-flash (2.0-flash is deprecated)
      contents: `${SYSTEM_PROMPT}\n\nScenario Data:\n${content}`,
    });
    const text = response.text ?? '';
    if (!text) throw new Error('Empty response from Gemini');
    return { result: text };
  } catch (geminiErr) {
    console.error('[AI] Gemini API error (analyze):', geminiErr);
    const err = new Error('AI service temporarily unavailable') as Error & { code: string };
    err.code = 'AI_UNAVAILABLE';
    throw err;
  }
};

/**
 * Called internally by booking.controller.ts during POST /api/bookings/:id/check-out.
 * Does NOT go through the HTTP /api/ai/analyze route, so aiLimiter is NOT consumed.
 * On failure: logs the error and stores null in aiConditionSummary — checkout is NOT blocked.
 */
export const analyzeInline = async (content: string): Promise<string | null> => {
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${SYSTEM_PROMPT}\n\nScenario Data:\n${content}`,
    });
    return response.text ?? null;
  } catch (geminiErr) {
    // Non-fatal: log and continue — checkout must not be blocked by AI failure
    console.error('[AI] Gemini inline analysis failed (non-fatal):', geminiErr);
    return null;
  }
};
```

### Usage in `booking.controller.ts` (`check-out`):

```typescript
// Inside POST /api/bookings/:id/check-out
import { analyzeInline } from '../services/ai.service';

// Build content string from booking + check-in vs check-out diff
const aiContent = `Resource: ${booking.resource.name}.
Check-In: ${booking.checkInCondition} ('${booking.checkInNotes}').
Check-Out: ${checkOutCondition} ('${checkOutNotes}').
User 7-day hours: ${booking.userHoursLast7Days}/${booking.resource.maxHoursPerWeek}.`;

// Fire inline AI — does NOT consume aiLimiter quota
const aiSummary = await analyzeInline(aiContent);

// All writes are atomic
const result = await prisma.$transaction(async (tx) => {
  const updated = await tx.booking.update({
    where: { id: bookingId },
    data: {
      status: 'COMPLETED',
      checkedOutAt: new Date(),
      checkOutCondition,
      checkOutNotes,
      checkOutPhotoUrl,
      aiConditionSummary: aiSummary, // null if AI call failed — that's acceptable
    },
  });

  // Auto-create IncidentReport if condition degraded or user flagged it
  if (checkOutCondition === 'DAMAGED' || reportIncident) {
    await tx.incidentReport.create({
      data: {
        bookingId: updated.id,
        resourceId: updated.resourceId,
        reportedById: req.user!.userId,
        type: incidentType ?? 'DAMAGE',
        severity: checkOutCondition === 'DAMAGED' ? 'HIGH' : 'MEDIUM',
        description: incidentDescription ?? checkOutNotes,
        evidenceUrl: checkOutPhotoUrl,
      },
    });

    await tx.resource.update({
      where: { id: updated.resourceId },
      data: { currentCondition: checkOutCondition },
    });

    await tx.auditLog.create({
      data: {
        action: 'INCIDENT_REPORTED',
        actorId: req.user!.userId,
        resourceId: updated.resourceId,
        bookingId: updated.id,
        details: `Auto-incident: condition degraded from ${updated.checkInCondition} to ${checkOutCondition}.`,
      },
    });
  }

  await tx.auditLog.create({
    data: {
      action: 'RESOURCE_RETURNED',
      actorId: req.user!.userId,
      resourceId: updated.resourceId,
      bookingId: updated.id,
      details: `Returned in ${checkOutCondition} condition. AI summary: ${aiSummary ? 'generated' : 'unavailable'}.`,
    },
  });

  return updated;
});
```

---

## Section 8 — Rate Limiter Configuration (`rateLimiter.ts`)

> **Key rule**: The `aiLimiter` is applied **only** to `POST /api/ai/analyze`. The internal `analyzeInline()` call in checkout goes directly to the AI service without passing through this middleware. Both paths share the same underlying Gemini API key and its 15 RPM quota, so total combined throughput under normal usage stays well within limits (10 user-triggered + ~1–2 inline per minute maximum).

```typescript
// src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 5,
  message: { success: false, error: 'Too many login attempts. Please try again in 15 minutes.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max: 3,
  message: { success: false, error: 'Registration limit reached. Please try again in 1 hour.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Applied ONLY to POST /api/ai/analyze (user-triggered HTTP requests).
 * NOT applied to analyzeInline() calls inside booking.controller.ts.
 * 10 req/min keeps total HTTP-triggered Gemini calls safely under the 15 RPM free cap.
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 10,
  message: { success: false, error: 'AI rate limit reached. Please wait a moment.', code: 'AI_RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 5,
  message: { success: false, error: 'Upload limit reached. Please wait a moment.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
```
