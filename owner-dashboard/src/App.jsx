import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedOwnerRoute from './components/layout/ProtectedOwnerRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import OrganizationsPage from './pages/OrganizationsPage';
import OrganizationDetailPage from './pages/OrganizationDetailPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import FleetPage from './pages/FleetPage';
import UsersPage from './pages/UsersPage';
import AuditLogsPage from './pages/AuditLogsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';

export default function App() {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Super Admin Dashboard Routes */}
      <Route
        path="/"
        element={
          <ProtectedOwnerRoute>
            <DashboardLayout />
          </ProtectedOwnerRoute>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="organizations" element={<OrganizationsPage />} />
        <Route path="organizations/:id" element={<OrganizationDetailPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="fleet" element={<FleetPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
      </Route>

      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
