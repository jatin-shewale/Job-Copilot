import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { userAPI, analysisAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiUpload, FiTarget, FiTrendingUp, FiSearch, FiMail, FiSend, FiUser, FiArrowRight, FiZap, FiEdit3, FiCheck, FiCheckCircle, FiXCircle, FiActivity, FiAlertTriangle } from 'react-icons/fi';
import { RadialBarChart, RadialBar, PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const ScoreCircle = ({ score, label, color }) => (
  <div className="flex flex-col items-center">
    <div className="relative w-24 h-24 rounded-full bg-white p-1 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${(score / 100) * 264} 264`}
          strokeLinecap="round" className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-gray-900">{score}</span>
      </div>
    </div>
    <span className="text-xs text-slate-500 mt-2 text-center font-medium uppercase tracking-wide">{label}</span>
  </div>
);

const quickActions = [
  { icon: FiSearch, label: 'Find Live Jobs', path: '/jobs', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100', badge: 'LIVE' },
  { icon: FiTarget, label: 'ATS Optimizer', path: '/ats', color: 'bg-green-50 text-green-600 hover:bg-green-100' },
  { icon: FiEdit3, label: 'Rewrite Resume', path: '/rewrite', color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
  { icon: FiMail, label: 'Cover Letter', path: '/cover-letter', color: 'bg-orange-50 text-orange-600 hover:bg-orange-100' },
  { icon: FiSend, label: 'Cold Email', path: '/cold-email', color: 'bg-pink-50 text-pink-600 hover:bg-pink-100' },
  { icon: FiTrendingUp, label: 'Skill Gap', path: '/skill-gap', color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' },
  { icon: FiUser, label: 'Career Coach', path: '/career', color: 'bg-teal-50 text-teal-600 hover:bg-teal-100' },
  { icon: FiZap, label: 'Resume Analysis', path: '/resume', color: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' },
];

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const atsScore = user?.ats_score || 0;
  const resumeScore = user?.resume_score || 0;
  const selectionProb = user?.last_analysis?.selection_probability || 0;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await userAPI.uploadResume(file);
      toast.success('Resume uploaded! Running AI analysis...');
      await refreshUser();
      // Auto-analyze
      setAnalyzing(true);
      const analysisRes = await analysisAPI.fullAnalysis({
        resume_text: res.data.preview,
        job_title: user?.target_role || ''
      });
      setAnalysis(analysisRes.data);
      await refreshUser();
      toast.success('Analysis complete!');
    } catch (err) {
      toast.error('Upload failed. Try again.');
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const analysisData = user?.last_analysis || analysis;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[28px] border border-blue-200/60 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 p-6 text-white shadow-[0_24px_80px_rgba(37,99,235,0.25)]"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 tracking-tight">Welcome back, {user?.name?.split(' ')[0]}! <FiActivity className="text-white/90" /></h1>
            <p className="text-blue-100 mt-1">
              {user?.target_role ? `Looking for: ${user.target_role}` : 'Tell us your target role to get started'}
            </p>
          </div>
          <label className={`flex items-center gap-2 bg-white/95 text-blue-700 px-4 py-2.5 rounded-2xl font-semibold text-sm cursor-pointer hover:bg-blue-50 transition-colors shadow-lg ${uploading || analyzing ? 'opacity-50' : ''}`}>
            {uploading ? 'Uploading...' : analyzing ? 'Analyzing...' : <><FiUpload /> Upload Resume</>}
            <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileUpload} disabled={uploading || analyzing} />
          </label>
        </div>
      </motion.div>

      {/* Score Cards */}
      {(atsScore > 0 || resumeScore > 0) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="section-shell"
        >
          <h2 className="font-bold text-slate-900 mb-6">Your AI Scores</h2>
          <div className="flex flex-wrap justify-around gap-6">
            <ScoreCircle score={atsScore} label="ATS Score" color="#3b82f6" />
            <ScoreCircle score={resumeScore} label="Resume Score" color="#10b981" />
            <ScoreCircle score={selectionProb} label="Selection Chance" color="#f59e0b" />
          </div>
        </motion.div>
      )}

      {/* No Resume State */}
      {!user?.resume_text && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="section-shell border-dashed border-blue-200 text-center"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <FiUpload className="text-2xl text-blue-600" />
          </div>
          <h3 className="font-bold text-slate-900 text-xl mb-2">Upload Your Resume to Get Started</h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">Get your ATS score, selection probability, skill gaps, and AI-powered improvements in seconds.</p>
          <label className="btn-primary cursor-pointer inline-flex items-center gap-2">
            <FiUpload /> Upload Resume (PDF/DOCX)
            <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileUpload} />
          </label>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="font-bold text-slate-900 mb-4">AI Tools</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(({ icon: Icon, label, path, color, badge }) => (
            <Link key={path} to={path}>
              <motion.div whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className={`${color} p-4 rounded-2xl flex flex-col gap-2 transition-all cursor-pointer relative shadow-sm border border-white/70`}
              >
                {badge && <span className="absolute top-2 right-2 text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">{badge}</span>}
                <Icon className="text-xl" />
                <span className="text-sm font-semibold leading-tight">{label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* Analysis Results */}
      {analysisData && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="section-shell"
        >
          <div className="flex items-center gap-2 mb-4">
            <FiActivity className="text-blue-600" />
            <h2 className="font-bold text-slate-900">AI Recruiter Analysis</h2>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-5 border border-blue-100">
            <p className="text-blue-900 text-sm leading-relaxed">{analysisData.key_findings || analysisData.recruiter_feedback}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-3 text-sm flex items-center gap-1.5"><FiCheckCircle className="text-emerald-500" /> Strengths</h3>
              <ul className="space-y-2">
                {(analysisData.strengths || []).slice(0, 4).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 text-sm text-slate-700">
                    <FiCheck className="text-emerald-500 flex-shrink-0 mt-0.5" /> <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Missing Skills */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-3 text-sm flex items-center gap-1.5"><FiXCircle className="text-rose-500" /> Missing Skills</h3>
              <div className="flex flex-wrap gap-2">
                {(analysisData.missing_skills || []).slice(0, 8).map((s, i) => (
                  <span key={i} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Items */}
          {analysisData.action_items?.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-slate-800 mb-3 text-sm flex items-center gap-1.5"><FiTarget className="text-blue-600" /> Priority Actions</h3>
              <div className="space-y-3">
                {analysisData.action_items.slice(0, 3).map((item, i) => (
                  <div key={i} className={`p-4 rounded-2xl border ${
                    item.priority === 'HIGH' ? 'bg-rose-50 border-rose-200' :
                    item.priority === 'MEDIUM' ? 'bg-amber-50 border-amber-200' :
                    'bg-emerald-50 border-emerald-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        item.priority === 'HIGH' ? 'bg-rose-100 text-rose-700' :
                        item.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>{item.priority}</span>
                      <span className="text-xs text-slate-400">Priority action</span>
                    </div>
                    <p className="text-sm text-slate-800 font-medium">{item.action}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
