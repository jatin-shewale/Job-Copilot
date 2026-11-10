import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiZap, FiUser, FiMail, FiLock, FiBriefcase, FiMapPin } from 'react-icons/fi';

const Input = ({ icon: Icon, label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
      <input {...props} className="field pl-9" />
    </div>
  </div>
);

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', target_role: '', location: '', experience_years: 0 });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to JobCopilot');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#edf2ff_100%)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <FiZap className="text-white" />
            </div>
            <span className="font-bold text-slate-900">JobCopilot AI</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-500 mt-1">Start finding jobs before everyone else</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input icon={FiUser} label="Full Name" type="text" required placeholder="Rahul Sharma"
            value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          <Input icon={FiMail} label="Email" type="email" required placeholder="you@example.com"
            value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          <Input icon={FiLock} label="Password" type="password" required placeholder="Min 8 characters"
            value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
          <Input icon={FiBriefcase} label="Target Role" type="text" placeholder="e.g. Software Engineer, Data Scientist"
            value={form.target_role} onChange={e => setForm(p => ({ ...p, target_role: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input icon={FiMapPin} label="Location" type="text" placeholder="Bangalore, India"
              value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Experience (years)</label>
              <input
                type="number"
                min="0"
                max="30"
                value={form.experience_years}
                onChange={e => setForm(p => ({ ...p, experience_years: parseInt(e.target.value) || 0 }))}
                className="field"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Create Account - It's Free"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account? <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
