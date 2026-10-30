import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import {
  CalendarPlus,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  MapPin,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

export function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const resources = useAppStore((s) => s.resources);
  const currentUser = useAppStore((s) => s.currentUser);
  const requestBooking = useAppStore((s) => s.requestBooking);

  const resource = resources.find((r) => r.id === id);

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [startDate, setStartDate] = useState('2026-11-04T09:00');
  const [endDate, setEndDate] = useState('2026-11-04T12:00');
  const [purpose, setPurpose] = useState('');

  if (!resource) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Resource not found</h2>
        <Link to="/resources">
          <Button variant="outline" size="sm">
            Back to Resources
          </Button>
        </Link>
      </div>
    );
  }

  const isEligible = resource.requiredQualifications.every((req) =>
    currentUser.qualifications.includes(req)
  );

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestBooking({
      resourceId: resource.id,
      resourceName: resource.name,
      category: resource.category,
      startTime: startDate,
      endTime: endDate,
      purpose,
    });
    setIsBookingOpen(false);
    setPurpose('');
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <Link
        to="/resources"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Resources Catalog
      </Link>

      <Card padding="none" className="overflow-hidden">
        <div className="relative h-64 sm:h-80 bg-gray-100">
          <img
            src={resource.imageUrl}
            alt={resource.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <Badge
              variant={
                resource.currentCondition === 'EXCELLENT'
                  ? 'success'
                  : resource.currentCondition === 'GOOD'
                  ? 'info'
                  : 'warning'
              }
              size="md"
              dot
            >
              {resource.currentCondition}
            </Badge>
          </div>
          <div className="absolute bottom-4 left-4">
            <span className="font-mono text-xs bg-gray-950/80 backdrop-blur-xs text-white px-3 py-1 rounded-lg uppercase font-semibold">
              {resource.category.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{resource.name}</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                {resource.location}
              </p>
            </div>

            <Button
              size="lg"
              variant={isEligible ? 'primary' : 'outline'}
              disabled={!isEligible}
              onClick={() => setIsBookingOpen(true)}
              icon={<CalendarPlus className="w-5 h-5 mr-1" />}
            >
              {isEligible ? 'Requisition Time Slot (Step 3)' : 'Missing Qualification'}
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-sm text-gray-900">About this Resource</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{resource.description}</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-sm text-gray-900">Technical Specifications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {Object.entries(resource.specs).map(([key, val]) => (
                <div
                  key={key}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex justify-between"
                >
                  <span className="text-gray-500 font-medium">{key}:</span>
                  <span className="text-gray-900 font-mono font-semibold">{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 uppercase font-mono">
                Real-Time Eligibility Telemetry (Step 2)
              </span>
              {isEligible ? (
                <Badge variant="success" size="sm">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Pre-Cleared
                </Badge>
              ) : (
                <Badge variant="warning" size="sm">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  Action Required
                </Badge>
              )}
            </div>

            <p className="text-xs text-blue-800">
              Required Certifications:{' '}
              <strong className="font-mono">
                {resource.requiredQualifications.join(', ')}
              </strong>
            </p>
            <p className="text-xs text-blue-800">
              Weekly Allocation Cap: <strong>{resource.maxHoursPerWeek} hrs/week</strong> (Supervised:{' '}
              {resource.isSupervised ? 'Yes' : 'No'})
            </p>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        title="Requisition Time Slot (Step 3)"
        subtitle={`Vetted request for ${resource.name}`}
      >
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End Time"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Project Purpose</label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={3}
              required
              placeholder="State experimental objective, materials, or run parameters..."
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBookingOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Submit Requisition
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

