export interface User {
  id: string;
  email: string;
  name: string;
  department: string;
  role: 'USER' | 'ADMIN';
  qualifications: string[]; // e.g. ['LASER_SAFETY_L1', 'CNC_CERT', 'CLEANROOM_ISO5']
  trustScore: number; // 0-100
  weeklyUsedHours: number;
  maxWeeklyHours: number;
}

export type ResourceCategory =
  | 'LABORATORY'
  | 'MAKERSPACE_TOOL'
  | 'TESTING_DEVICE'
  | 'COMPUTE_WORKSTATION'
  | 'MICROSCOPY_SUITE'
  | 'CLEANROOM_EQUIPMENT';

export type ConditionRating = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED';

export interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  description: string;
  location: string;
  imageUrl: string;
  currentCondition: ConditionRating;
  requiredQualifications: string[];
  maxHoursPerWeek: number;
  isSupervised: boolean;
  requiresDeposit: boolean;
  depositAmount?: number;
  isAvailable: boolean;
  specs: Record<string, string>;
}

export type BookingStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'WAITLISTED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED';

export interface Booking {
  id: string;
  resourceId: string;
  resourceName: string;
  category: ResourceCategory;
  userId: string;
  userName: string;
  userDepartment: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: BookingStatus;
  fairAccessScore: number;
  waitlistPosition?: number;
  rejectionReason?: string;
  // Step 7 Pre-use condition
  checkInCondition?: ConditionRating;
  checkInNotes?: string;
  checkInPhotoUrl?: string;
  checkedInAt?: string;
  // Step 8 Post-use return condition
  checkOutCondition?: ConditionRating;
  checkOutNotes?: string;
  checkOutPhotoUrl?: string;
  checkedOutAt?: string;
}

export interface Incident {
  id: string;
  bookingId: string;
  resourceId: string;
  resourceName: string;
  reportedBy: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  reportedAt: string;
  aiDiscrepancySummary?: string;
  preCondition: string;
  postCondition: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  actorName: string;
  actorRole: 'USER' | 'ADMIN' | 'SYSTEM';
  resourceName: string;
  details: string;
  hash: string;
}
