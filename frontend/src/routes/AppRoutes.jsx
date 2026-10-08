import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';

import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import CheckIn from '../pages/CheckIn';
import CheckOut from '../pages/CheckOut';
import Attendance from '../pages/Attendance';
import AttendanceHistory from '../pages/AttendanceHistory';
import LocationTracking from '../pages/LocationTracking';
import AssignedSite from '../pages/AssignedSite';
import AdminDashboard from '../pages/AdminDashboard';
import Employees from '../pages/Employees';
import Sites from '../pages/Sites';
import Reports from '../pages/Reports';
import Settings from '../pages/Settings';
import ErrorBoundary from '../components/ui/ErrorBoundary';

// Protected Route wrapper with role authorization
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
};

const AppRoutes = () => {
  const { user, isAdmin } = useAuth();

  return (
    <Routes>
      {/* Public Login Route: redirect to home if already authenticated */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
          ) : (
            <Login />
          )
        }
      />

      {/* Authenticated Application Shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Index Redirect based on role */}
        <Route
          index
          element={<Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />}
        />

        {/* Technician Core Routes */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="check-in" element={<CheckIn />} />
        <Route path="check-out" element={<CheckOut />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="history" element={<AttendanceHistory />} />
        <Route path="site" element={<AssignedSite />} />

        {/* Admin Management Routes - strictly restricted to admin role */}
        <Route
          path="admin"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="tracking"
          element={
            <ProtectedRoute requireAdmin={true}>
              <LocationTracking />
            </ProtectedRoute>
          }
        />
        <Route
          path="employees"
          element={
            <ProtectedRoute requireAdmin={true}>
              <Employees />
            </ProtectedRoute>
          }
        />
        <Route
          path="sites"
          element={
            <ProtectedRoute requireAdmin={true}>
              <Sites />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute requireAdmin={true}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute requireAdmin={true}>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
