'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import {
  Award,
  CheckCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function ProfilePage() {
  const currentUser = useAppStore((s) => s.currentUser);

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Institutional Member Profile
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Safety qualifications, active quotas, and verified trust rating
        </p>
      </div>

      <Card padding="lg" className="space-y-6">
        {/* User Identity Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 border-b border-gray-100 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
            {currentUser.name.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{currentUser.name}</h2>
              <Badge variant={currentUser.role === 'ADMIN' ? 'purple' : 'info'}>
                {currentUser.role}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{currentUser.department}</p>
            <p className="text-xs font-mono text-gray-400">{currentUser.email}</p>
          </div>
        </div>

        {/* Trust & Quotas Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Verified Borrower Trust Score
            </span>
            <p className="text-3xl font-extrabold text-blue-600">
              {currentUser.trustScore}
              <span className="text-sm text-gray-400 font-normal"> / 100</span>
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1 pt-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              Exemplary track record. 0 damage penalties.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Weekly Fair-Access Hours
            </span>
            <p className="text-3xl font-extrabold text-gray-900">
              {currentUser.weeklyUsedHours}{' '}
              <span className="text-sm text-gray-400 font-normal">
                / {currentUser.maxWeeklyHours} hrs used
              </span>
            </p>
            <p className="text-xs text-gray-500 pt-1">
              Resets every Monday 00:00 UTC
            </p>
          </div>
        </div>

        {/* Safety Qualifications */}
        <div className="space-y-3 pt-2">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-purple-600" />
            <span>Endorsed Safety Certifications &amp; Machine Clearances:</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {currentUser.qualifications.map((q) => (
              <div
                key={q}
                className="flex items-center gap-2 p-3 rounded-xl bg-white border border-gray-200"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <div>
                  <span className="font-mono text-xs font-bold text-gray-800">{q}</span>
                  <p className="text-[10px] text-gray-400">Institutional Safety Board Verified</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
