'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { FlaskConical, ArrowRight, Check } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const switchUser = useAppStore((s) => s.switchUser);
  const showToast = useAppStore((s) => s.showToast);

  const [email, setEmail] = useState('demo@yourapp.com');
  const [password, setPassword] = useState('••••••••');
  const [selectedRole, setSelectedRole] = useState<'USER' | 'ADMIN'>('USER');

  const handleQuickFill = (role: 'USER' | 'ADMIN') => {
    setSelectedRole(role);
    if (role === 'USER') {
      setEmail('demo@yourapp.com');
      setPassword('HackDemo@Hack');
    } else {
      setEmail('admin@yourapp.com');
      setPassword('HackAdmin@Hack');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    switchUser(selectedRole);
    showToast(`Authenticated as ${selectedRole === 'ADMIN' ? 'Dr. Aris Thorne (ADMIN)' : 'Maya Lin (USER)'}`);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-xl p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-md mx-auto">
            <FlaskConical className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">NexusShare Portal</h1>
          <p className="text-sm text-gray-500">
            Institutional Laboratory &amp; Makerspace Single Sign-On
          </p>
        </div>

        {/* Quick Demo Fill Buttons for Testing */}
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-900 uppercase font-mono tracking-wide">
              Fast Demo Switcher
            </span>
            <Badge variant="purple" size="sm">Pre-Seeded</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('USER')}
              className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                selectedRole === 'USER'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="text-xs font-bold flex items-center justify-between">
                <span>Maya Lin</span>
                {selectedRole === 'USER' && <Check className="w-3.5 h-3.5" />}
              </div>
              <p className={`text-[11px] truncate mt-0.5 ${selectedRole === 'USER' ? 'text-blue-100' : 'text-gray-500'}`}>
                Borrower (USER)
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('ADMIN')}
              className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                selectedRole === 'ADMIN'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="text-xs font-bold flex items-center justify-between">
                <span>Dr. Aris Thorne</span>
                {selectedRole === 'ADMIN' && <Check className="w-3.5 h-3.5" />}
              </div>
              <p className={`text-[11px] truncate mt-0.5 ${selectedRole === 'ADMIN' ? 'text-purple-100' : 'text-gray-500'}`}>
                Lab Director (ADMIN)
              </p>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Institutional Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="netid@university.edu"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          <Button
            type="submit"
            className="w-full mt-2"
            size="lg"
            icon={<ArrowRight className="w-4 h-4 ml-1" />}
          >
            Authenticate &amp; Enter
          </Button>
        </form>

        <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
          <span>Don&apos;t have an institutional credential? </span>
          <Link href="/register" className="text-blue-600 hover:underline font-semibold">
            Register for access
          </Link>
        </div>
      </div>
    </div>
  );
}
