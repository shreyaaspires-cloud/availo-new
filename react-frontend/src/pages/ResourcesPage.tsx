import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Resource, ResourceCategory } from '@/types';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Plus,
  CalendarPlus,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useNavigate } from 'react-router-dom';

export function ResourcesPage() {
  const navigate = useNavigate();
  const resources = useAppStore((s) => s.resources);
  const currentUser = useAppStore((s) => s.currentUser);
  const addResource = useAppStore((s) => s.addResource);
  const requestBooking = useAppStore((s) => s.requestBooking);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Booking Modal State
  const [bookingModalRes, setBookingModalRes] = useState<Resource | null>(null);
  const [startDate, setStartDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState(() => new Date(Date.now() + 86400000 + 3600000 * 3).toISOString().slice(0, 16));
  const [purpose, setPurpose] = useState('');

  // Add Resource Modal State (Admin only)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newResName, setNewResName] = useState('');
  const [newResCategory, setNewResCategory] = useState<ResourceCategory>('MAKERSPACE_TOOL');
  const [newResDesc, setNewResDesc] = useState('');
  const [newResLocation, setNewResLocation] = useState('');
  const [newResCerts, setNewResCerts] = useState('LASER_SAFETY_L1');

  const categories = [
    'ALL',
    'MAKERSPACE_TOOL',
    'LABORATORY',
    'TESTING_DEVICE',
    'COMPUTE_WORKSTATION',
  ];

  const filteredResources = resources.filter((res) => {
    const matchesSearch =
      res.name.toLowerCase().includes(search.toLowerCase()) ||
      res.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat =
      selectedCategory === 'ALL' || res.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModalRes) return;

    requestBooking({
      resourceId: bookingModalRes.id,
      resourceName: bookingModalRes.name,
      category: bookingModalRes.category,
      startTime: startDate,
      endTime: endDate,
      purpose,
    });
    setBookingModalRes(null);
    setPurpose('');
  };

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    addResource({
      name: newResName,
      category: newResCategory,
      description: newResDesc,
      location: newResLocation,
      imageUrl:
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      currentCondition: 'EXCELLENT',
      requiredQualifications: newResCerts.split(',').map((c) => c.trim()),
      maxHoursPerWeek: 10,
      isSupervised: false,
      requiresDeposit: false,
      isAvailable: true,
      specs: { Standard: 'Calibrated' },
    });
    setIsAddModalOpen(false);
    setNewResName('');
    setNewResDesc('');
    setNewResLocation('');
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Institutional Resource Catalog
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse equipment with real-time automated eligibility badges (Step 2)
          </p>
        </div>

        {currentUser.role === 'ADMIN' && (
          <Button
            size="md"
            icon={<Plus className="w-4 h-4 mr-1" />}
            onClick={() => setIsAddModalOpen(false)}
          >
            List New Resource (Step 1)
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search equipment or tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.split('_').join(' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((res) => {
          const isEligible = res.requiredQualifications.every((req) =>
            currentUser.qualifications.includes(req)
          );

          return (
            <Card key={res.id} padding="none" hoverEffect className="overflow-hidden flex flex-col justify-between">
              <div>
                <div
                  className="relative h-44 bg-gray-100 overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/resources/${res.id}`)}
                >
                  <img
                    src={res.imageUrl}
                    alt={res.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant={
                        res.currentCondition === 'EXCELLENT'
                          ? 'success'
                          : res.currentCondition === 'GOOD'
                          ? 'info'
                          : 'warning'
                      }
                      size="sm"
                      dot
                    >
                      {res.currentCondition}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="font-mono text-[10px] bg-gray-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-md uppercase font-semibold">
                      {res.category.split('_').join(' ')}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <h3
                      className="font-bold text-base text-gray-900 leading-snug cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => navigate(`/resources/${res.id}`)}
                    >
                      {res.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{res.location}</p>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {res.description}
                  </p>

                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-gray-500">
                        Prerequisites:
                      </span>
                      {isEligible ? (
                        <Badge variant="success" size="sm">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Eligible
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Missing Cert
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {res.requiredQualifications.map((cert) => (
                        <span
                          key={cert}
                          className="font-mono text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-700"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Button
                  className="w-full"
                  size="sm"
                  variant={isEligible ? 'primary' : 'ghost'}
                  disabled={!isEligible}
                  onClick={() => setBookingModalRes(res)}
                  icon={<CalendarPlus className="w-4 h-4 mr-1" />}
                >
                  {isEligible ? 'Requisition Time Slot (Step 3)' : 'Qualification Required'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        isOpen={Boolean(bookingModalRes)}
        onClose={() => setBookingModalRes(null)}
        title="Requisition Booking Slot (Step 3)"
        subtitle={`Vetted automated quota verification for ${bookingModalRes?.name}`}
      >
        {bookingModalRes && (
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-blue-900">Fair-Access Policy:</span>
              <p className="text-blue-800">
                Weekly Hour Cap: {bookingModalRes.maxHoursPerWeek} hrs. Your current usage:{' '}
                {currentUser.weeklyUsedHours} / {currentUser.maxWeeklyHours} hrs.
              </p>
            </div>

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
              <label className="block text-sm font-medium text-gray-700">
                Research / Educational Purpose
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                required
                placeholder="Describe workpiece material, toolpaths, or analytical samples to be processed..."
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setBookingModalRes(null)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Submit Requisition
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="List New Institutional Resource (Step 1)"
        subtitle="Specify qualification prerequisites and weekly allocation caps"
      >
        <form onSubmit={handleAddResource} className="space-y-4">
          <Input
            label="Equipment / Space Name"
            value={newResName}
            onChange={(e) => setNewResName(e.target.value)}
            required
            placeholder="e.g. Stratasys F370 3D Printer"
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={newResCategory}
              onChange={(e) => setNewResCategory(e.target.value as ResourceCategory)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
            >
              <option value="MAKERSPACE_TOOL">MAKERSPACE_TOOL</option>
              <option value="LABORATORY">LABORATORY</option>
              <option value="TESTING_DEVICE">TESTING_DEVICE</option>
              <option value="COMPUTE_WORKSTATION">COMPUTE_WORKSTATION</option>
            </select>
          </div>

          <Input
            label="Location"
            value={newResLocation}
            onChange={(e) => setNewResLocation(e.target.value)}
            required
            placeholder="e.g. Engineering Hall — Room 302"
          />

          <Input
            label="Required Qualifications (comma-separated)"
            value={newResCerts}
            onChange={(e) => setNewResCerts(e.target.value)}
            required
            placeholder="LASER_SAFETY_L1, RAPID_PROTO_L2"
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={newResDesc}
              onChange={(e) => setNewResDesc(e.target.value)}
              rows={2}
              required
              placeholder="Technical specifications and acceptable materials..."
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Publish Resource
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

