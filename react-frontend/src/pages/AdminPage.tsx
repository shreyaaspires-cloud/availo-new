import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Check,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export function AdminPage() {
  const bookings = useAppStore((s) => s.bookings);
  const currentUser = useAppStore((s) => s.currentUser);
  const approveBooking = useAppStore((s) => s.approveBooking);
  const rejectBooking = useAppStore((s) => s.rejectBooking);
  const waitlistBooking = useAppStore((s) => s.waitlistBooking);
  const updateUserQualifications = useAppStore((s) => s.updateUserQualifications);
  const allUsers = useAppStore((s) => s.allUsers);

  const pendingBookings = bookings.filter((b) => b.status === 'PENDING');
  const waitlistedBookings = bookings.filter((b) => b.status === 'WAITLISTED');

  const [rejectModalBkId, setRejectModalBkId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Slot conflict with scheduled lab calibration.');

  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState('ALL_ACCESS_SUPERVISOR');
  const [targetUserId, setTargetUserId] = useState('user-maya-lin');

  const availableCerts = [
    'LASER_SAFETY_L1',
    'CNC_CERT',
    'RAPID_PROTO_L2',
    'CLEANROOM_ISO5',
    'HAZMAT_SAFETY',
    'ALL_ACCESS_SUPERVISOR',
  ];

  const handleGrantCert = () => {
    const updated = Array.from(new Set([...currentUser.qualifications, selectedCert]));
    updateUserQualifications(currentUser.id, updated);
    setIsCertModalOpen(false);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Lab Director Administrative Command (Steps 5 &amp; 6)
            </h1>
            <Badge variant="purple">ADMIN PRIVILEGE</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Requisition review, waitlist arbitration, and qualification badge management
          </p>
        </div>

        <Button
          size="md"
          icon={<Award className="w-4 h-4 mr-1" />}
          onClick={() => setIsCertModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          Grant Safety Qualification
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>Pending Allocation Queue (Step 5)</span>
            <Badge variant="warning">{pendingBookings.length}</Badge>
          </h2>
        </div>

        {pendingBookings.length === 0 ? (
          <Card padding="md" className="text-center text-gray-500 text-sm">
            All resource allocation requests have been arbitrated.
          </Card>
        ) : (
          pendingBookings.map((b) => (
            <Card key={b.id} padding="md" hoverEffect className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                <div>
                  <h3 className="font-bold text-base text-gray-900">{b.resourceName}</h3>
                  <p className="text-xs text-gray-500">
                    Requisitioned by {b.userName} ({b.userDepartment})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono">
                    Fairness Score: <strong>{b.fairAccessScore}/100</strong>
                  </span>
                  <Badge variant="warning">PENDING REVIEW</Badge>
                </div>
              </div>

              <div className="text-xs text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-4">
                <p>
                  <strong>Timeslot:</strong> {new Date(b.startTime).toLocaleString()}
                </p>
                <p>
                  <strong>Scope:</strong> {b.purpose}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => waitlistBooking(b.id)}
                  icon={<Clock className="w-3.5 h-3.5 mr-1" />}
                >
                  Move to Waitlist
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setRejectModalBkId(b.id)}
                  icon={<XCircle className="w-3.5 h-3.5 mr-1" />}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => approveBooking(b.id)}
                  icon={<CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                >
                  Approve Requisition
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span>Contested Slot Waitlist Priority Queue (Step 6)</span>
          <Badge variant="info">{waitlistedBookings.length}</Badge>
        </h2>

        {waitlistedBookings.map((b) => (
          <Card key={b.id} padding="sm" className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-gray-900">{b.resourceName}</h4>
              <p className="text-xs text-gray-500">
                Borrower: {b.userName} • Priority Score: {b.fairAccessScore}/100
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="purple">Priority #{b.waitlistPosition || 1}</Badge>
              <Button
                size="sm"
                variant="primary"
                onClick={() => approveBooking(b.id)}
                icon={<Check className="w-3.5 h-3.5 mr-1" />}
              >
                Promote to Approved
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={Boolean(rejectModalBkId)}
        onClose={() => setRejectModalBkId(null)}
        title="Reject Requisition"
        subtitle="Mandatory explanation required for institutional audit record"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Rejection Reason</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              required
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="ghost" size="sm" onClick={() => setRejectModalBkId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (rejectModalBkId) {
                  rejectBooking(rejectModalBkId, rejectReason);
                  setRejectModalBkId(null);
                }
              }}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        title="Grant Safety Certification"
        subtitle="Endorse user qualifications for specialized equipment clearance"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Target Student / Researcher
            </label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role}) — {u.department}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Select Safety Credential
            </label>
            <select
              value={selectedCert}
              onChange={(e) => setSelectedCert(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
            >
              {availableCerts.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="ghost" size="sm" onClick={() => setIsCertModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleGrantCert}>
              Grant Credential
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

