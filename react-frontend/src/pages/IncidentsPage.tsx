import React from 'react';
import { useAppStore } from '@/lib/store';
import {
  Sparkles,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function IncidentsPage() {
  const incidents = useAppStore((s) => s.incidents);
  const currentUser = useAppStore((s) => s.currentUser);
  const investigateIncident = useAppStore((s) => s.investigateIncident);
  const resolveIncident = useAppStore((s) => s.resolveIncident);

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Incident &amp; Discrepancy Intelligence (Step 9)
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Automated pre- vs. post-use condition diff analysis powered by Gemini 2.5 Flash
        </p>
      </div>

      <div className="space-y-4">
        {incidents.map((inc) => (
          <Card key={inc.id} padding="md" hoverEffect className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">{inc.title}</h3>
                  <p className="text-xs text-gray-500">
                    Resource: <strong className="text-gray-800">{inc.resourceName}</strong> • Logged by {inc.reportedBy}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={inc.severity === 'HIGH' ? 'error' : 'warning'} size="sm">
                  {inc.severity} SEVERITY
                </Badge>
                <Badge variant={inc.status === 'RESOLVED' ? 'success' : 'purple'} size="sm">
                  {inc.status}
                </Badge>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">{inc.description}</p>

            {inc.aiDiscrepancySummary && (
              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Gemini 2.5 Flash Condition Discrepancy Assessment:</span>
                </div>
                <p className="text-xs text-purple-950 font-mono leading-relaxed">
                  {inc.aiDiscrepancySummary}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <span className="font-bold text-blue-700 block mb-1">
                  PRE-CHECK BASELINE (STEP 7)
                </span>
                <p className="text-gray-700">{inc.preCondition}</p>
              </div>
              <div>
                <span className="font-bold text-red-700 block mb-1">
                  RETURN CONDITION (STEP 8)
                </span>
                <p className="text-gray-700">{inc.postCondition}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] font-mono text-gray-400">
                Filed at {inc.reportedAt}
              </span>

              {currentUser?.role === 'ADMIN' && inc.status !== 'RESOLVED' && (
                <div className="flex items-center gap-2">
                  {inc.status === 'OPEN' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => investigateIncident(inc.id)}
                    >
                      Mark Investigating
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    icon={<CheckCircle2 className="w-4 h-4 mr-1" />}
                    onClick={() => resolveIncident(inc.id)}
                  >
                    Resolve &amp; Clear Resource
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

