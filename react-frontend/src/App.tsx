import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NavigationShell } from '@/components/layout/NavigationShell';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ResourcesPage } from '@/pages/ResourcesPage';
import { ResourceDetailPage } from '@/pages/ResourceDetailPage';
import { BookingsPage } from '@/pages/BookingsPage';
import { IncidentsPage } from '@/pages/IncidentsPage';
import { AIAuditPage } from '@/pages/AIAuditPage';
import { AdminPage } from '@/pages/AdminPage';
import { ProfilePage } from '@/pages/ProfilePage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Dashboard Shell Routes */}
        <Route
          path="/dashboard"
          element={
            <NavigationShell>
              <DashboardPage />
            </NavigationShell>
          }
        />
        <Route
          path="/resources"
          element={
            <NavigationShell>
              <ResourcesPage />
            </NavigationShell>
          }
        />
        <Route
          path="/resources/:id"
          element={
            <NavigationShell>
              <ResourceDetailPage />
            </NavigationShell>
          }
        />
        <Route
          path="/bookings"
          element={
            <NavigationShell>
              <BookingsPage />
            </NavigationShell>
          }
        />
        <Route
          path="/incidents"
          element={
            <NavigationShell>
              <IncidentsPage />
            </NavigationShell>
          }
        />
        <Route
          path="/ai-audit"
          element={
            <NavigationShell>
              <AIAuditPage />
            </NavigationShell>
          }
        />
        <Route
          path="/admin"
          element={
            <NavigationShell>
              <AdminPage />
            </NavigationShell>
          }
        />
        <Route
          path="/profile"
          element={
            <NavigationShell>
              <ProfilePage />
            </NavigationShell>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
