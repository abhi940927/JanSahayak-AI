import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Public Pages
import { Home } from './pages/public/Home';
import { About } from './pages/public/About';
import { HowItWorks } from './pages/public/HowItWorks';
import { Departments } from './pages/public/Departments';
import { TrackComplaint } from './pages/public/TrackComplaint';
import { Login } from './pages/public/Login';
import { Register } from './pages/public/Register';

// Authenticated Pages
import { CitizenDashboard } from './pages/citizen/CitizenDashboard';
import { FileComplaint } from './pages/citizen/FileComplaint';
import { ComplaintDetail } from './pages/citizen/ComplaintDetail';
import { OfficerDashboard } from './pages/officer/OfficerDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ProfilePage } from './pages/common/ProfilePage';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Role Protected Guard
const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600">
        <div className="w-10 h-10 border-3 border-gov-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-700">Verifying security credentials...</p>
        <p className="text-xs text-slate-400 mt-1">Please wait while JanSahayak AI prepares your workspace</p>
      </div>
    );
  }

  // Redirect unauthenticated visitors to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If role is permitted, allow
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect to default dashboard
    if (role === 'officer') return <Navigate to="/officer/dashboard" replace />;
    if (role === 'department_admin' || role === 'super_admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/citizen/dashboard" replace />;
  }

  return children;
};

function AppContent() {
  const location = useLocation();
  const isDashboardRoute =
    location.pathname.startsWith('/citizen') ||
    location.pathname.startsWith('/officer') ||
    location.pathname.startsWith('/admin') ||
    location.pathname === '/profile' ||
    location.pathname.startsWith('/complaints');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {!isDashboardRoute && <Navbar />}
      <div className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/track" element={<TrackComplaint />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Citizen Routes */}
          <Route
            path="/citizen/dashboard"
            element={
              <ProtectedRoute allowedRoles={['citizen', 'super_admin']}>
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizen/file-complaint"
            element={
              <ProtectedRoute allowedRoles={['citizen', 'super_admin']}>
                <FileComplaint />
              </ProtectedRoute>
            }
          />

          {/* Complaint Details (Shared across roles) */}
          <Route path="/complaints/:id" element={<ComplaintDetail />} />

          {/* Officer Routes */}
          <Route
            path="/officer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['officer', 'department_admin', 'super_admin']}>
                <OfficerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['department_admin', 'super_admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* User Profile & Account Settings (Shared across all roles) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['citizen', 'officer', 'department_admin', 'super_admin']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/citizen/profile" element={<Navigate to="/profile" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!isDashboardRoute && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
