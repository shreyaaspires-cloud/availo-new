'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { NavigationShell } from '@/components/layout/NavigationShell';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const currentUser = useAppStore((s) => s.currentUser);

  useEffect(() => {
    if (!currentUser || !currentUser.id) {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (!currentUser || !currentUser.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-sans text-sm">
        Authenticating institutional clearance...
      </div>
    );
  }

  return <NavigationShell>{children}</NavigationShell>;
}
