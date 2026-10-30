# Frontend Architecture — NexusShare
> Next.js 16 (App Router) + React 19 + TypeScript 5.6 (Strict) + Tailwind CSS 3.4 + Zustand 5 (`useShallow`) + TanStack Query 5.

---

## Section 1 — User Roles and RBAC Matrix

> Strictly TWO roles: `USER` (Resource Seeker / Researcher / Student) and `ADMIN` (Institutional Resource Owner / Lab Manager). No `SUPER_ADMIN`.

| Feature / Lifecycle Step | Guest | `USER` (Borrower) | `ADMIN` (Owner/Manager) |
|---|---|---|---|
| View Landing Page | Yes | Yes | Yes |
| Login / Register | Yes | — | — |
| **Step 1**: List & Edit Resource Conditions | No | No | Yes |
| **Step 2**: Discover Resources & Check Eligibility | No | Yes | Yes |
| **Step 3**: Submit Booking Request | No | Yes | Yes |
| **Step 4**: View Automated Eligibility & Fair-Quota Check | No | Yes | Yes |
| **Steps 5 & 6**: Approve, Reject, or Waitlist Requests | No | No | Yes |
| **Step 7**: Check-In & Log Initial Condition | No | Yes (Own booking) | Yes |
| **Step 8**: Return (Check-Out) & Log Final Condition | No | Yes (Own booking) | Yes |
| **Step 9**: Report Incident / Damage / Delay | No | Yes | Yes (Can also Resolve) |
| **Step 10**: View Immutable Audit History Timeline | No | Yes | Yes |
| Use Gemini 2.5 Flash Condition & Fairness AI | No | Yes | Yes |
| Manage User Roles & Safety Qualifications | No | No | Yes |

---

## Section 2 — Route Map (Next.js 16 App Router)

> Remember: In Next.js 16, `params` and `searchParams` are `Promise<...>` and **must** be awaited.
> Login page has **NO** "Forgot password?" link.

| Route | Component | Auth | Min Role | Description |
|---|---|---|---|---|
| `/` | `LandingPage` | No | Any | Pitch, 10-step lifecycle visual, live metrics, CTA |
| `/login` | `LoginPage` | No | Any | Email + password login + one-click Demo User/Admin fill buttons |
| `/register` | `RegisterPage` | No | Any | Registration with department & password strength meter |
| `/dashboard` | `DashboardPage` | Yes | `USER` | Overview stats, active custody bookings, fair-quota gauge, recent audit events |
| `/resources` | `ResourcesPage` | Yes | `USER` | **Steps 1 & 2**: Resource catalog with category filters, live Eligibility Badges, and "+ List Resource" modal (`ADMIN`) |
| `/resources/[id]` | `ResourceDetailPage` | Yes | `USER` | **Steps 2, 3, 4**: Full rules, required certs, user's rolling 7-day quota meter, booking form, and resource audit log |
| `/bookings` | `BookingsPage` | Yes | `USER` | **Steps 5–8 & 10**: Lifecycle tracker (`PENDING`, `APPROVED`, `WAITLISTED`, `CHECKED_IN`, `COMPLETED`), Check-In/Out modals, and Audit Drawer |
| `/incidents` | `IncidentsPage` | Yes | `USER` | **Step 9**: Damage, delay, and conflict reports + AI Condition Diff analyzer |
| `/ai-audit` | `AIAuditPage` | Yes | `USER` | Dedicated Gemini 2.5 Flash Condition Comparator & Fair-Access Advisor |
| `/admin` | `AdminPage` | Yes | `ADMIN` | **Steps 1, 5, 6, 9**: Approval Queue, Waitlist Priority Queue, and User Qualification/Role Management |
| `/profile` | `ProfilePage` | Yes | `USER` | Personal info, earned safety qualification badges, trust score, and password update |

---

## Section 3 — Folder Structure

```
frontend/src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (protected)/
│   │   ├── layout.tsx                   # DashboardLayout + AuthGuard wrapper
│   │   ├── dashboard/page.tsx
│   │   ├── resources/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx            # Async params: const { id } = await params
│   │   ├── bookings/page.tsx
│   │   ├── incidents/page.tsx
│   │   ├── ai-audit/page.tsx
│   │   ├── profile/page.tsx
│   │   └── admin/page.tsx               # <AuthGuard requiredRole="ADMIN">
│   ├── layout.tsx                       # QueryProvider + AuthProvider
│   └── page.tsx                         # Public Landing Page
├── components/
│   ├── ui/                              # Built in Hours 1-3 before feature code
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Skeleton.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorBanner.tsx
│   │   └── ToastContainer.tsx
│   ├── providers/
│   │   ├── AuthProvider.tsx
│   │   ├── AuthGuard.tsx
│   │   └── QueryProvider.tsx
│   ├── layout/
│   │   ├── DashboardLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── TopBar.tsx
│   └── features/
│       ├── resources/
│       │   ├── ResourceCard.tsx
│       │   ├── EligibilityBanner.tsx
│       │   └── CreateResourceModal.tsx
│       ├── bookings/
│       │   ├── LifecycleStepper.tsx     # Visual 10-step progress bar
│       │   ├── CheckInModal.tsx         # Step 7: Initial condition + photo upload
│       │   ├── CheckOutModal.tsx        # Step 8: Final condition + photo + incident toggle
│       │   ├── ReviewBookingModal.tsx   # Steps 5 & 6: Admin Approve/Reject/Waitlist
│       │   └── AuditTimelineDrawer.tsx  # Step 10: Complete transaction history
│       └── incidents/
│           └── IncidentCard.tsx
├── stores/
│   ├── authStore.ts                     # In-memory JWT + user (with qualifications & trustScore)
│   └── uiStore.ts                       # Toasts (4s auto-dismiss) + sidebar state
├── hooks/
│   ├── useAuth.ts
│   ├── useResources.ts
│   ├── useBookings.ts
│   ├── useIncidents.ts
│   ├── useAuditLogs.ts
│   └── useAI.ts
└── lib/
    └── apiClient.ts                     # Unwraps response.data.data + silent 401 refresh queue
```

---

## Section 4 — Zustand 5 Stores & TanStack Query 5 Hooks

### `src/stores/authStore.ts`
```typescript
import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  department: string;
  qualifications: string[];
  trustScore: number;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isHydrated: false,
  setAuth: (user, token) => set({ user, accessToken: token, isAuthenticated: true }),
  clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false }),
  setHydrated: () => set({ isHydrated: true }),
}));
```
> **Zustand 5 Rule**: Whenever selecting multiple properties in a component, always wrap with `useShallow`:
> ```typescript
> import { useShallow } from 'zustand/shallow';
> const { user, isAuthenticated } = useAuthStore(
>   useShallow((s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }))
> );
> ```

### `src/hooks/useBookings.ts` (Covers Steps 3 through 8)
```typescript
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useUIStore } from '@/stores/uiStore';

export function useBookings(page = 1, status?: string, scope?: 'own' | 'all') {
  return useQuery({
    queryKey: ['bookings', page, status, scope],
    queryFn: () =>
      apiClient.get(
        `/bookings?page=${page}&limit=20${status ? `&status=${status}` : ''}${scope ? `&scope=${scope}` : ''}`
      ),
    placeholderData: keepPreviousData,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (body: {
      resourceId: string;
      startTime: string;
      endTime: string;
      purpose: string;
      agreedToRules: true;
    }) => apiClient.post('/bookings', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['audit'] });
      addToast({ type: 'success', message: 'Booking request submitted & verified!' });
    },
    onError: (err: { error?: string }) => {
      addToast({ type: 'error', message: err.error ?? 'Failed to submit booking request' });
    },
  });
}

export function useReviewBooking() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({
      id,
      status,
      decisionReason,
    }: {
      id: string;
      status: 'APPROVED' | 'REJECTED' | 'WAITLISTED';
      decisionReason: string;
    }) => apiClient.patch(`/bookings/${id}/review`, { status, decisionReason }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['audit'] });
      addToast({ type: 'success', message: `Booking marked as ${variables.status}` });
    },
    onError: (err: { error?: string }) => {
      addToast({ type: 'error', message: err.error ?? 'Review action failed' });
    },
  });
}

export function useCheckInBooking() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      checkInCondition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED';
      checkInNotes: string;
      checkInPhotoUrl?: string;
    }) => apiClient.post(`/bookings/${id}/check-in`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['audit'] });
      addToast({ type: 'success', message: 'Checked in! Initial condition recorded in audit trail.' });
    },
    onError: (err: { error?: string }) => {
      addToast({ type: 'error', message: err.error ?? 'Check-in failed' });
    },
  });
}

export function useCheckOutBooking() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      checkOutCondition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED';
      checkOutNotes: string;
      checkOutPhotoUrl?: string;
      reportIncident?: boolean;
      incidentType?: 'DAMAGE' | 'LATE_RETURN' | 'SCHEDULING_CONFLICT' | 'UNAUTHORIZED_USE';
      incidentDescription?: string;
    }) => apiClient.post(`/bookings/${id}/check-out`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['audit'] });
      addToast({ type: 'success', message: 'Resource returned & final condition logged!' });
    },
    onError: (err: { error?: string }) => {
      addToast({ type: 'error', message: err.error ?? 'Check-out failed' });
    },
  });
}
```

---

## Section 5 — Signature UI Component: The 10-Step Lifecycle Stepper (`LifecycleStepper.tsx`)

Every booking card or detail modal displays a clear visual indicator showing exactly where the transaction sits in the 10-step challenge lifecycle:
1. **Listed & Conditions Set** (`RESOURCE_LISTED`)
2. **Eligibility Checked** (`meetsEligibility === true`)
3. **Request Submitted** (`BOOKING_REQUESTED`)
4. **System Quota Verified** (`fairnessPriorityScore` calculated)
5. **Manager Reviewed** (`reviewedAt !== null`)
6. **Allocation Decision** (`APPROVED` / `WAITLISTED` / `REJECTED`)
7. **Checked In (Initial Condition)** (`checkedInAt !== null`)
8. **Returned (Final Condition)** (`checkedOutAt !== null`)
9. **Discrepancy / Incident Check** (`IncidentReport` or Clean Return)
10. **Immutable Audit Sealed** (`AuditLog` timeline complete)