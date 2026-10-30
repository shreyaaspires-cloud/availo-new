import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import {
  LayoutDashboard,
  Cpu,
  CalendarCheck,
  AlertOctagon,
  Sparkles,
  ShieldCheck,
  User,
  FlaskConical,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ToastContainer } from '@/components/ui/ToastContainer';

export function NavigationShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const currentUser = useAppStore((s) => s.currentUser);
  const switchUser = useAppStore((s) => s.switchUser);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Resources', href: '/resources', icon: Cpu },
    { name: 'Custody & Bookings', href: '/bookings', icon: CalendarCheck },
    { name: 'Incident Logs', href: '/incidents', icon: AlertOctagon },
    { name: 'Gemini AI Auditor', href: '/ai-audit', icon: Sparkles },
    ...(currentUser.role === 'ADMIN'
      ? [{ name: 'Admin Command', href: '/admin', icon: ShieldCheck }]
      : []),
    { name: 'My Profile', href: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row text-gray-900 font-sans">
      <ToastContainer />

      <aside className="w-full lg:w-64 bg-white border-r border-gray-200 shrink-0 flex flex-col justify-between">
        <div>
          {/* Header Brand */}
          <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <FlaskConical className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 tracking-tight leading-none text-base">
                  NexusShare
                </span>
                <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase mt-0.5">
                  Institutional Lab
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Role Switcher for Hackathon Testing */}
          <div className="p-4 mx-3 my-3 bg-blue-50/60 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase font-semibold text-blue-900">
                Active Session
              </span>
              <Badge variant={currentUser.role === 'ADMIN' ? 'purple' : 'info'} size="sm">
                {currentUser.role}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-gray-500 truncate">
                  {currentUser.department}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2 border-t border-blue-100">
              <button
                onClick={() => switchUser('USER')}
                className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer text-center ${
                  currentUser.role === 'USER'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                User (Maya)
              </button>
              <button
                onClick={() => switchUser('ADMIN')}
                className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer text-center ${
                  currentUser.role === 'ADMIN'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Admin (Aris)
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-mono text-[10px]">VER 2.5 • STITCH UI</span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          </div>
        </div>
      </aside>

      {/* Main Viewport Content */}
      <main className="flex-1 min-w-0 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
}

