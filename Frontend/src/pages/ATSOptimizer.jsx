import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { atsAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiTarget, FiUpload, FiZap, FiCheck, FiX, FiAlertCircle, FiArrowRight } from 'react-icons/fi';

export default function ATSOptimizer() {
  const { user, refreshUser } = useAuth();
  const [resumeText, setResumeText] = useState(user?.resume_text || '');
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [result, setResult] = useState(null);
  const [optimized, setOptimized] = useState(null);
  const [tab, setTab] = useState('analysis');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const res = await userAPI.uploadResume(file);
    setResumeText(res.data.resume_text || res.data.preview || '');
    await refreshUser();
    toast.success('Resume loaded!');
  };

  const handleAnalyze = async () => {
    if (!resumeText || !jobDesc) { toast.error('Provide both resume and job description'); return; }
    setLoading(true);
    try {
      const res = await atsAPI.analyze({ resume_text: resumeText, job_description: jobDesc });
      setResult(res.data);
      toast.success('ATS analysis complete!');
    } catch { toast.error('Analysis failed'); } finally { setLoading(false); }
  };

  const handleOptimize = async () => {
    if (!resumeText || !jobDesc) return;
    setOptimizing(true);
    try {
      const res = await atsAPI.optimize({ resume_text: resumeText, job_description: jobDesc });
      setOptimized(res.data);
      setTab('optimized');
      toast.success('Resume optimized for ATS!');
    } catch { toast.error('Optimization failed'); } finally { setOptimizing(false); }
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ATS Optimizer</h1>
        <p className="text-slate-500 text-sm mt-1">Beat Applicant Tracking Systems with AI-powered keyword optimization</p>
      </div>

      <div className="section-shell space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">Your Resume</label>
              <label className="flex items-center gap-1 text-xs text-blue-600 cursor-pointer hover:underline">
                <FiUpload className="text-xs" /> Upload
                <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleUpload} />
              </label>
            </div>
            <textarea value={resumeText} onChange={e => setResumeText(e.target.value)} rows={8}
              placeholder="Paste your resume text or upload above..."
              className="field resize-none font-mono min-h-[15rem]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Job Description</label>
            <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={8}
              placeholder="Paste the full job description here. The more detailed, the better the optimization..."
              className="field resize-none min-h-[15rem]"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAnalyze} disabled={loading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiTarget />}
            Analyze ATS Score
          </button>
          {result && (
            <button onClick={handleOptimize} disabled={optimizing}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              {optimizing ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <FiZap />}
              Auto-Optimize Resume
            </button>
          )}
        </div>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Score Overview */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="metric-card bg-blue-50/80 text-center">
              <div className="text-4xl font-black text-blue-600">{result.ats_score}</div>
              <div className="text-sm text-slate-600 mt-1">ATS Score</div>
            </div>
            <div className="metric-card bg-emerald-50/80 text-center">
              <div className="text-4xl font-black text-green-600">{result.skill_match?.match_percentage || 0}%</div>
              <div className="text-sm text-slate-600 mt-1">Skill Match</div>
            </div>
            <div className="metric-card bg-violet-50/80 text-center">
              <div className="text-4xl font-black text-purple-600">{result.formatting_compatibility?.score || 0}</div>
              <div className="text-sm text-slate-600 mt-1">Format Score</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-slate-200/80 pb-2">
            {['analysis', 'keywords', 'improvements', optimized && 'optimized'].filter(Boolean).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`pill-tab ${tab === t ? 'pill-tab-active' : ''}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="section-shell">
            {tab === 'analysis' && (
              <div className="space-y-5">
                {/* Section Scores */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-4">Section Scores</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(result.section_scores || {}).map(([section, score]) => (
                      <div key={section} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs text-slate-600 capitalize font-medium">{section.replace('_', ' ')}</span>
                          <span className="text-xs font-bold text-slate-900">{score}</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all" style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Parsing Issues */}
                {result.parsing_issues?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3">Parsing Issues</h3>
                    {result.parsing_issues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-2 py-2 border-b border-slate-100 text-sm text-slate-600">
                        <FiAlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <span>{issue}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'keywords' && (
              <div className="space-y-5">
                {[
                  { label: 'Excellent Match', items: result.keyword_density?.excellent, color: 'bg-green-50 text-green-700 border-green-200' },
                  { label: 'Good Match', items: result.keyword_density?.good, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                  { label: 'Missing (Add These!)', items: result.keyword_density?.missing, color: 'bg-red-50 text-red-700 border-red-200' },
                  { label: 'Recommended', items: result.keyword_density?.recommended, color: 'bg-amber-50 text-amber-700 border-amber-200' },
                ].map(({ label, items, color }) => items?.length > 0 && (
                  <div key={label}>
                    <h3 className="font-semibold text-slate-800 mb-2 text-sm">{label}</h3>
                    <div className="flex flex-wrap gap-2">
                      {items.map((k, i) => <span key={i} className={`${color} border px-3 py-1 rounded-full text-xs font-medium`}>{k}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'improvements' && (
              <div className="space-y-4">
                {(result.improvements || []).map((imp, i) => (
                  <div key={i} className={`p-4 rounded-2xl border ${imp.type === 'CRITICAL' ? 'bg-rose-50 border-rose-200' : imp.type === 'HIGH' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${imp.type === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : imp.type === 'HIGH' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{imp.type}</span>
                    <p className="text-sm font-semibold text-slate-800 mt-2">{imp.issue}</p>
                    <p className="text-sm text-slate-600 mt-1">Fix: {imp.fix}</p>
                    {imp.example && <p className="text-xs text-slate-500 mt-2 bg-white rounded-xl p-3 font-mono border border-slate-100">Example: {imp.example}</p>}
                  </div>
                ))}
              </div>
            )}

            {tab === 'optimized' && optimized && (
              <div className="space-y-5">
                <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                  <div className="text-center">
                    <div className="text-2xl font-black text-slate-500">{optimized.before_after_score?.before}</div>
                    <div className="text-xs text-slate-500">Before</div>
                  </div>
                  <FiArrowRight className="text-2xl text-emerald-500" />
                  <div className="text-center">
                    <div className="text-2xl font-black text-emerald-600">{optimized.before_after_score?.after}</div>
                    <div className="text-xs text-emerald-600">After</div>
                  </div>
                  <div className="ml-auto bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full font-bold text-sm">
                    +{optimized.before_after_score?.improvement} points
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3">Optimized Summary</h3>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{optimized.optimized_sections?.summary}</div>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3">Recommended Skills to Add</h3>
                  <div className="flex flex-wrap gap-2">
                    {(optimized.optimized_sections?.skills || []).map((s, i) => (
                      <span key={i} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
