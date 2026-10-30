import React from 'react';
import { NavigationShell } from '@/components/layout/NavigationShell';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NavigationShell>{children}</NavigationShell>;
}

