import React, { useState } from 'react';
import {
  Search,
  Plus,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Upload,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Resource, ResourceCategory } from '@/types';
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

  // Booking Modal State (Dynamic date initialization BUG-10 Fix)
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
  const [newResImageUrl, setNewResImageUrl] = useState('');
  const [newResMaxHours, setNewResMaxHours] = useState('10');

  // Complete 6 categories
  const categories: Array<'ALL' | ResourceCategory> = [
    'ALL',
    'MAKERSPACE_TOOL',
    'LABORATORY',
    'TESTING_DEVICE',
    'COMPUTE_WORKSTATION',
    'MICROSCOPY_SUITE',
    'CLEANROOM_EQUIPMENT',
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

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewResImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    const fallbackImage =
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';

    addResource({
      name: newResName,
      category: newResCategory,
      description: newResDesc,
      location: newResLocation,
      imageUrl: newResImageUrl.trim() || fallbackImage,
      currentCondition: 'EXCELLENT',
      requiredQualifications: newResCerts
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      maxHoursPerWeek: Number(newResMaxHours) || 10,
      isSupervised: false,
      requiresDeposit: false,
      isAvailable: true,
      specs: { Standard: 'Calibrated & Certified' },
    });

    setIsAddModalOpen(false);
    setNewResName('');
    setNewResDesc('');
    setNewResLocation('');
    setNewResImageUrl('');
    setNewResCerts('LASER_SAFETY_L1');
    setNewResMaxHours('10');
  };

  // Eligibility evaluation helper
  const checkEligibility = (resource: Resource) => {
    const missingCerts = resource.requiredQualifications.filter(
      (cert) => !currentUser.qualifications.includes(cert)
    );
    const quotaExceeded =
      currentUser.weeklyUsedHours >= currentUser.maxWeeklyHours;

    return {
      eligible: missingCerts.length === 0 && !quotaExceeded,
      missingCerts,
      quotaExceeded,
    };
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Institutional Resource Catalog
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse laboratory, fabrication, and testing assets with real-time automated eligibility verification
          </p>
        </div>

        {currentUser.role === 'ADMIN' && (
          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            icon={<Plus className="w-4 h-4 mr-1.5" />}
          >
            List New Resource (Step 1)
          </Button>
        )}
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by equipment name, keywords, specs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
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

      {/* Grid of Equipment */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((res) => {
          const { eligible, missingCerts, quotaExceeded } = checkEligibility(res);

          return (
            <Card
              key={res.id}
              className="flex flex-col overflow-hidden hover:shadow-md transition-shadow group border border-gray-200"
            >
              <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                <img
                  src={res.imageUrl}
                  alt={res.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Responsive Badge Overlay Bar (Prevents Collision Bug) */}
                <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-2 pointer-events-none">
                  <div className="flex flex-wrap gap-1.5 max-w-[68%]">
                    <Badge variant={res.isAvailable ? 'success' : 'neutral'}>
                      {res.isAvailable ? 'AVAILABLE' : 'IN USE'}
                    </Badge>
                    <Badge variant="info">
                      {res.category.split('_').join(' ')}
                    </Badge>
                  </div>

                  <div className="shrink-0">
                    <Badge
                      variant={
                        res.currentCondition === 'EXCELLENT'
                          ? 'success'
                          : res.currentCondition === 'GOOD'
                          ? 'info'
                          : 'warning'
                      }
                    >
                      {res.currentCondition}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-base group-hover:text-blue-600 transition-colors">
                    {res.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <span>📍</span> {res.location}
                  </p>
                  <p className="text-xs text-gray-600 mt-2.5 line-clamp-2 leading-relaxed">
                    {res.description}
                  </p>
                </div>

                {/* Eligibility Pill Banner */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-medium text-gray-700">Access Eligibility:</span>
                    {eligible ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Pre-Approved
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Prerequisite Gap
                      </span>
                    )}
                  </div>

                  {!eligible && (
                    <div className="text-[11px] text-amber-600 bg-amber-50/60 p-2 rounded-lg border border-amber-100 mb-2">
                      {missingCerts.length > 0 && (
                        <p>Missing Credential: {missingCerts.join(', ')}</p>
                      )}
                      {quotaExceeded && <p>Weekly allocation cap reached ({currentUser.maxWeeklyHours}h)</p>}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      variant={eligible ? 'primary' : 'ghost'}
                      onClick={() => setBookingModalRes(res)}
                    >
                      Submit Requisition (Step 3)
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/resources/${res.id}`)}
                    >
                      Telemetry
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Booking Requisition Modal (Step 3) */}
      <Modal
        isOpen={!!bookingModalRes}
        onClose={() => setBookingModalRes(null)}
        title={`Submit Custody Requisition: ${bookingModalRes?.name}`}
        subtitle="Automated credential validation and rolling 7-day quota inspection"
      >
        {bookingModalRes && (
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex items-start gap-3 text-xs text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-950">Automated Verification Protocol (Step 4)</p>
                <p className="mt-0.5 text-blue-700 leading-relaxed">
                  Upon submission, the scheduler verifies user credentials, 7-day usage limits, and calculates your explainable Fair-Access score.
                </p>
              </div>
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
                Project Purpose &amp; Materials Declaration
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                required
                placeholder="Explain research goals, materials to be processed, and required safety protocols..."
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* List New Resource Modal (Step 1) with Custom Image Upload & URL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="List New Institutional Resource (Step 1)"
        subtitle="Specify equipment specifications, custom photos, and weekly allocation caps"
      >
        <form onSubmit={handleAddResource} className="space-y-4">
          <Input
            label="Equipment / Space Name"
            value={newResName}
            onChange={(e) => setNewResName(e.target.value)}
            required
            placeholder="e.g. Stratasys F370 3D Printer"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <option value="MICROSCOPY_SUITE">MICROSCOPY_SUITE</option>
                <option value="CLEANROOM_EQUIPMENT">CLEANROOM_EQUIPMENT</option>
              </select>
            </div>

            <Input
              label="Weekly Hourly Cap (h)"
              type="number"
              value={newResMaxHours}
              onChange={(e) => setNewResMaxHours(e.target.value)}
              required
              min="1"
              max="168"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Location"
              value={newResLocation}
              onChange={(e) => setNewResLocation(e.target.value)}
              required
              placeholder="e.g. Engineering Hall — Room 302"
            />

            <Input
              label="Required Qualifications"
              value={newResCerts}
              onChange={(e) => setNewResCerts(e.target.value)}
              required
              placeholder="LASER_SAFETY_L1, RAPID_PROTO_L2"
            />
          </div>

          {/* Image Input Section (File Upload + URL + Live Preview) */}
          <div className="space-y-2 border border-gray-100 bg-gray-50/70 p-3.5 rounded-xl">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" /> Resource Photo
              </label>
              {newResImageUrl && (
                <button
                  type="button"
                  onClick={() => setNewResImageUrl('')}
                  className="text-xs text-red-600 hover:text-red-700 flex items-center gap-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-dashed border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-gray-500" />
                  <span>Choose local file...</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <input
                  type="url"
                  placeholder="Or paste image URL..."
                  value={newResImageUrl.startsWith('data:') ? '' : newResImageUrl}
                  onChange={(e) => setNewResImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Live Preview Card */}
            {newResImageUrl ? (
              <div className="relative h-28 w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-100 mt-2">
                <img
                  src={newResImageUrl}
                  alt="Resource preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                  Live Preview
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-gray-500">
                Optional: Upload a photo or provide an image link. A default laboratory image will be used if left empty.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={newResDesc}
              onChange={(e) => setNewResDesc(e.target.value)}
              rows={2}
              required
              placeholder="Technical specifications, authorized materials, and safety guidelines..."
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
