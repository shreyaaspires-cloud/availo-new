import { create } from 'zustand';
import { User, Resource, Booking, Incident, AuditLog, ConditionRating } from '@/types';
import { DEMO_USERS, INITIAL_RESOURCES, INITIAL_BOOKINGS, INITIAL_INCIDENTS, INITIAL_AUDIT_LOGS } from '@/lib/mockData';

interface AppState {
  // Auth state
  currentUser: User;
  switchUser: (role: 'USER' | 'ADMIN') => void;
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
  resolveIncident: (incidentId: string) => void;

  // Audit state
  auditLogs: AuditLog[];
  addAuditLog: (action: string, details: string, resourceName: string) => void;

  // Active Toast / Alert state
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: DEMO_USERS.USER,
  resources: INITIAL_RESOURCES,
  bookings: INITIAL_BOOKINGS,
  incidents: INITIAL_INCIDENTS,
  auditLogs: INITIAL_AUDIT_LOGS,
  toast: null,

  showToast: (message, type = 'success') => {
    set({ toast: { message, type } });
    setTimeout(() => {
      set({ toast: null });
    }, 4000);
  },

  clearToast: () => set({ toast: null }),

  switchUser: (role) => {
    set({ currentUser: DEMO_USERS[role] });
    get().showToast(`Switched active session to ${DEMO_USERS[role].name} (${role})`, 'info');
  },

  updateUserQualifications: (userId, newCerts) => {
    set((state) => {
      const isCurrent = state.currentUser.id === userId;
      return {
        currentUser: isCurrent
          ? { ...state.currentUser, qualifications: newCerts }
          : state.currentUser,
      };
    });
    get().addAuditLog(
      'QUALIFICATION_UPDATED',
      `Granted certification privileges: ${newCerts.join(', ')}`,
      'User Credential Engine'
    );
    get().showToast('User credentials and certifications successfully updated.');
  },

  addResource: (newResData) => {
    const id = `res-${Date.now()}`;
    const newRes: Resource = { ...newResData, id };
    set((state) => ({ resources: [newRes, ...state.resources] }));
    get().addAuditLog(
      'RESOURCE_LISTED',
      `Admin listed new institutional resource: ${newRes.name} under ${newRes.category}`,
      newRes.name
    );
    get().showToast(`Resource "${newRes.name}" created and published.`);
  },

  requestBooking: (data) => {
    const user = get().currentUser;
    const resource = get().resources.find((r) => r.id === data.resourceId);

    if (!resource) {
      return { success: false, message: 'Resource not found' };
    }

    // Step 2 Automated Eligibility Check
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

    // Calculate booking duration hours
    const start = new Date(data.startTime).getTime();
    const end = new Date(data.endTime).getTime();
    const hours = Math.max(1, Math.round((end - start) / (1000 * 60 * 60)));

    if (user.weeklyUsedHours + hours > user.maxWeeklyHours) {
      get().showToast(`Fair-Access Quota Exceeded (Max ${user.maxWeeklyHours}h/week)`, 'error');
      return {
        success: false,
        message: `Exceeds weekly quota limit. You have used ${user.weeklyUsedHours}h / ${user.maxWeeklyHours}h.`,
      };
    }

    // Calculate fair access score based on trust score and remaining capacity
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
      currentUser: {
        ...state.currentUser,
        weeklyUsedHours: state.currentUser.weeklyUsedHours + hours,
      },
    }));

    get().addAuditLog(
      'BOOKING_REQUISITION',
      `Requisition submitted for ${hours}h by ${user.name}. Automated eligibility verified.`,
      resource.name
    );

    get().showToast('Booking request submitted! Awaiting administrator confirmation.');
    return { success: true, message: 'Booking requested successfully' };
  },

  approveBooking: (bookingId) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'APPROVED' } : b
      ),
    }));
    const b = get().bookings.find((item) => item.id === bookingId);
    if (b) {
      get().addAuditLog(
        'REQUEST_APPROVED',
        `Admin approved slot reservation for ${b.userName}. Custody transition cleared.`,
        b.resourceName
      );
      get().showToast(`Reservation #${bookingId} approved.`);
    }
  },

  rejectBooking: (bookingId, reason) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'REJECTED', rejectionReason: reason } : b
      ),
    }));
    const b = get().bookings.find((item) => item.id === bookingId);
    if (b) {
      get().addAuditLog(
        'REQUEST_REJECTED',
        `Reservation rejected for ${b.userName}. Reason: ${reason}`,
        b.resourceName
      );
      get().showToast(`Booking #${bookingId} rejected.`, 'info');
    }
  },

  waitlistBooking: (bookingId) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'WAITLISTED', waitlistPosition: 1 } : b
      ),
    }));
    const b = get().bookings.find((item) => item.id === bookingId);
    if (b) {
      get().addAuditLog(
        'WAITLIST_PRIORITY_RECALCULATED',
        `Booking placed in Fair-Access Waitlist priority queue.`,
        b.resourceName
      );
      get().showToast(`Booking #${bookingId} moved to fair-access waitlist.`);
    }
  },

  checkInBooking: (bookingId, condition, notes, photoUrl) => {
    const timestamp = new Date().toISOString();
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'CHECKED_IN',
              checkInCondition: condition,
              checkInNotes: notes,
              checkInPhotoUrl: photoUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
              checkedInAt: timestamp,
            }
          : b
      ),
    }));

    const b = get().bookings.find((item) => item.id === bookingId);
    if (b) {
      get().addAuditLog(
        'RESOURCE_CHECK_IN',
        `Custody handed to ${b.userName}. Initial condition documented as ${condition}. Notes: "${notes}"`,
        b.resourceName
      );
      get().showToast(`Digital custody active! Pre-condition recorded as ${condition}.`);
    }
  },

  checkOutBooking: (bookingId, condition, notes, photoUrl, flagIncident) => {
    const timestamp = new Date().toISOString();
    const b = get().bookings.find((item) => item.id === bookingId);

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
      // Update resource state if damaged
      resources: state.resources.map((r) =>
        b && r.id === b.resourceId ? { ...r, currentCondition: condition } : r
      ),
    }));

    if (b) {
      get().addAuditLog(
        'RESOURCE_CHECK_OUT',
        `Custody returned by ${b.userName}. Post-use condition recorded as ${condition}. Notes: "${notes}"`,
        b.resourceName
      );

      if (condition === 'DAMAGED' || condition === 'FAIR' || flagIncident) {
        get().reportIncident({
          bookingId: b.id,
          resourceId: b.resourceId,
          resourceName: b.resourceName,
          reportedBy: b.userName,
          title: `Post-use discrepancy on ${b.resourceName}`,
          description: notes || 'Discrepancy noted during digital return inspection.',
          severity: condition === 'DAMAGED' ? 'HIGH' : 'MEDIUM',
          preCondition: `Logged at Check-In: ${b.checkInCondition || 'GOOD'}. ${b.checkInNotes || ''}`,
          postCondition: `Logged at Return: ${condition}. ${notes}`,
          aiDiscrepancySummary:
            'Gemini 2.5 Flash identified wear divergence between pre-check photo and return report. Review recommended.',
        });
      }

      get().showToast(`Check-out completed! Return state certified.`);
    }
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

  resolveIncident: (incidentId) => {
    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id === incidentId ? { ...inc, status: 'RESOLVED' } : inc
      ),
    }));
    const inc = get().incidents.find((i) => i.id === incidentId);
    if (inc) {
      get().addAuditLog(
        'INCIDENT_RESOLVED',
        `Incident marked resolved after inspection by lab supervisor.`,
        inc.resourceName
      );
      get().showToast(`Incident #${incidentId} resolved.`);
    }
  },

  addAuditLog: (action, details, resourceName) => {
    const randomHex = Math.random().toString(16).substring(2, 10);
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      action,
      actorName: get().currentUser.name,
      actorRole: get().currentUser.role,
      resourceName,
      details,
      hash: `0x${randomHex}${Date.now().toString(16)}`,
    };
    set((state) => ({ auditLogs: [newLog, ...state.auditLogs] }));
  },
}));

