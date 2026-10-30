# Product Requirements Document (PRD) — NexusShare
> **One-Line Pitch**: A trusted, auditable platform that helps institutions and communities safely share underused spaces, equipment, and technical resources with automated eligibility verification, fair-access allocation, and AI-assisted condition documentation.

---

## Section 1 — Problem Statement

Colleges, laboratories, makerspaces, and small businesses own high-value technical resources (CNC machines, electron microscopes, media studios, testing rigs) that sit idle up to 70% of the time. Meanwhile, nearby students, researchers, and early-stage creators cannot afford to buy or privately rent this equipment. Standard calendar booking tools fail completely in this environment because they lack qualification verification, pre/post-use condition handoffs, anti-monopolization rules, and immutable audit trails required to protect institutional property.

- **Problem Source**: Institutional & Community Resource Sharing Challenge
- **Who Experiences It**: University lab managers, makerspace directors, student researchers, and hardware startups.

---

## Section 2 — Problem Analysis

| Dimension | Details |
|---|---|
| **Root Cause** | High liability, fear of unrecorded damage, lack of automated certification checks, and resource hogging by a few users. |
| **Who is Affected** | Institutional asset owners (who lock resources away) and students/researchers (who are blocked from innovation). |
| **Scale of Problem** | Billions of dollars in university and community lab equipment sit underutilized globally while local innovators lack access. |
| **Current Solutions** | Google Calendar, spreadsheets, paper sign-in sheets, or basic room-booking SaaS (e.g., Calendly, Robin). |
| **Why Current Solutions Fail** | They only check time availability. They do not verify safety certifications, prevent one group from monopolizing a tool, capture before/after photo evidence, or maintain an auditable chain of custody. |
| **Our Opportunity** | Build a **trust-first lifecycle engine** that automates eligibility checks, enforces fair-access quotas, and uses Gemini 2.5 Flash to analyze condition logs and explain allocation priority. |

---

## Section 3 — Solution Overview

**What it does and for whom:**
**NexusShare** enables verified institutional owners (Admins/Managers) to list specialized spaces and equipment with strict eligibility criteria, usage quotas, and supervision rules. Researchers, students, and creators (Users) can discover resources, upload required safety certifications, and submit booking requests that are automatically vetted for eligibility and fair-access compliance before the manager approves them.

**How it's different from existing solutions:**
Unlike simple calendar apps, NexusShare governs the **entire 10-step physical custody lifecycle**. It prevents resource monopolization through an explainable Fair-Access Quota & Waitlist Engine, mandates digital check-in and check-out condition documentation (with photo uploads), utilizes **Gemini 2.5 Flash** to compare pre-use and post-use condition reports to flag anomalies or damage, and writes every single state transition to an immutable, auditable activity ledger.

---

## Section 4 — User Personas

### Persona 1 — Primary User (The Resource Seeker)
| Field | Detail |
|---|---|
| **Name** | Maya Lin |
| **Role / Context** | Final-year Robotics Researcher / Makerspace Member |
| **Tech Literacy** | High |
| **Main Pain Point** | Needs a 5-axis CNC mill and Oscilloscope for 6 hours, but lab managers don't trust paper sign-ups, and one senior lab group always hogs the machine. |
| **What Success Looks Like** | Sees exact safety requirements, proves her certification once, books a fair slot (or joins a transparent waitlist), logs check-in/out photos in 30 seconds, and builds a trusted borrower score. |
| **Primary Device** | Desktop (for discovery/booking) & Mobile (for on-site check-in/out condition photos). |

### Persona 2 — Secondary User / Admin (The Institutional Owner / Manager)
| Field | Detail |
|---|---|
| **Name** | Dr. Aris Thorne |
| **Role / Context** | University Fabrication Lab Director |
| **Pain Point** | Spends 10+ hours/week manually checking if students passed safety training, chasing overdue equipment, and arguing over who broke a $4,000 laser cutter lens. |
| **What Success Looks Like** | Lists equipment with mandatory qualification tags and weekly hour caps; reviews pre-vetted requests with one click; gets instant AI condition comparisons upon return; has a complete audit log for university compliance. |

---

## Section 5 — User Stories

| ID | Persona | Story | Priority |
|---|---|---|---|
| **US-01** | Admin (Owner) | As an Owner, I want to list a space or equipment with category, hourly weekly cap, required qualifications, and supervision rules so that only qualified users request it. | M |
| **US-02** | User (Seeker) | As a User, I want to browse available resources and immediately see if I meet the eligibility & fair-usage criteria before requesting. | M |
| **US-03** | User (Seeker) | As a User, I want to submit a booking request with my project purpose, time window, and qualification proof so the owner can review it. | M |
| **US-04** | System / Admin | As an Owner, I want the system to automatically check the user's weekly quota and certifications, and either let me Approve, Reject, or place them on a Fair-Access Waitlist with a clear explanation. | M |
| **US-05** | User (Seeker) | As a User, I want to complete a digital Check-In with initial condition notes and photo proof when taking custody of the resource. | M |
| **US-06** | User (Seeker) | As a User, I want to complete a digital Check-Out (Return) with final condition notes, photo proof, and optional damage/delay reporting. | M |
| **US-07** | Admin / User | As an Owner or User, I want Gemini 2.5 Flash to analyze check-in vs. check-out condition logs and summarize any discrepancies or fairness priority reasons. | M |
| **US-08** | Admin / User | As an Owner or User, I want to view an immutable Audit Trail of every action (request, approval, waitlist, check-in, return, incident) for full accountability. | M |
| **US-09** | Admin (Owner) | As an Owner, I want to record and resolve incidents (damage, late return, scheduling conflict) and manage user qualifications. | S |

---

## Section 6 — Functional Requirements (Mapped to the 10-Step Lifecycle)

| ID | Lifecycle Step | Requirement | Verification in Demo |
|---|---|---|---|
| **FR-01** | 1. List Resource | Admin can create/edit a resource with type (`SPACE`, `EQUIPMENT`, `TOOL`), required qualification tag, max hours per user/week, and deposit/supervision flags. | Create or view a listed "Prusa Pro 3D Printer / Laser Lab" in the UI. |
| **FR-02** | 2. Discover & Check Eligibility | User can filter resources and view an instant Eligibility Badge ("Eligible", "Missing Qualification", or "Weekly Quota Reached"). | Log in as `demo@yourapp.com` and view eligibility indicator on resource card. |
| **FR-03** | 3. Submit Request | User submits a booking with start/end time, purpose, and qualification reference. | Submit booking form on resource detail page. |
| **FR-04** | 4. System Verification | Backend automatically verifies time conflicts, user's active certifications, and rolling 7-day usage hours (Fair-Access check). | System attaches verification badge & fairness score to the booking record. |
| **FR-05** | 5 & 6. Review & Allocate | Admin can Approve, Reject (with mandatory reason), or Waitlist (if slot is contested, ordered by Fair-Access Priority Score). | Admin clicks Approve or Waitlist; status updates and logs an audit entry. |
| **FR-06** | 7. Check-In & Initial Condition | Approved user clicks "Check In", uploads initial photo (via Cloudinary), selects condition rating (`EXCELLENT`, `GOOD`, `FAIR`), and notes pre-existing wear. | Perform Check-In on an approved booking; status becomes `CHECKED_IN`. |
| **FR-07** | 8. Return & Final Condition | User clicks "Check Out / Return", uploads post-use photo, logs final condition, and optionally flags a problem. | Perform Check-Out; status becomes `COMPLETED` (or `INCIDENT_REPORTED`). |
| **FR-08** | 9. Incident & Conflict Handling | Any damage discrepancy or delay creates an `IncidentReport`. AI (`gemini-2.5-flash`) compares pre/post condition logs and assesses severity. | Trigger AI Condition & Fairness Analyzer; view structured AI assessment. |
| **FR-09** | 10. Auditable Activity History | Every mutation writes an immutable `AuditLog` record visible on the Booking Timeline to both User and Admin. | Open the Audit History drawer/timeline on the booking and inspect all 10 steps. |

---

## Section 7 — Non-Functional Requirements

| Category | Requirement | Target |
|---|---|---|
| **Performance** | Standard CRUD & Eligibility Check p95 response time | < 300ms |
| **AI Latency** | Gemini 2.5 Flash condition & fairness analysis | 2000ms – 5000ms (live reasoning) |
| **Security** | Auth standard | JWT in memory + `httpOnly` refresh cookie + `bcrypt` (10 rounds) + RBAC (`USER`, `ADMIN`) |
| **Auditability** | Append-only audit logs | `AuditLog` table has no `UPDATE` or `DELETE` endpoints exposed |
| **Accessibility** | WCAG standard | AA minimum (4.5:1 contrast, full keyboard nav, ARIA labels) |

---

## Section 8 — Feature Scope

### In Scope (P0 — Locked for Hackathon)
- Two RBAC roles (`USER` for resource seekers/borrowers, `ADMIN` for institutional owners/managers).
- Resource Catalog with eligibility criteria, qualification tags, and fair-usage weekly hour caps.
- Automated Eligibility & Fair-Access Priority calculation (penalizes heavy recent usage so new users get fair access).
- Full Booking Lifecycle State Machine: `PENDING` -> `APPROVED` / `REJECTED` / `WAITLISTED` -> `CHECKED_IN` -> `COMPLETED` / `CANCELLED`.
- Pre-use Check-In and Post-use Check-Out forms with Cloudinary image upload (`memoryStorage` multer).
- Incident & Damage reporting workflow.
- **Gemini 2.5 Flash Integration**: AI Condition Diff & Fair-Access Explainer (analyzes check-in vs. check-out reports and explains allocation/incident severity).
- Immutable 10-step Audit Log timeline per booking and resource.

### Out of Scope (Explicitly Excluded)
- Forgot Password / Email verification links (no dead links in UI).
- Real Stripe payment gateway for security deposits (recorded as a boolean verification flag instead).
- Hardware IoT smart-lock integration.
- Multi-tab Admin Analytics charts (Admin Panel focuses strictly on Resource Management, Booking Approvals, Incidents, and User Role/Cert Management).
- Dark mode, Active Sessions list, and Data Export.

### Future Roadmap
| Feature | Why Later |
|---|---|
| **AI Response Caching** | Will add in-memory LRU or DB-level memoization in the next iteration to speed up repeated AI condition/fairness queries. |
| **IoT Smart Lock / RFID Sync** | Hardware relay integration to unlock lab doors automatically upon `CHECKED_IN` state. |
| **Automated Waitlist Promotion Cron** | Background worker to auto-promote the highest fair-access priority user when a cancellation occurs. |

---

## Section 9 — Success Metrics

| Metric | Baseline (Current) | Target with NexusShare | How Shown in Demo |
|---|---|---|---|
| **Booking Verification Time** | 1–3 days via email chains | < 10 seconds (Automated check) | Live eligibility & quota check on resource page |
| **Unaccounted Equipment Damage** | High (no before/after proof) | Zero unrecorded handoffs | Mandatory Check-In & Check-Out condition log + AI diff |
| **Resource Monopolization** | 20% of users book 80% of hours | Enforced weekly cap + Fair Priority Score | Show user with 0 recent hours ranked above heavy user |

---

## Section 10 — Dependencies

| Dependency | Type | Risk if Unavailable | Mitigation |
|---|---|---|---|
| **PostgreSQL (Supabase)** | Cloud Relational DB | All data operations fail | UptimeRobot ping every 6 days; Prisma 7 connection pooling |
| **Google Gemini 2.5 Flash** | External AI (`@google/genai`) | AI Condition/Fairness analysis fails | Structured `503 AI_UNAVAILABLE` error banner with retry button |
| **Cloudinary** | Cloud File Storage | Condition photo uploads fail | Allow optional fallback preset image URLs for rapid demoing |
| **Railway / Vercel** | Hosting | Cold start or unreachable | Warm up backend 10 mins before judging |

---

## Section 11 — Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Demo takes too long to show all 10 lifecycle steps** | High | High | Pre-seed bookings at each lifecycle stage (`PENDING`, `APPROVED`, `CHECKED_IN`, `COMPLETED`) AND walk one booking live through the transitions in 90 seconds. |
| **API quota exhausted during demo** | Low | High | Rate limit `/api/ai/*` to 10/min (under Gemini's 15 RPM cap). |
| **Database pause (Supabase)** | Medium | High | Active UptimeRobot monitor hitting `/health`. |

---

## Section 12 — Hackathon Criteria Alignment

| Criterion | How NexusShare Addresses It |
|---|---|
| **Innovation** | Combines an explainable **Fair-Access Priority Engine** with **Gemini 2.5 Flash Pre/Post Condition Auditing** and an append-only chain of custody. |
| **Technical Execution** | Next.js 16, React 19, Express 5, Prisma 7, Zustand 5, TanStack Query 5, strict Zod validation, and memory-stored JWT security. |
| **Problem-Solution Fit** | Directly executes all 10 steps of the challenge objective from resource listing to post-return incident resolution and audit history. |
| **Design / UX** | High-contrast WCAG AA UI, clear status badges, step-by-step lifecycle progress stepper, and complete loading/empty/error states. |

---

## Section 13 — Glossary

| Term | Definition |
|---|---|
| **RBAC** | Role-Based Access Control (`USER` = Borrower/Researcher, `ADMIN` = Institutional Owner/Lab Manager). |
| **Fair-Access Score** | A transparent 0–100 priority score calculated as `100 - (recentHoursUsed * 10)`, ensuring users who haven't hogged the resource get priority. |
| **Custody Handoff** | The two-step process of recording initial condition at **Check-In** and final condition at **Check-Out**. |
| **Audit Trail** | An immutable sequence of `AuditLog` records capturing who did what, when, and why across the booking lifecycle. |