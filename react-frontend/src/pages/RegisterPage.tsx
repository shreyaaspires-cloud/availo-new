import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { FlaskConical, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function RegisterPage() {
  const navigate = useNavigate();
  const showToast = useAppStore((s) => s.showToast);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Registration submitted for institutional safety validation.');
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
            placeholder="netid@university.edu"
          />

          <Input
            label="Department / Lab Group"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            required
            placeholder="e.g. Robotics & Mechanical Engineering"
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
            Submit for Certification Check
          </Button>
        </form>

        <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
          <span>Already registered? </span>
          <Link to="/login" className="text-blue-600 hover:underline font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

