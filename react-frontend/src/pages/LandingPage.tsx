import React from 'react';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FileText,
  Boxes,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export function LandingPage() {
  const steps = [
    { num: '01', title: 'Requisition', desc: 'User submits timeslot, project scope, & cert reference' },
    { num: '02', title: 'Eligibility', desc: 'System validates required certs & safety clearance' },
    { num: '03', title: 'Fair-Access', desc: 'Weekly quota enforcement stops resource monopolization' },
    { num: '04', title: 'Waitlist Queue', desc: 'Transparent priority ranking for contested slots' },
    { num: '05', title: 'Lab Review', desc: 'Director arbitrates high-value equipment with 1 click' },
    { num: '06', title: 'Pre-Check', desc: 'User documents initial clean state with photo & notes' },
    { num: '07', title: 'Active Custody', desc: 'Time-locked physical possession and audit tracking' },
    { num: '08', title: 'Return Check', desc: 'Post-use condition sign-off and anomaly flagging' },
    { num: '09', title: 'AI Discrepancy', desc: 'Gemini 2.5 Flash analyzes pre vs post condition logs' },
    { num: '10', title: 'Immutable Close', desc: 'Permanent tamper-evident cryptographic audit stamp' },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-lg tracking-tight">NexusShare</span>
              <span className="ml-2 text-xs bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-full border border-blue-200">
                Institutional Network
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4 ml-1" />}>
                Launch Platform
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-4 h-4 text-blue-600" />
          Powered by Gemini 2.5 Flash &amp; Modern Stitch UI
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
          Share Lab Equipment &amp; Spaces <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            with Total Trust &amp; Fair Access.
          </span>
        </h1>

        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          The trusted, auditable platform helping universities, makerspaces, and research centers
          safely share underused high-value instruments with qualification gates, condition tracking,
          and anti-monopoly fairness caps.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link to="/dashboard">
            <Button size="lg" icon={<Boxes className="w-5 h-5 mr-1" />}>
              Explore Equipment Catalog
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost" size="lg">
              Quick Demo Login
            </Button>
          </Link>
        </div>

        {/* Operational Telemetry Banner */}
        <div className="mt-14 max-w-4xl mx-auto p-4 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <span className="font-mono text-xs text-gray-700 font-medium">
              LIVE SYSTEM FEDERATION: 142 CORE RESEARCH HUBS ONLINE
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safety Certified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Immutable Ledger</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Gemini Condition AI</span>
            </div>
          </div>
        </div>
      </section>

      {/* 10-Step Interactive Lifecycle Showcase */}
      <section className="py-16 bg-white border-y border-gray-200 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="info">10-Step Custody Lifecycle</Badge>
            <h2 className="text-3xl font-bold text-gray-900 mt-3 tracking-tight">
              Total Accountability from Request to Return
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Every transition is authenticated, fair-quota checked, condition-verified, and
              permanently logged into an append-only audit trail.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {steps.map((st) => (
              <div
                key={st.num}
                className="p-5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="font-mono text-2xl font-bold text-blue-600">{st.num}</span>
                  <h3 className="font-semibold text-gray-900 text-sm mt-2">{st.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{st.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center text-[10px] text-blue-600 font-medium">
                  <span>Audited Step</span>
                  <ChevronRight className="w-3 h-3 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Pillar Highlights */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card padding="lg" hoverEffect>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-6">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Fair-Access Quota Engine</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              No senior lab group can monopolize heavy equipment. Automated rolling weekly hour caps
              and waitlist priority scoring guarantee democratic access.
            </p>
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center text-xs font-semibold text-blue-600">
              <span>Anti-Monopoly Protection</span>
              <CheckCircle2 className="w-4 h-4 ml-1.5" />
            </div>
          </Card>

          <Card padding="lg" hoverEffect>
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Gemini 2.5 Flash Discrepancy AI</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Compares pre-check condition logs against return condition reports and photo logs to
              automatically detect micro-scratches, miscalibrations, or wear.
            </p>
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center text-xs font-semibold text-purple-600">
              <span>Automated Damage Triage</span>
              <CheckCircle2 className="w-4 h-4 ml-1.5" />
            </div>
          </Card>

          <Card padding="lg" hoverEffect>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-6">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Immutable Audit Ledger</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Every single booking request, approval, digital check-in, and return generates an
              append-only hash-linked record with zero edit or deletion capability.
            </p>
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center text-xs font-semibold text-emerald-600">
              <span>100% Chain-of-Custody</span>
              <CheckCircle2 className="w-4 h-4 ml-1.5" />
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-10 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-gray-800">NexusShare</span>
            <span>— Institutional &amp; Community Resource Sharing System</span>
          </div>
          <div className="flex gap-6">
            <Link to="/dashboard" className="hover:text-blue-600 transition-colors">
              Live Dashboard
            </Link>
            <Link to="/resources" className="hover:text-blue-600 transition-colors">
              Equipment Catalog
            </Link>
            <Link to="/ai-audit" className="hover:text-blue-600 transition-colors">
              Gemini Auditor
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

