import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import JobSearch from './pages/JobSearch';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import ATSOptimizer from './pages/ATSOptimizer';
import CoverLetterGen from './pages/CoverLetterGen';
import ColdEmailGen from './pages/ColdEmailGen';
import SkillGap from './pages/SkillGap';
import CareerCoach from './pages/CareerCoach';
import ResumeRewriter from './pages/ResumeRewriter';
import DashboardLayout from './components/layout/DashboardLayout';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>;
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '12px', fontFamily: 'Inter' } }} />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><DashboardLayout><Dashboard /></DashboardLayout></PrivateRoute>} />
          <Route path="/jobs" element={<PrivateRoute><DashboardLayout><JobSearch /></DashboardLayout></PrivateRoute>} />
          <Route path="/resume" element={<PrivateRoute><DashboardLayout><ResumeAnalyzer /></DashboardLayout></PrivateRoute>} />
          <Route path="/ats" element={<PrivateRoute><DashboardLayout><ATSOptimizer /></DashboardLayout></PrivateRoute>} />
          <Route path="/cover-letter" element={<PrivateRoute><DashboardLayout><CoverLetterGen /></DashboardLayout></PrivateRoute>} />
          <Route path="/cold-email" element={<PrivateRoute><DashboardLayout><ColdEmailGen /></DashboardLayout></PrivateRoute>} />
          <Route path="/skill-gap" element={<PrivateRoute><DashboardLayout><SkillGap /></DashboardLayout></PrivateRoute>} />
          <Route path="/career" element={<PrivateRoute><DashboardLayout><CareerCoach /></DashboardLayout></PrivateRoute>} />
          <Route path="/rewrite" element={<PrivateRoute><DashboardLayout><ResumeRewriter /></DashboardLayout></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
