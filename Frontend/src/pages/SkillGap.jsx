import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { skillGapAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiTrendingUp, FiUpload, FiZap, FiBook, FiCode, FiAward, FiMessageSquare, FiClock, FiCheck } from 'react-icons/fi';

const PriorityBadge = ({ p }) => {
  const colors = {
    CRITICAL: 'bg-red-100 text-red-700',
    HIGH: 'bg-orange-100 text-orange-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-green-100 text-green-700',
  };
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors[p] || colors.LOW}`}>{p || 'LOW'}</span>;
};

export default function SkillGap() {
  const { user } = useAuth();
  const [resumeText, setResumeText] = useState(user?.resume_text || '');
  const [targetRole, setTargetRole] = useState(user?.target_role || '');
  const [expYears, setExpYears] = useState(user?.experience_years || 0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState('gaps');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const res = await userAPI.uploadResume(file);
    setResumeText(res.data.resume_text || res.data.preview || '');
    toast.success('Resume loaded!');
  };

  const handleAnalyze = async () => {
    if (!resumeText || !targetRole) {
      toast.error('Provide resume and target role');
      return;
    }
    setLoading(true);
    try {
      const res = await skillGapAPI.analyze({
        resume_text: resumeText,
        target_role: targetRole,
        experience_years: expYears,
      });
      setResult(res.data);
      toast.success('Skill gap analysis complete!');
    } catch {
      toast.error('Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const analysis = result || {};
  const tabs = ['gaps', 'roadmap', 'projects', 'certifications', 'market'];

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Skill Gap Analyzer</h1>
        <p className="text-slate-500 text-sm mt-1">Know exactly what to learn next to land your target role</p>
      </div>

      <div className="section-shell space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Target Role *</label>
            <input
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Data Scientist, Full Stack Developer"
              className="field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Years of Experience</label>
            <input
              type="number"
              min="0"
              max="30"
              value={expYears}
              onChange={e => setExpYears(parseInt(e.target.value) || 0)}
              className="field"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-sm font-medium text-slate-700">Resume</label>
            <label className="flex items-center gap-1 text-xs text-blue-600 cursor-pointer hover:underline">
              <FiUpload className="text-xs" /> Upload
              <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleUpload} />
            </label>
          </div>
          <textarea
            value={resumeText}
            onChange={e => setResumeText(e.target.value)}
            rows={5}
            placeholder="Paste resume or upload above..."
            className="field resize-none font-mono"
          />
        </div>

        <button onClick={handleAnalyze} disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <FiZap /> Analyze Skill Gap
            </>
          )}
        </button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { label: 'Readiness', value: `${analysis.readiness_score ?? 0}%`, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Current Level', value: analysis.current_level || 'Unknown', color: 'text-gray-700', bg: 'bg-gray-50' },
              { label: 'Target Level', value: analysis.target_level || 'Unknown', color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Time to Ready', value: `${analysis.months_to_ready ?? 0}mo`, color: 'text-green-600', bg: 'bg-green-50' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-2xl p-4 text-center`}>
                <div className={`text-2xl font-black ${color}`}>{value}</div>
                <div className="text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {analysis.mentor_advice && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="text-sm text-blue-800 flex items-start gap-2">
                <FiMessageSquare className="text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Senior Engineer's Advice:</strong> {analysis.mentor_advice}
                </span>
              </div>
            </div>
          )}

          {analysis.quick_wins?.length > 0 && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <h3 className="font-semibold text-green-800 mb-2 text-sm flex items-center gap-1.5">
                <FiZap className="text-green-600" />
                <span>Quick Wins (This Week)</span>
              </h3>
              <ul className="space-y-1.5">
                {analysis.quick_wins.map((w, i) => (
                  <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                    <FiCheck className="text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-colors capitalize ${
                  tab === t ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="section-shell">
            {tab === 'gaps' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800">Skill Gaps to Close</h3>
                {(analysis.skill_gaps || []).length > 0 ? (
                  analysis.skill_gaps.map((gap, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-semibold text-gray-900">{gap.skill || 'Skill'}</span>
                        <PriorityBadge p={gap.priority || 'LOW'} />
                        <span className="ml-auto text-xs text-gray-500">{gap.learning_time || '1 week'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                        <span>Current: <strong className="text-gray-700">{gap.current_level || 'None'}</strong></span>
                        <span>Required: <strong className="text-gray-700">{gap.required_level || 'Intermediate'}</strong></span>
                      </div>
                      {gap.resources?.length > 0 && (
                        <div className="space-y-1.5">
                          {gap.resources.map((r, j) => (
                            <div key={j} className="flex items-start gap-2 text-xs text-gray-600">
                              {r.type === 'Course' ? (
                                <FiBook className="text-blue-500 flex-shrink-0 mt-0.5" />
                              ) : (
                                <FiCode className="text-green-500 flex-shrink-0 mt-0.5" />
                              )}
                              <span>
                                {r.name || r.description || 'Resource'}{' '}
                                {r.platform && `- ${r.platform}`}{' '}
                                {r.free && <span className="text-green-600 font-medium">(Free)</span>}{' '}
                                {r.duration && `· ${r.duration}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    No detailed gaps returned. Try another role or upload a more complete resume.
                  </div>
                )}
              </div>
            )}

            {tab === 'roadmap' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800 mb-1">Learning Roadmap</h3>
                {(analysis.learning_roadmap || []).length > 0 ? (
                  analysis.learning_roadmap.map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        {i < analysis.learning_roadmap.length - 1 && <div className="w-0.5 flex-1 bg-blue-100 my-1" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-blue-600">Week {item.week || `${i + 1}`}</span>
                          <span className="font-semibold text-gray-900 text-sm">{item.focus || 'Focus area'}</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{item.goal || 'Build confidence and role alignment.'}</p>
                        <div className="bg-green-50 rounded-lg px-2.5 py-1.5 text-xs text-green-700 font-medium">
                          Deliverable: {item.deliverable || 'A tangible project or milestone'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    No roadmap returned. The fallback should still populate this on the next run.
                  </div>
                )}
              </div>
            )}

            {tab === 'projects' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800 mb-1">Project Ideas to Build</h3>
                {(analysis.project_ideas || []).length > 0 ? (
                  analysis.project_ideas.map((proj, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{proj.title || 'Project Idea'}</h4>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium ${
                              proj.difficulty === 'Advanced'
                                ? 'bg-red-100 text-red-700'
                                : proj.difficulty === 'Intermediate'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {proj.difficulty || 'Intermediate'}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium inline-flex items-center gap-1 ${
                              proj.portfolio_impact === 'High' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            <FiTrendingUp className="text-[10px]" />
                            <span>{proj.portfolio_impact || 'Medium'}</span>
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{proj.description || 'A portfolio project tailored to the target role.'}</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {(proj.skills_covered || []).map((s, j) => (
                          <span key={j} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                            {s}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-400 inline-flex items-center gap-1">
                        <FiClock className="text-[10px]" />
                        <span>{proj.estimated_time || '1-2 weeks'}</span>
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    No project ideas returned. Try a more specific target role.
                  </div>
                )}
              </div>
            )}

            {tab === 'certifications' && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-800 mb-1">Recommended Certifications</h3>
                {(analysis.certifications || []).length > 0 ? (
                  analysis.certifications.map((cert, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
                      <FiAward className="text-yellow-500 text-xl flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-sm">{cert.name || 'Certification'}</div>
                        <div className="text-xs text-gray-500">
                          {cert.provider || 'Provider'} · {cert.time || '2-4 weeks'} · {cert.cost || 'Low'}
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${cert.roi === 'High' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        ROI: {cert.roi || 'Medium'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    No certifications returned. The fallback will usually suggest a few on the next run.
                  </div>
                )}
              </div>
            )}

            {tab === 'market' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800 mb-1">Job Market Intelligence</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <div className="text-sm font-bold text-blue-800">{analysis.job_market_insights?.demand_level || 'Medium'}</div>
                    <div className="text-xs text-gray-500 mt-1">Market Demand</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="text-sm font-bold text-green-800">{analysis.job_market_insights?.avg_salary_with_skills || 'Varies by region'}</div>
                    <div className="text-xs text-gray-500 mt-1">Avg Salary After Skills</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <div className="text-sm font-bold text-purple-800 capitalize">{analysis.job_market_insights?.trend || 'stable'}</div>
                    <div className="text-xs text-gray-500 mt-1">Market Trend</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 text-sm mb-2">Top Companies Hiring</h4>
                  <div className="flex flex-wrap gap-2">
                    {(analysis.job_market_insights?.top_companies_hiring || []).length > 0 ? (
                      analysis.job_market_insights.top_companies_hiring.map((c, i) => (
                        <span key={i} className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700">
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">No company list returned.</span>
                    )}
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
