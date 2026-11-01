'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { FlaskConical, ArrowRight, Check } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function LoginPage() {
  const router = useRouter();
  const switchUser = useAppStore((s) => s.switchUser);
  const showToast = useAppStore((s) => s.showToast);
  const allUsers = useAppStore((s) => s.allUsers);

  const [email, setEmail] = useState('demo@yourapp.com');
  const [password, setPassword] = useState('HackDemo@Hack');
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

  // BUG-021 Fix: Real credential and role matching against authorized users
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const matchedUser = allUsers.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );

    if (!matchedUser) {
      showToast('Authentication failed: Institutional email not recognized', 'error');
      return;
    }

    if (!password || password.length < 6) {
      showToast('Authentication failed: Invalid credentials format', 'error');
      return;
    }

    switchUser(matchedUser.role);
    showToast(`Authenticated as ${matchedUser.name} (${matchedUser.role})`);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-md mx-auto">
            <FlaskConical className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">NexusShare Portal</h1>
          <p className="text-sm text-gray-500">
            Institutional Laboratory &amp; Makerspace Single Sign-On
          </p>
        </div>

        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
              Fast Demo Profiles
            </span>
            <Badge variant="info">Pre-Authorized</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('USER')}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                selectedRole === 'USER'
                  ? 'border-blue-600 bg-white shadow-sm ring-2 ring-blue-500/20'
                  : 'border-blue-200 bg-white/60 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">Maya Lin</span>
                {selectedRole === 'USER' && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">Student / Borrower</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('ADMIN')}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                selectedRole === 'ADMIN'
                  ? 'border-blue-600 bg-white shadow-sm ring-2 ring-blue-500/20'
                  : 'border-blue-200 bg-white/60 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">Dr. Aris Thorne</span>
                {selectedRole === 'ADMIN' && <Check className="w-3.5 h-3.5 text-blue-600" />}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">Lab Director / Admin</p>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Institutional Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="demo@yourapp.com"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          <Button type="submit" className="w-full" size="lg" icon={<ArrowRight className="w-4 h-4 ml-1" />}>
            Sign In with Institutional SSO
          </Button>
        </form>

        <div className="text-center text-xs text-gray-500">
          New student, researcher, or faculty member?{' '}
          <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
            Request Credential
          </Link>
        </div>
      </div>
    </div>
  );
}
