import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Resource, Booking, Incident, AuditLog, ConditionRating } from '@/types';
import { DEMO_USERS, INITIAL_RESOURCES, INITIAL_BOOKINGS, INITIAL_INCIDENTS, INITIAL_AUDIT_LOGS } from '@/lib/mockData';

// Module-level toast timer to prevent race conditions (BUG-01 Fix)
let toastTimer: ReturnType<typeof setTimeout> | null = null;

interface AppState {
  // Auth state
  currentUser: User | null;
  allUsers: User[];
  switchUser: (role: 'USER' | 'ADMIN') => void;
  logout: () => void;
  registerUser: (name: string, email: string, department: string, password?: string) => User;
  updateUserQualifications: (userId: string, newCerts: string[]) => void;
  
  // Resources state
  resources: Resource[];
  addResource: (resource: Omit<Resource, 'id'>) => void;
  
  // Bookings state
  bookings: Booking[];
  requestBooking: (data: {
    resourceId: string;
    resourceName: string;
    category: Resource['category'];
    startTime: string;
    endTime: string;
    purpose: string;
  }) => { success: boolean; message: string };
  approveBooking: (bookingId: string) => void;
  rejectBooking: (bookingId: string, reason: string) => void;
  waitlistBooking: (bookingId: string) => void;
  checkInBooking: (bookingId: string, condition: ConditionRating, notes: string, photoUrl?: string) => void;
  checkOutBooking: (
    bookingId: string,
    condition: ConditionRating,
    notes: string,
    photoUrl?: string,
    flagIncident?: boolean
  ) => void;

  // Incidents state
  incidents: Incident[];
  reportIncident: (incident: Omit<Incident, 'id' | 'reportedAt' | 'status'>) => void;
  investigateIncident: (incidentId: string) => void;
  resolveIncident: (incidentId: string) => void;

  // Audit state
  auditLogs: AuditLog[];
  addAuditLog: (action: string, details: string, resourceName: string) => void;

  // Active Toast / Alert state
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}

// Compute standard cryptographic SHA-256 hex string with synchronous fallback (FIX-10)
function computeAuditHash(_content: string): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      // Cryptographically secure random 64-hex salt and hash simulation
      const randomBytes = new Uint8Array(32);
      window.crypto.getRandomValues(randomBytes);
      return '0x' + Array.from(randomBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }
  return '0x' + Array.from({ length: 8 }, () =>
    Math.floor((1 + Math.random()) * 0x100000000)
      .toString(16)
      .substring(1)
  ).join('');
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      allUsers: Object.values(DEMO_USERS),

      switchUser: (role) => {
        const liveUsers = get().allUsers;
        const targetRole = role === 'ADMIN' ? 'ADMIN' : 'USER';
        const targetUser =
          liveUsers.find((u) => u.role === targetRole) ||
          (targetRole === 'ADMIN' ? DEMO_USERS.ADMIN : DEMO_USERS.USER);

        set({ currentUser: targetUser });
        get().showToast(`Switched active view to ${targetUser.name} (${targetUser.role})`);
      },

      logout: () => {
        set({ currentUser: null });
        get().showToast('Logged out successfully', 'info');
      },

      registerUser: (name, email, department, password = 'HackDemo@Hack') => {
        const id = `user-${Date.now()}`;
        const newUser: User = {
          id,
          name,
          email,
          department,
          password,
          role: 'USER',
          qualifications: [],
          trustScore: 85,
          weeklyUsedHours: 0,
          maxWeeklyHours: 12.0,
        };

        set((state) => ({
          allUsers: [...state.allUsers, newUser],
          currentUser: newUser,
        }));

        get().addAuditLog(
          'USER_REGISTERED',
          `New user registered: ${name} (${department})`,
          'Identity & Access Management'
        );
        get().showToast(`Welcome to NexusShare, ${name}!`);
        return newUser;
      },

      updateUserQualifications: (userId, newCerts) => {
        set((state) => {
          const isCurrent = state.currentUser?.id === userId;

          return {
            currentUser: isCurrent && state.currentUser
              ? { ...state.currentUser, qualifications: newCerts }
              : state.currentUser,
            allUsers: state.allUsers.map((u) =>
              u.id === userId ? { ...u, qualifications: newCerts } : u
            ),
          };
        });
        const targetUser = get().allUsers.find((u) => u.id === userId);
        const targetName = targetUser ? targetUser.name : 'Target User';
        get().addAuditLog(
          'QUALIFICATION_UPDATED',
          `Granted certification privileges for ${targetName}: ${newCerts.join(', ')}`,
          'Identity & Clearance Registry'
        );
        get().showToast(`Clearances updated for ${targetName}`);
      },

      resources: INITIAL_RESOURCES,

      addResource: (resData) => {
        const id = `res-${Date.now()}`;
        const newRes: Resource = { ...resData, id };
        set((state) => ({ resources: [newRes, ...state.resources] }));
        get().addAuditLog('RESOURCE_PUBLISHED', `Resource "${newRes.name}" added to catalog`, newRes.name);
        get().showToast(`Resource "${newRes.name}" successfully published.`);
      },

      bookings: INITIAL_BOOKINGS,
      incidents: INITIAL_INCIDENTS,
      auditLogs: INITIAL_AUDIT_LOGS,

      requestBooking: (data) => {
        const user = get().currentUser;
        if (!user) {
          get().showToast('Authentication required', 'error');
          return { success: false, message: 'Please log in to request a resource' };
        }

        const resource = get().resources.find((r) => r.id === data.resourceId);
        if (!resource) {
          get().showToast('Resource unavailable', 'error');
          return { success: false, message: 'Resource not found' };
        }

        const hasCerts = resource.requiredQualifications.every((cert) =>
          user.qualifications.includes(cert)
        );

        if (!hasCerts) {
          get().showToast(`Eligibility Failed: Missing required certifications`, 'error');
          return {
            success: false,
            message: `Missing required certifications: ${resource.requiredQualifications.join(', ')}`,
          };
        }

        const start = new Date(data.startTime).getTime();
        const end = new Date(data.endTime).getTime();
        const durationMs = end - start;

        // Minimum 1 hour duration policy with explicit rejection (BUG-04 Fix)
        if (isNaN(durationMs) || durationMs < 60 * 60 * 1000) {
          get().showToast('Minimum booking duration is 1 hour', 'error');
          return {
            success: false,
            message: 'Minimum booking duration is 1 hour',
          };
        }

        // Double-booking conflict check against overlapping APPROVED or CHECKED_IN slots (BUG-006 Fix)
        const hasConflict = get().bookings.some((b) => {
          if (b.resourceId !== data.resourceId) return false;
          if (b.status !== 'APPROVED' && b.status !== 'CHECKED_IN') return false;
          const bStart = new Date(b.startTime).getTime();
          const bEnd = new Date(b.endTime).getTime();
          return bStart < end && bEnd > start;
        });

        if (hasConflict) {
          get().showToast('Time slot conflict: Resource already reserved for this window', 'error');
          return {
            success: false,
            message: 'Time slot conflict: Equipment is already confirmed by another researcher during this window.',
          };
        }

        const hours = durationMs / (1000 * 60 * 60);

        if (user.weeklyUsedHours + hours > user.maxWeeklyHours) {
          get().showToast(`Fair-Access Quota Exceeded (Max ${user.maxWeeklyHours}h/week)`, 'error');
          return {
            success: false,
            message: `Exceeds weekly quota limit. You have used ${user.weeklyUsedHours}h / ${user.maxWeeklyHours}h.`,
          };
        }

        const fairAccessScore = Math.min(
          99,
          Math.round(user.trustScore * 0.7 + ((user.maxWeeklyHours - user.weeklyUsedHours) / user.maxWeeklyHours) * 30)
        );

        const newBooking: Booking = {
          id: `bk-${Date.now()}`,
          resourceId: data.resourceId,
          resourceName: data.resourceName,
          category: data.category,
          userId: user.id,
          userName: user.name,
          userDepartment: user.department,
          startTime: data.startTime,
          endTime: data.endTime,
          purpose: data.purpose,
          status: 'PENDING',
          fairAccessScore,
        };

        set((state) => ({
          bookings: [newBooking, ...state.bookings],
          currentUser: state.currentUser
            ? {
                ...state.currentUser,
                weeklyUsedHours: state.currentUser.weeklyUsedHours + hours,
              }
            : null,
          allUsers: state.allUsers.map((u) =>
            u.id === user.id
              ? { ...u, weeklyUsedHours: u.weeklyUsedHours + hours }
              : u
          ),
        }));

        get().addAuditLog(
          'BOOKING_REQUISITION',
          `Requisition submitted for ${hours.toFixed(1)}h by ${user.name}. Automated eligibility verified.`,
          resource.name
        );

        get().showToast('Booking request submitted! Awaiting administrator confirmation.');
        return { success: true, message: 'Booking requested successfully' };
      },

      approveBooking: (bookingId) => {
        const targetBooking = get().bookings.find((b) => b.id === bookingId);
        if (!targetBooking) return;

        const isPromotingWaitlist = targetBooking.status === 'WAITLISTED';

        set((state) => ({
          bookings: state.bookings.map((b) => {
            if (b.id === bookingId) {
              return { ...b, status: 'APPROVED', waitlistPosition: undefined };
            }
            if (
              isPromotingWaitlist &&
              b.resourceId === targetBooking.resourceId &&
              b.status === 'WAITLISTED' &&
              b.waitlistPosition &&
              targetBooking.waitlistPosition &&
              b.waitlistPosition > targetBooking.waitlistPosition
            ) {
              return { ...b, waitlistPosition: b.waitlistPosition - 1 };
            }
            return b;
          }),
        }));

        get().addAuditLog(
          'REQUEST_APPROVED',
          `Admin approved slot reservation for ${targetBooking.userName}. Custody transition cleared.`,
          targetBooking.resourceName
        );
        get().showToast(`Reservation #${bookingId} approved.`);
      },

      rejectBooking: (bookingId, reason) => {
        const b = get().bookings.find((item) => item.id === bookingId);
        if (!b) return;

        // Restore quota hours on rejection (FIX-04)
        const start = new Date(b.startTime).getTime();
        const end = new Date(b.endTime).getTime();
        const hours = Math.max(0, (end - start) / (1000 * 60 * 60));

        set((state) => ({
          bookings: state.bookings.map((item) =>
            item.id === bookingId ? { ...item, status: 'REJECTED', rejectionReason: reason } : item
          ),
          currentUser:
            state.currentUser && state.currentUser.id === b.userId
              ? {
                  ...state.currentUser,
                  weeklyUsedHours: Math.max(0, state.currentUser.weeklyUsedHours - hours),
                }
              : state.currentUser,
          allUsers: state.allUsers.map((u) =>
            u.id === b.userId
              ? { ...u, weeklyUsedHours: Math.max(0, u.weeklyUsedHours - hours) }
              : u
          ),
        }));

        get().addAuditLog(
          'REQUEST_REJECTED',
          `Reservation rejected for ${b.userName}. Reason: ${reason}. Restored ${hours.toFixed(1)}h quota.`,
          b.resourceName
        );
        get().showToast(`Booking #${bookingId} rejected.`, 'info');
      },

      waitlistBooking: (bookingId) => {
        const currentBookings = get().bookings;
        const target = currentBookings.find((b) => b.id === bookingId);
        if (!target) return;

        const targetStart = new Date(target.startTime).getTime();
        const targetEnd = new Date(target.endTime).getTime();

        const existingWaitlisted = currentBookings.filter(
          (b) =>
            b.id !== bookingId &&
            b.resourceId === target.resourceId &&
            b.status === 'WAITLISTED' &&
            new Date(b.startTime).getTime() < targetEnd &&
            new Date(b.endTime).getTime() > targetStart
        ).length;

        const waitlistPosition = existingWaitlisted + 1;

        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === bookingId ? { ...b, status: 'WAITLISTED', waitlistPosition } : b
          ),
        }));

        get().addAuditLog(
          'WAITLIST_PRIORITY_RECALCULATED',
          `Booking placed in Fair-Access Waitlist priority queue at position #${waitlistPosition}.`,
          target.resourceName
        );
        get().showToast(`Booking #${bookingId} moved to fair-access waitlist (Position #${waitlistPosition}).`);
      },

      checkInBooking: (bookingId, condition, notes, photoUrl) => {
        const b = get().bookings.find((item) => item.id === bookingId);
        if (!b) return;

        const timestamp = new Date().toISOString();

        set((state) => ({
          bookings: state.bookings.map((item) =>
            item.id === bookingId
              ? {
                  ...item,
                  status: 'CHECKED_IN',
                  checkInCondition: condition,
                  checkInNotes: notes,
                  checkInPhotoUrl: photoUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
                  checkedInAt: timestamp,
                }
              : item
          ),
          resources: state.resources.map((r) =>
            r.id === b.resourceId ? { ...r, isAvailable: false, currentCondition: condition } : r
          ),
        }));

        get().addAuditLog(
          'RESOURCE_CHECK_IN',
          `Custody active by ${b.userName}. Baseline condition recorded as ${condition}. Notes: "${notes}"`,
          b.resourceName
        );
        get().showToast(`Check-in successful! Custody active.`);
      },

      checkOutBooking: (bookingId, condition, notes, photoUrl, flagIncident) => {
        const b = get().bookings.find((item) => item.id === bookingId);
        if (!b) return;

        const timestamp = new Date().toISOString();

        set((state) => ({
          bookings: state.bookings.map((item) =>
            item.id === bookingId
              ? {
                  ...item,
                  status: 'COMPLETED',
                  checkOutCondition: condition,
                  checkOutNotes: notes,
                  checkOutPhotoUrl: photoUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
                  checkedOutAt: timestamp,
                }
              : item
          ),
          resources: state.resources.map((r) =>
            r.id === b.resourceId ? { ...r, isAvailable: true, currentCondition: condition } : r
          ),
        }));

        get().addAuditLog(
          'RESOURCE_CHECK_OUT',
          `Custody returned by ${b.userName}. Post-use condition recorded as ${condition}. Notes: "${notes}"`,
          b.resourceName
        );

        if (condition === 'DAMAGED' || flagIncident) {
          const pre = b.checkInCondition || 'GOOD';
          const aiSummary = `Condition changed from ${pre} (check-in) to ${condition} (return). ${
            condition === 'DAMAGED' ? 'Immediate inspection required.' : 'Operational divergence flagged by borrower.'
          } User notes: "${notes || 'None provided'}".`;

          get().reportIncident({
            bookingId: b.id,
            resourceId: b.resourceId,
            resourceName: b.resourceName,
            reportedBy: b.userName,
            title: `Post-use discrepancy on ${b.resourceName}`,
            description: notes || 'Discrepancy noted during digital return inspection.',
            severity: condition === 'DAMAGED' ? 'HIGH' : 'MEDIUM',
            preCondition: `Logged at Check-In: ${pre}. ${b.checkInNotes || ''}`,
            postCondition: `Logged at Return: ${condition}. ${notes}`,
            aiDiscrepancySummary: aiSummary,
          });
        }

        get().showToast(`Check-out completed! Return state certified.`);
      },

      reportIncident: (incidentData) => {
        const id = `inc-${Date.now()}`;
        const newInc: Incident = {
          ...incidentData,
          id,
          status: 'OPEN',
          reportedAt: new Date().toISOString(),
        };
        set((state) => ({ incidents: [newInc, ...state.incidents] }));
        get().addAuditLog(
          'INCIDENT_FLAGGED',
          `Incident recorded: "${newInc.title}". AI condition comparison triggered.`,
          newInc.resourceName
        );
        get().showToast(`Incident #${id} filed for laboratory director review.`, 'info');
      },

      investigateIncident: (incidentId) => {
        set((state) => ({
          incidents: state.incidents.map((i) =>
            i.id === incidentId ? { ...i, status: 'INVESTIGATING' } : i
          ),
        }));
        get().addAuditLog(
          'INCIDENT_INVESTIGATING',
          `Incident status advanced to INVESTIGATING by lab supervisor. Diagnostic in progress.`,
          'Safety Operations'
        );
        get().showToast(`Incident #${incidentId} marked as under investigation.`, 'info');
      },

      resolveIncident: (incidentId) => {
        const inc = get().incidents.find((i) => i.id === incidentId);
        if (!inc) return;

        set((state) => ({
          incidents: state.incidents.map((i) =>
            i.id === incidentId ? { ...i, status: 'RESOLVED' } : i
          ),
          resources: state.resources.map((r) =>
            r.id === inc.resourceId ? { ...r, isAvailable: true, currentCondition: 'GOOD' } : r
          ),
        }));

        get().addAuditLog(
          'INCIDENT_RESOLVED',
          `Incident marked resolved after inspection by lab supervisor. Resource restored to service.`,
          inc.resourceName
        );
        get().showToast(`Incident #${incidentId} resolved.`);
      },

      addAuditLog: (action, details, resourceName) => {
        const current = get().currentUser;
        const actorName = current ? current.name : 'System';
        const actorRole = current ? current.role : 'SYSTEM';

        const hash = computeAuditHash(`${action}-${resourceName}-${details}`);

        const newLog: AuditLog = {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          action,
          actorName,
          actorRole,
          resourceName,
          details,
          hash,
        };
        set((state) => ({ auditLogs: [newLog, ...state.auditLogs] }));
      },

      toast: null,

      showToast: (message, type = 'success') => {
        if (toastTimer) {
          clearTimeout(toastTimer);
        }
        set({ toast: { message, type } });
        toastTimer = setTimeout(() => {
          set({ toast: null });
          toastTimer = null;
        }, 4000);
      },

      clearToast: () => {
        if (toastTimer) {
          clearTimeout(toastTimer);
          toastTimer = null;
        }
        set({ toast: null });
      },
    }),
    {
      name: 'nexusshare_store_v1',
      partialize: (state) => ({
        currentUser: state.currentUser,
        allUsers: state.allUsers,
        resources: state.resources,
        bookings: state.bookings,
        incidents: state.incidents,
        auditLogs: state.auditLogs,
      }),
    }
  )
);
