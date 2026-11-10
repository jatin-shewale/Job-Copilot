import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  FiHome, FiSearch, FiFileText, FiTarget, FiMail, FiSend,
  FiTrendingUp, FiUser, FiLogOut, FiMenu, FiX, FiEdit3,
  FiChevronRight, FiBell, FiZap
} from 'react-icons/fi';

const navItems = [
  { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
  { path: '/jobs', icon: FiSearch, label: 'Job Search', badge: 'LIVE' },
  { path: '/resume', icon: FiFileText, label: 'Resume Analyzer' },
  { path: '/ats', icon: FiTarget, label: 'ATS Optimizer' },
  { path: '/rewrite', icon: FiEdit3, label: 'Resume Rewriter' },
  { path: '/cover-letter', icon: FiMail, label: 'Cover Letter' },
  { path: '/cold-email', icon: FiSend, label: 'Cold Email' },
  { path: '/skill-gap', icon: FiTrendingUp, label: 'Skill Gap' },
  { path: '/career', icon: FiUser, label: 'Career Coach' },
];

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200/50">
            <FiZap className="text-white text-lg" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm tracking-tight">JobCopilot</div>
            <div className="text-xs text-slate-500">AI Career Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label, badge }) => {
          const active = location.pathname === path;
          return (
            <Link key={path} to={path} onClick={() => setSidebarOpen(false)}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-all ${
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200/60'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className={`text-lg flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span className="text-sm font-medium flex-1">{label}</span>
                {badge && (
                  <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                    {badge}
                  </span>
                )}
                {active && <FiChevronRight className="text-white text-sm" />}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-200/80">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate">{user?.name}</div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-2xl transition-colors text-sm font-medium">
          <FiLogOut /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.08),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#f4f7fb_100%)]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-72 flex-col flex-shrink-0 border-r border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 lg:hidden flex flex-col shadow-2xl"
            >
              <div className="flex justify-end p-4">
                <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                  <FiX className="text-xl" />
                </button>
              </div>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white/85 backdrop-blur-xl border-b border-slate-200/80 px-4 lg:px-6 py-3.5 flex items-center gap-4 flex-shrink-0 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded-xl">
            <FiMenu className="text-xl" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-slate-900">
              {navItems.find(n => n.path === location.pathname)?.label || 'Dashboard'}
            </h1>
          </div>
          <button className="relative p-2 hover:bg-slate-100 rounded-xl">
            <FiBell className="text-slate-500 text-lg" />
            <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
