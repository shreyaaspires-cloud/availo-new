import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  Zap,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function AIAuditPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    discrepancyDetected: boolean;
    confidenceScore: number;
    divergenceMetric: string;
    maintenanceAction: string;
    fairnessPriorityReasoning: string;
  } | null>(null);

  const runLiveAudit = () => {
    setAnalyzing(true);
    setAnalysisResult(null);
    setTimeout(() => {
      setAnalyzing(false);
      setAnalysisResult({
        discrepancyDetected: true,
        confidenceScore: 99.1,
        divergenceMetric: 'Particulate micro-residue detected on sample aperture chamber #2',
        maintenanceAction: 'Auto-scheduled 15min UV-C sterilization cycle',
        fairnessPriorityReasoning:
          'Fair-access queue recalculated with transparent priority score 92/100.',
      });
    }, 1800);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Gemini 2.5 Flash Condition &amp; Fairness Suite
            </h1>
            <Badge variant="purple">AI Auditing Engine</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Multimodal condition discrepancy analysis &amp; explainable allocation priority reasoning
          </p>
        </div>

        <Button
          size="md"
          loading={analyzing}
          icon={<Play className="w-4 h-4 mr-1" />}
          onClick={runLiveAudit}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {analyzing ? 'Reasoning with Gemini...' : 'Run Live Condition Audit'}
        </Button>
      </div>

      <Card padding="lg" className="border-purple-200 bg-gradient-to-br from-white to-purple-50/30 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">
                Live Pre- vs. Post-Use Inspection Engine
              </h3>
              <p className="text-xs text-gray-500">
                Target: Trotec Speedy 400 CO2 Laser (Step 7 vs. Step 8 telemetry)
              </p>
            </div>
          </div>
          <span className="font-mono text-xs px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-semibold">
            gemini-2.5-flash
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-gray-700 uppercase">
                Step 7 Pre-Check Calibration
              </span>
              <span className="font-mono text-xs text-emerald-600 font-bold">PASSED (09:00 AM)</span>
            </div>
            <p className="text-xs text-gray-600">
              Sensor surface clean, laser optic baseline noise &lt; 0.02 mV, vacuum level optimal at
              10⁻⁶ mbar.
            </p>
            <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-full" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-gray-700 uppercase">
                Step 8 Return Inspection Stream
              </span>
              <span className="font-mono text-xs text-amber-600 font-bold">READY TO AUDIT</span>
            </div>
            <p className="text-xs text-gray-600">
              Optical aperture shows particulate smear. Beam scattering divergence detected.
            </p>
            <div className="h-1.5 w-full bg-amber-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 w-0" />
            </div>
          </div>
        </div>

        {analysisResult && (
          <div className="space-y-4">
            {analysisResult.discrepancyDetected ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between text-amber-900 font-semibold text-xs">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  PHYSICAL DISCREPANCY DETECTED: Return condition differs from baseline pre-check.
                </span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded font-mono">
                  ACTION REQUIRED
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center gap-2 text-emerald-900 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                CONGRUENCE CONFIRMED: Resource returned in acceptable baseline operational condition.
              </div>
            )}

            <div className="p-5 rounded-xl bg-gray-950 text-gray-100 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-purple-400 font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  GEMINI 2.5 FLASH TELEMETRY EVALUATION
                </span>
                <span className="text-gray-400">Confidence: {analysisResult.confidenceScore}%</span>
              </div>

              <div className="space-y-2 font-sans text-xs">
                <div>
                  <span className="text-purple-300 font-mono font-bold block mb-0.5">
                    DISCREPANCY DELTA:
                  </span>
                  <p className="text-gray-200">{analysisResult.divergenceMetric}</p>
                </div>

                <div>
                  <span className="text-emerald-300 font-mono font-bold block mb-0.5">
                    RECOMMENDED ACTION:
                  </span>
                  <p className="text-gray-200">{analysisResult.maintenanceAction}</p>
                </div>

                <div>
                  <span className="text-blue-300 font-mono font-bold block mb-0.5">
                    FAIR-ACCESS ALLOCATION REASONING:
                  </span>
                  <p className="text-gray-200">{analysisResult.fairnessPriorityReasoning}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

