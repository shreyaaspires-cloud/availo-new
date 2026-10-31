'use client';

import React from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import {
  Clock,
  ShieldCheck,
  AlertTriangle,
  Boxes,
  CheckCircle,
  CalendarCheck,
  Layers,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const currentUser = useAppStore((s) => s.currentUser);
  const bookings = useAppStore((s) => s.bookings);
  const incidents = useAppStore((s) => s.incidents);
  const auditLogs = useAppStore((s) => s.auditLogs);

  // Active custody check: bookings currently checked in
  const activeCustodyBookings = bookings.filter((b) => b.status === 'CHECKED_IN');
  const openIncidents = incidents.filter((i) => i.status !== 'RESOLVED');

  const quotaPercent = Math.min(
    100,
    Math.round((currentUser.weeklyUsedHours / currentUser.maxWeeklyHours) * 100)
  );

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Institutional Operations Command
            </h1>
            <Badge variant={currentUser.role === 'ADMIN' ? 'purple' : 'info'}>
              {currentUser.role}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Logged in as <span className="font-semibold text-gray-700">{currentUser.name}</span> ({currentUser.department})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/resources">
            <Button size="sm" icon={<Boxes className="w-4 h-4 mr-1" />}>
              Reserve Equipment
            </Button>
          </Link>
          <Link href="/bookings">
            <Button variant="ghost" size="sm" icon={<CalendarCheck className="w-4 h-4 mr-1" />}>
              View Custody Lifecycle
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Active Custody
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">
            {activeCustodyBookings.length}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Possession certified</span>
          </div>
        </Card>

        <Card padding="md" hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Fair Quota Remaining
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">
            {(currentUser.maxWeeklyHours - currentUser.weeklyUsedHours).toFixed(1)}
            <span className="text-sm font-normal text-gray-500 ml-1">hrs</span>
          </p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                quotaPercent > 80 ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${quotaPercent}%` }}
            />
          </div>
        </Card>

        <Card padding="md" hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Trust Score
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">
            {currentUser.trustScore}
            <span className="text-sm font-normal text-gray-500 ml-1">/ 100</span>
          </p>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            Tier 1 Priority Borrower
          </p>
        </Card>

        <Card padding="md" hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Open Incidents
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">
            {openIncidents.length}
          </p>
          <p className="text-xs text-amber-700 mt-2 font-medium">
            Gemini Discrepancy Active
          </p>
        </Card>
      </div>

      {/* Action Required Banner for Active Bookings */}
      {activeCustodyBookings.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="purple" className="bg-white/20 text-white border-transparent">
                ACTION REQUIRED
              </Badge>
              <span className="text-xs font-mono">STEP 8: RETURN CHECK-OUT</span>
            </div>
            <h3 className="text-lg font-bold">
              You currently hold custody of: {activeCustodyBookings[0].resourceName}
            </h3>
            <p className="text-xs text-blue-100 max-w-xl">
              Custody commenced at {new Date(activeCustodyBookings[0].checkedInAt || '').toLocaleTimeString()}.
              When your session finishes, execute digital return check-out to log post-use condition.
            </p>
          </div>
          <Link href="/bookings">
            <Button
              variant="ghost"
              size="md"
              className="bg-white text-blue-900 hover:bg-blue-50 border-transparent font-bold shrink-0"
            >
              Perform Return Check-Out
            </Button>
          </Link>
        </div>
      )}

      {/* Two Column Layout: Active Lifecycle Feed + Real-Time Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Reservations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Your Booking Lifecycle</h2>
            <Link href="/bookings" className="text-xs font-semibold text-blue-600 hover:underline">
              View all ({bookings.length})
            </Link>
          </div>

          <div className="space-y-3">
            {bookings.slice(0, 4).map((b) => (
              <Card key={b.id} padding="sm" hoverEffect className="flex items-center justify-between">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">{b.resourceName}</span>
                    <Badge
                      variant={
                        b.status === 'CHECKED_IN'
                          ? 'success'
                          : b.status === 'APPROVED'
                          ? 'info'
                          : b.status === 'WAITLISTED'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {b.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{b.purpose}</p>
                  <p className="text-[11px] font-mono text-gray-400">
                    Slot: {new Date(b.startTime).toLocaleDateString()} • Fair Score: {b.fairAccessScore}/100
                  </p>
                </div>

                <Link href="/bookings">
                  <Button variant="ghost" size="sm">
                    Track
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column: Real-Time Immutable Audit Trail Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">Live Audit Ledger</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <span className="text-[11px] font-mono text-gray-400">SHA-256</span>
          </div>

          <Card padding="sm" className="bg-gray-950 text-gray-100 border-gray-800 space-y-3 font-mono">
            {auditLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-gray-900/80 border border-gray-800 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span className="text-blue-400 font-bold">{log.action}</span>
                  <span>{log.timestamp}</span>
                </div>
                <p className="text-gray-300 font-sans text-xs">{log.details}</p>
                <div className="text-[10px] text-gray-500 truncate pt-1 border-t border-gray-800/80">
                  Hash: <span className="text-purple-400">{log.hash}</span>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
