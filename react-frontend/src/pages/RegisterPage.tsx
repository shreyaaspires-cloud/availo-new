import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { FlaskConical, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function RegisterPage() {
  const navigate = useNavigate();
  const showToast = useAppStore((s) => s.showToast);
  const registerUser = useAppStore((s) => s.registerUser);
  const allUsers = useAppStore((s) => s.allUsers);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Field non-empty check (BUG-07 Fix)
    if (!name.trim() || !email.trim() || !department.trim() || !password) {
      showToast('All fields are required', 'error');
      return;
    }

    // Email regex validation (BUG-07 Fix)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast('Please enter a valid institutional email address', 'error');
      return;
    }

    // Password length validation (BUG-07 Fix)
    if (password.length < 8) {
      showToast('Password must be at least 8 characters long', 'error');
      return;
    }

    // Duplicate email check against existing mock and registered users (FIX-13)
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = allUsers.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    if (existingUser) {
      showToast('Email already registered', 'error');
      return;
    }

    registerUser(name.trim(), normalizedEmail, department.trim(), password);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-md mx-auto">
            <FlaskConical className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Institutional Onboarding</h1>
          <p className="text-sm text-gray-500">
            Create your researcher / student credential
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Maya Lin"
          />

          <Input
            label="Institutional Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="name@university.edu"
          />

          <Input
            label="Department / Lab Division"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            required
            placeholder="e.g. Robotics & Mechanical Engineering"
          />

          <Input
            label="Password (min. 8 characters)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          <Button type="submit" className="w-full" size="lg" icon={<ArrowRight className="w-4 h-4 ml-1" />}>
            Complete Registration
          </Button>
        </form>

        <div className="text-center text-xs text-gray-500">
          Already have an authorized access profile?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
