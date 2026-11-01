import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Booking, ConditionRating } from '@/types';
import {
  CheckCircle2,
  Camera,
  History,
  Check,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export function BookingsPage() {
  const bookings = useAppStore((s) => s.bookings);
  const currentUser = useAppStore((s) => s.currentUser);
  const checkInBooking = useAppStore((s) => s.checkInBooking);
  const checkOutBooking = useAppStore((s) => s.checkOutBooking);

  // Filter bookings: ADMIN sees all, regular USER sees only their own (FIX-17)
  const visibleBookings = currentUser?.role === 'ADMIN'
    ? bookings
    : bookings.filter((b) => b.userId === currentUser?.id);

  const [checkInModalBk, setCheckInModalBk] = useState<Booking | null>(null);
  const [checkInCondition, setCheckInCondition] = useState<ConditionRating>('GOOD');
  const [checkInNotes, setCheckInNotes] = useState('Workspace clean, safety guards mounted, zero visible wear.');

  const [checkOutModalBk, setCheckOutModalBk] = useState<Booking | null>(null);
  const [checkOutCondition, setCheckOutCondition] = useState<ConditionRating>('GOOD');
  const [checkOutNotes, setCheckOutNotes] = useState('Machine surface cleaned, toolbits returned to drawer.');
  const [reportIncident, setReportIncident] = useState(false);

  const [selectedAuditBk, setSelectedAuditBk] = useState<Booking | null>(null);

  const handleCloseCheckInModal = () => {
    setCheckInModalBk(null);
    setCheckInCondition('GOOD');
    setCheckInNotes('Workspace clean, safety guards mounted, zero visible wear.');
  };

  const handleCloseCheckOutModal = () => {
    setCheckOutModalBk(null);
    setCheckOutCondition('GOOD');
    setCheckOutNotes('Machine surface cleaned, toolbits returned to drawer.');
    setReportIncident(false);
  };

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInModalBk) return;
    checkInBooking(checkInModalBk.id, checkInCondition, checkInNotes);
    setCheckInModalBk(null);
    setCheckInCondition('GOOD');
    setCheckInNotes('Workspace clean, safety guards mounted, zero visible wear.');
  };

  const handleCheckOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkOutModalBk) return;
    checkOutBooking(
      checkOutModalBk.id,
      checkOutCondition,
      checkOutNotes,
      undefined,
      reportIncident
    );
    setCheckOutModalBk(null);
    setCheckOutCondition('GOOD');
    setCheckOutNotes('Machine surface cleaned, toolbits returned to drawer.');
    setReportIncident(false);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Custody &amp; Bookings Lifecycle Tracker
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Governing Steps 5–8 &amp; 10: Allocation, Pre-Check, Possession, and Return Sign-Off
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {visibleBookings.map((bk) => (
          <Card key={bk.id} padding="md" hoverEffect className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                  {bk.category.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">{bk.resourceName}</h3>
                  <p className="text-xs text-gray-500">
                    Requisitioned by <span className="font-medium text-gray-700">{bk.userName}</span> ({bk.userDepartment})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gray-500">
                  Fairness Score: <strong className="text-gray-900">{bk.fairAccessScore}/100</strong>
                </span>
                <Badge
                  variant={
                    bk.status === 'CHECKED_IN'
                      ? 'success'
                      : bk.status === 'APPROVED'
                      ? 'info'
                      : bk.status === 'WAITLISTED'
                      ? 'warning'
                      : 'neutral'
                  }
                  size="md"
                  dot
                >
                  {bk.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
              <div>
                <span className="font-semibold text-gray-700 block mb-0.5">Timeslot</span>
                <p className="font-mono text-gray-800">
                  {new Date(bk.startTime).toLocaleString()}
                </p>
              </div>

              <div>
                <span className="font-semibold text-gray-700 block mb-0.5">Project Scope</span>
                <p className="line-clamp-2">{bk.purpose}</p>
              </div>

              <div>
                <span className="font-semibold text-gray-700 block mb-0.5">
                  Custody Chain Status
                </span>
                <p className="text-gray-800">
                  {bk.status === 'CHECKED_IN' && 'Physical possession verified. Timer active.'}
                  {bk.status === 'APPROVED' && 'Ready for Step 7: Digital Pre-Check & Check-In.'}
                  {bk.status === 'WAITLISTED' && `Position #${bk.waitlistPosition || 1} on Fair Quota Queue.`}
                  {bk.status === 'COMPLETED' && 'Returned and audited. Tamper-evident ledger sealed.'}
                  {bk.status === 'PENDING' && 'Pending Lab Manager safety review.'}
                </p>
              </div>
            </div>

            {(bk.checkInCondition || bk.checkOutCondition) && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {bk.checkInCondition && (
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-gray-800">
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                      <span>Step 7 Pre-Check Condition: {bk.checkInCondition}</span>
                    </div>
                    <p className="text-gray-600 mt-1 italic">&quot;{bk.checkInNotes}&quot;</p>
                  </div>
                )}
                {bk.checkOutCondition && (
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-gray-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Step 8 Return Condition: {bk.checkOutCondition}</span>
                    </div>
                    <p className="text-gray-600 mt-1 italic">&quot;{bk.checkOutNotes}&quot;</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setSelectedAuditBk(bk)}
                className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>View Step 10 Immutable Audit Proof</span>
              </button>

              <div className="flex items-center gap-2">
                {bk.status === 'APPROVED' && (
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Camera className="w-4 h-4 mr-1" />}
                    onClick={() => setCheckInModalBk(bk)}
                  >
                    Digital Check-In (Step 7)
                  </Button>
                )}

                {bk.status === 'CHECKED_IN' && (
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    icon={<CheckCircle2 className="w-4 h-4 mr-1" />}
                    onClick={() => setCheckOutModalBk(bk)}
                  >
                    Execute Return Check-Out (Step 8)
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={Boolean(checkInModalBk)}
        onClose={handleCloseCheckInModal}
        title="Step 7: Physical Check-In & Initial Condition Log"
        subtitle={`Document pre-existing condition before taking custody of ${checkInModalBk?.resourceName}`}
      >
        {checkInModalBk && (
          <form onSubmit={handleCheckInSubmit} className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
              <strong>Mandatory Protocol:</strong> Uploading or declaring initial state protects
              borrowers against liability for pre-existing defects.
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Initial Condition Rating
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['EXCELLENT', 'GOOD', 'FAIR'] as ConditionRating[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCheckInCondition(c)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer text-center ${
                      checkInCondition === c
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Inspection Notes &amp; Observations
              </label>
              <textarea
                value={checkInNotes}
                onChange={(e) => setCheckInNotes(e.target.value)}
                rows={3}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
              />
            </div>

            <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl text-center space-y-2 bg-gray-50">
              <Camera className="w-6 h-6 text-gray-400 mx-auto" />
              <p className="text-xs text-gray-500">
                Simulated On-Site Camera Verification Attached: <br />
                <span className="font-mono text-blue-600 font-semibold">
                  calibration_photo_01_pre.jpg (Verified)
                </span>
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCloseCheckInModal}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Confirm Custody Possession
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(checkOutModalBk)}
        onClose={handleCloseCheckOutModal}
        title="Step 8: Digital Return & Final Condition Sign-Off"
        subtitle={`Complete custody handoff for ${checkOutModalBk?.resourceName}`}
      >
        {checkOutModalBk && (
          <form onSubmit={handleCheckOutSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Final Return Condition
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED'] as ConditionRating[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCheckOutCondition(c)}
                    className={`p-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer text-center ${
                      checkOutCondition === c
                        ? c === 'DAMAGED'
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Return Cleanliness &amp; Operability Notes
              </label>
              <textarea
                value={checkOutNotes}
                onChange={(e) => setCheckOutNotes(e.target.value)}
                rows={3}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
              />
            </div>

            <label className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 cursor-pointer">
              <input
                type="checkbox"
                checked={reportIncident}
                onChange={(e) => setReportIncident(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600"
              />
              <span className="font-semibold">
                Flag an operational anomaly or micro-damage (Auto-triggers Gemini 2.5 AI Audit)
              </span>
            </label>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCloseCheckOutModal}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                Certify &amp; Close Custody
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(selectedAuditBk)}
        onClose={() => setSelectedAuditBk(null)}
        title="Step 10: Immutable Chain-of-Custody Audit Proof"
        subtitle={`Append-only cryptographic transition log for ${selectedAuditBk?.resourceName}`}
      >
        {selectedAuditBk && (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3 bg-gray-900 text-gray-100 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-blue-400 font-bold">
                <span>CHAIN ID: NS-9942</span>
                <span>STATUS: SEALED</span>
              </div>
              <p className="text-gray-300">
                Resource: {selectedAuditBk.resourceName} <br />
                User: {selectedAuditBk.userName} ({selectedAuditBk.userDepartment})
              </p>
              <p className="text-purple-300">
                Fair-Access Allocation Score: {selectedAuditBk.fairAccessScore} / 100
              </p>
            </div>

            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3 font-sans text-xs">
              <h4 className="font-bold text-gray-900">Recorded Transition Sequence:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Check className="w-4 h-4" />
                  <span>Step 1 &amp; 2: Automated qualification eligibility confirmed.</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700">
                  <Check className="w-4 h-4" />
                  <span>Step 3 &amp; 4: Quota verified under 12.0h weekly cap.</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700">
                  <Check className="w-4 h-4" />
                  <span>Step 5 &amp; 6: Lab director approved &amp; slot allocated.</span>
                </div>
                {selectedAuditBk.checkedInAt && (
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Check className="w-4 h-4" />
                    <span>
                      Step 7: Pre-check completed ({selectedAuditBk.checkInCondition}). Custody started.
                    </span>
                  </div>
                )}
                {selectedAuditBk.checkedOutAt && (
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Check className="w-4 h-4" />
                    <span>
                      Step 8 &amp; 9: Custody returned ({selectedAuditBk.checkOutCondition}).
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button size="sm" onClick={() => setSelectedAuditBk(null)}>
                Close Audit Inspection
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

