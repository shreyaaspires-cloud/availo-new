# Frontend Stitch & AI Coding Master Prompt — NexusShare
> Copy and paste this entire prompt into your AI coding assistant or UI generation session before building the frontend. It locks in every v4 rule, token, component contract, and screen specification.

---

## Copy-Paste Prompt Block

```text
You are building the complete frontend for "NexusShare" — an Institutional & Community Resource Sharing Platform (Next.js 16 App Router, React 19, TypeScript 5.6 strict, Tailwind CSS 3.4, TanStack Query 5, Zustand 5, Lucide React).

======================================================================
1. STRICT NON-NEGOTIABLE FRAMEWORK RULES (OCTOBER 2026)
======================================================================
- REACT 19: NEVER use `forwardRef()`. Pass `ref` as a standard prop:
  `function Input({ ref, ...props }: InputProps & { ref?: React.Ref<HTMLInputElement> })`
- NEXT.JS 16: `params`, `searchParams`, `cookies()`, and `headers()` are ALL async Promises. Always `const { id } = await params;` in async server components or `React.use(params)` in client components.
- ZUSTAND 5: Whenever selecting an object or multiple values from a Zustand store, you MUST wrap the selector in `useShallow` from `'zustand/shallow'`:
  `const { user, isAuthenticated } = useAuthStore(useShallow((s) => ({ user: s.user, isAuthenticated: s.isAuthenticated })));`
  Single primitive selectors do not need `useShallow`: `const user = useAuthStore((s) => s.user);`
- AUTH STORAGE: `accessToken` lives in `useAuthStore` memory ONLY. NEVER store tokens in `localStorage` or `sessionStorage`.
- API CLIENT: Always use `apiClient` from `@/lib/apiClient`. Note that the `apiClient` response interceptor unwraps `response.data.data` automatically! Therefore, `const { data } = useResources()` returns `{ items, total, page, limit, totalPages, hasNextPage, hasPrevPage }` directly (NEVER access `data.data`).
- ROLES: Strictly `'USER'` and `'ADMIN'` only. Never reference `'SUPER_ADMIN'`.
- NO DEAD LINKS: Do NOT render a "Forgot password?" link on `/login`. Do NOT render "Active Sessions" or "Download My Data" on `/profile`. Do NOT render an "Analytics" tab on `/admin`.
- FOUR STATES MANDATE: Every data-driven screen and component MUST explicitly render:
  1. Loading state (`<Skeleton />` or `<CardSkeleton />`)
  2. Error state (`<ErrorBanner message={error?.error} onRetry={refetch} />`)
  3. Empty state (`<EmptyState title="..." description="..." action={{...}} />`)
  4. Data state (Happy path)

======================================================================
2. DESIGN SYSTEM & TAILWIND TOKENS
======================================================================
- Primary Brand Blue: `primary-50` (#eff6ff) through `primary-900` (#1e3a8a), main CTA `bg-primary-600 hover:bg-primary-700 text-white`.
- Semantic Colors (WCAG AA verified):
  - Error: `#DC2626` (`text-error`, `bg-error`)
  - Success: `#047857` (`text-success`, `bg-success`)
  - Warning: `#f59e0b` (Background tint only with dark `text-gray-900` text)
  - Info: `#1D4ED8`
- Typography: `Inter` for UI (`font-sans`), `JetBrains Mono` (`font-mono`) for Audit Logs, Condition Hashes, and Gemini 2.5 Flash AI outputs.
- Layout: Desktop fixed left Sidebar (`w-64`), main content `lg:pl-64`, `bg-gray-50` background, `rounded-xl border border-gray-200 bg-white shadow-sm` cards.

======================================================================
3. SHARED UI PRIMITIVES (BUILD FIRST IN `src/components/ui/`)
======================================================================
1. `Button.tsx`: variants `primary | secondary | ghost | danger`, sizes `sm | md | lg`, `loading` spinner prop.
2. `Input.tsx`: `label`, `error`, `helperText`, links `aria-invalid` and `aria-describedby`. React 19 `ref` as prop.
3. `Badge.tsx`: variants `success | warning | error | info | neutral`.
4. `Card.tsx`: paddings `none | sm | md | lg`.
5. `Modal.tsx`: Escape key listener, backdrop click close, `role="dialog"`, `aria-modal="true"`, scrollable body `max-h-[70vh] overflow-y-auto`.
6. `Skeleton.tsx` & `CardSkeleton.tsx`: `animate-pulse` placeholders with `role="status"`.
7. `EmptyState.tsx`: icon, title, description, CTA button/link.
8. `ErrorBanner.tsx`: `role="alert"`, message, `onRetry` button.
9. `ToastContainer.tsx`: reads `useUIStore`, renders bottom-right stack, auto-dismisses at 4000ms.

======================================================================
4. SCREENS TO BUILD (COVERING ALL 10 LIFECYCLE STEPS)
======================================================================
1. `/` (`LandingPage`):
   - Hero section: "Share Institutional Spaces, Labs & Specialized Equipment with Total Trust."
   - Interactive 10-Step Lifecycle showcase (List -> Discover -> Request -> Verify -> Review -> Allocate -> Check-In -> Return -> Incident -> Audit).
   - CTAs to `/login` and `/register`.

2. `/login` & `/register`:
   - React Hook Form + Zod validation.
   - Include "Quick Demo Fill" buttons on `/login` for Judge convenience:
     - Fill Researcher (`demo@yourapp.com` / `HackDemo@Hack`)
     - Fill Lab Manager Admin (`admin@yourapp.com` / `HackAdmin@Hack`)
   - Remember: NO "Forgot password?" link.

3. `/dashboard`:
   - Top KPI cards: Active Custody Bookings, Remaining Weekly Fair-Access Hours, Trust Score (`100`), Open Incidents.
   - "Action Required" banner for any booking ready for Check-In (`APPROVED`) or Check-Out (`CHECKED_IN`).
   - Recent Immutable Audit Feed showing real-time institutional activity.

4. `/resources` & `/resources/[id]` (Steps 1, 2, 3, 4):
   - Filter by Category (`LABORATORY`, `CLASSROOM`, `MAKERSPACE_TOOL`, `CAMERA_AV`, `TESTING_DEVICE`, `COMPUTE_WORKSTATION`).
   - Each card displays:
     - Current Condition Badge (`EXCELLENT`, `GOOD`, `FAIR`, `DAMAGED`)
     - Required Qualifications (`LASER_SAFETY_L1`, `CNC_CERT`, etc.)
     - Live User Eligibility Indicator (Green "Eligible" if `user.qualifications` contains all `requiredCerts`, or Amber "Missing Qualification").
     - Max Hours/Week fair-access limit.
   - On `/resources/[id]`: Booking Request Form (Start/End time, Purpose, Agree to usage conditions checkbox) + Live Fair-Access Priority preview.
   - For `ADMIN` users: "+ List New Resource" modal to define conditions, required certs, deposit, and weekly quota cap.

5. `/bookings` (Steps 5, 6, 7, 8, 10):
   - Filter tabs: All, Pending/Waitlisted, Active Custody (`APPROVED` / `CHECKED_IN`), Completed.
   - Every booking card renders `<LifecycleStepper />` highlighting steps 1 through 10.
   - Shows Explainable Allocation Box: Fairness Priority Score (`0-100`), Waitlist Position (if `WAITLISTED`), and Manager's `decisionReason`.
   - Action Buttons per state:
     - If `APPROVED` (and user owns booking): **"Check In & Log Initial Condition"** button -> opens `CheckInModal` (select initial condition, notes, upload photo via `POST /api/upload` with field name `"file"`).
     - If `CHECKED_IN`: **"Return & Log Final Condition"** button -> opens `CheckOutModal` (select final condition, notes, upload post-use photo, optional checkbox to report damage/delay incident).
     - Always visible: **"Audit Trail (10 Steps)"** button -> opens `AuditTimelineDrawer` showing every timestamped `AuditLog` record.

6. `/incidents` & `/ai-audit` (Step 9 + Gemini 2.5 Flash):
   - List of reported damages, late returns, and scheduling conflicts.
   - **"Gemini 2.5 Flash Condition & Fairness Auditor"** panel:
     - Select any booking or paste Check-In vs. Check-Out notes.
     - Calls `POST /api/ai/analyze`.
     - Displays loading spinner ("Analyzing with Gemini 2.5 Flash... 2-5s reasoning step") and renders the structured diff and recommendation in `font-mono`.

7. `/admin` (Wrapped in `<AuthGuard requiredRole="ADMIN">`):
   - Section A: **Pending Booking Review Queue** — shows applicant's qualifications, rolling 7-day usage hours, Fairness Priority Score, and conflict status. Buttons for **Approve**, **Place on Waitlist**, or **Reject** (all require an explainable `decisionReason`).
   - Section B: **Users & Qualifications Table** — allows Admin to grant safety certifications (e.g., toggle `LASER_SAFETY_L1`, `CNC_CERT`, `BIO_LAB_101`) or toggle `USER` / `ADMIN` role.
```