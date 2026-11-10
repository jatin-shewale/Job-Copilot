import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { recommendationsAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiUser, FiUpload, FiZap, FiTarget, FiCalendar, FiDollarSign, FiMessageSquare, FiTrendingUp, FiFileText, FiCheck, FiAlertTriangle, FiX } from 'react-icons/fi';

export default function CareerCoach() {
  const { user } = useAuth();
  const [activeMode, setActiveMode] = useState('roadmap');
  const [form, setForm] = useState({
    resume_text: user?.resume_text || '',
    current_role: '',
    target_role: user?.target_role || '',
    job_title: '',
    company_name: '',
    job_description: '',
    years: 2
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState('milestones');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const res = await userAPI.uploadResume(file);
    setForm(p => ({ ...p, resume_text: res.data.resume_text || res.data.preview || '' }));
    toast.success('Resume loaded!');
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      let res;
      if (activeMode === 'roadmap') {
        res = await recommendationsAPI.careerRoadmap(form);
      } else {
        res = await recommendationsAPI.interviewPrep({
          resume_text: form.resume_text,
          job_title: form.job_title || form.target_role,
          company_name: form.company_name,
          job_description: form.job_description
        });
      }
      setResult(res.data);
      toast.success('Career plan generated!');
    } catch { toast.error('Generation failed'); } finally { setLoading(false); }
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Career Coach</h1>
        <p className="text-slate-500 text-sm mt-1">Your personal career advisor - roadmap, interview prep, salary strategy</p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-3">
        {[
          { key: 'roadmap', label: 'Career Roadmap', icon: FiTrendingUp, desc: '2-year plan to reach your goal' },
          { key: 'interview', label: 'Interview Prep', icon: FiMessageSquare, desc: 'Questions, answers, company research' },
        ].map(({ key, label, icon: Icon, desc }) => (
          <button key={key} onClick={() => { setActiveMode(key); setResult(null); }}
            className={`flex-1 p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${activeMode === key ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
          >
            <div className={`p-2.5 rounded-lg ${activeMode === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
              <Icon className="text-lg" />
            </div>
            <div>
              <div className="font-semibold text-sm text-gray-900">{label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {activeMode === 'roadmap' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Role</label>
                <input value={form.current_role} onChange={e => setForm(p => ({ ...p, current_role: e.target.value }))}
                  placeholder="e.g. Junior Developer, Fresher"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Role</label>
                <input value={form.target_role} onChange={e => setForm(p => ({ ...p, target_role: e.target.value }))}
                  placeholder="e.g. Senior Engineer, Tech Lead"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Plan Duration (years)</label>
                <select value={form.years} onChange={e => setForm(p => ({ ...p, years: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 5].map(y => <option key={y} value={y}>{y} Year{y > 1 ? 's' : ''}</option>)}
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Title</label>
                <input value={form.job_title} onChange={e => setForm(p => ({ ...p, job_title: e.target.value }))}
                  placeholder="e.g. Software Engineer"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
                <input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                  placeholder="e.g. Google, Razorpay"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Description</label>
                <textarea value={form.job_description} onChange={e => setForm(p => ({ ...p, job_description: e.target.value }))} rows={3}
                  placeholder="Paste job description for tailored prep..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer hover:underline">
            <FiUpload /> Upload Resume
            <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleUpload} />
          </label>
          {form.resume_text && <span className="text-xs text-green-600 inline-flex items-center gap-1"><FiCheck className="text-[10px]" /> Resume loaded</span>}
        </div>

        <button onClick={handleGenerate} disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating plan...</> : <><FiZap /> {activeMode === 'roadmap' ? 'Build Career Roadmap' : 'Generate Interview Prep'}</>}
        </button>
      </div>

      {result && activeMode === 'roadmap' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {result.executive_summary && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-1.5"><FiFileText className="text-blue-600" /> Assessment</h3>
              <p className="text-blue-800 text-sm leading-relaxed">{result.executive_summary}</p>
            </div>
          )}

          <div className="flex gap-1 flex-wrap">
            {['milestones', 'quick_wins', 'salary', 'brand'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
              >{t.replace('_', ' ')}</button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            {tab === 'milestones' && (
              <div className="space-y-5">
                {(result.milestones || []).map((m, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">M{m.month}</div>
                      {i < (result.milestones.length - 1) && <div className="w-0.5 flex-1 bg-blue-100 my-2" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <h4 className="font-bold text-gray-900">{m.title}</h4>
                      <div className="space-y-1 mt-2">
                        {(m.goals || []).map((g, j) => <p key={j} className="text-xs text-gray-600 flex items-start gap-1.5"><span className="text-blue-500">→</span>{g}</p>)}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(m.skills_to_gain || []).map((s, j) => <span key={j} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-md">{s}</span>)}
                      </div>
                      {m.checkpoint && (
                        <div className="mt-2 text-xs bg-green-50 text-green-700 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                          <FiCheck className="text-green-600" />
                          <span>{m.checkpoint}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'quick_wins' && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-1.5">
                  <FiZap className="text-green-600 animate-pulse" />
                  <span>Quick Wins</span>
                </h3>
                {(result.quick_wins || []).map((w, i) => (
                  <div key={i} className="p-4 bg-green-50 border border-green-100 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-green-600 font-bold">{w.timeline}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{w.action}</p>
                    <p className="text-xs text-gray-500 mt-1">{w.impact}</p>
                  </div>
                ))}
              </div>
            )}

            {tab === 'salary' && result.salary_strategy && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="text-sm text-gray-500 mb-1">Current Market Rate</div>
                    <div className="text-xl font-bold text-gray-900">{result.salary_strategy.current_market_rate}</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="text-sm text-green-600 mb-1">Target Salary</div>
                    <div className="text-xl font-bold text-green-800">{result.salary_strategy.target_salary}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">Negotiation Tips</h4>
                  {(result.salary_strategy.negotiation_tips || []).map((t, i) => (
                    <div key={i} className="py-2 border-b border-gray-50 text-sm text-gray-700 flex items-start gap-2"><FiCheck className="text-blue-500 mt-0.5 flex-shrink-0" />{t}</div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'brand' && result.personal_brand && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">GitHub Strategy</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{result.personal_brand.github_strategy}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">LinkedIn Strategy</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{result.personal_brand.linkedin_strategy}</p>
                </div>
                {result.personal_brand.blog_topics?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2 text-sm">Blog Topics to Write</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.personal_brand.blog_topics.map((t, i) => (
                        <span key={i} className="bg-purple-50 text-purple-700 border border-purple-200 text-xs px-2.5 py-1 rounded-lg">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {result && activeMode === 'interview' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="flex gap-1 flex-wrap">
            {['rounds', 'behavioral', 'technical', 'questions', 'tips'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
              >{t}</button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            {tab === 'rounds' && (
              <div className="space-y-4">
                {(result.likely_interview_rounds || []).map((r, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">{i+1}</span>
                      <span className="font-semibold text-gray-900">{r.round}</span>
                      <span className="text-xs text-gray-500 ml-auto">{r.duration}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{r.format} - {r.focus}</p>
                    {(r.prep_tips || []).map((t, j) => <p key={j} className="text-xs text-gray-500 flex items-start gap-1.5 mt-1"><FiCheck className="text-blue-400 mt-0.5 flex-shrink-0" />{t}</p>)}
                  </div>
                ))}
              </div>
            )}

            {tab === 'behavioral' && (
              <div className="space-y-5">
                {(result.behavioral_questions || []).map((q, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4">
                    <div className="font-semibold text-gray-900 text-sm mb-2 flex items-start gap-2">
                      <FiMessageSquare className="text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>{q.question}</span>
                    </div>
                    <p className="text-xs text-blue-600 bg-blue-50 rounded-lg p-2 mb-2">{q.why_asked}</p>
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">{q.ideal_answer_structure}</p>
                    {q.candidate_example && (
                      <div className="text-xs text-green-700 bg-green-50 rounded-lg p-2 mt-2 flex items-start gap-1.5">
                        <FiCheck className="text-green-500 flex-shrink-0 mt-0.5" />
                        <span>From your resume: {q.candidate_example}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === 'technical' && (
              <div className="space-y-4">
                {(result.technical_questions || []).map((q, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4">
                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{q.topic}</span>
                    <p className="font-semibold text-gray-900 text-sm mt-2 mb-2">❓ {q.question}</p>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mb-2">{q.approach}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(q.concepts || []).map((c, j) => <span key={j} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-md">{c}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'questions' && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 mb-1">Smart Questions to Ask Interviewers</h3>
                {(result.questions_to_ask || []).map((q, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl">
                    <FiMessageSquare className="text-indigo-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-800">{q}</p>
                  </div>
                ))}
                {result.follow_up_email && (
                  <div className="mt-5">
                    <h3 className="font-semibold text-gray-800 mb-2">📧 Post-Interview Follow-up Email</h3>
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 bg-gray-50 rounded-xl p-4">{result.follow_up_email}</pre>
                  </div>
                )}
              </div>
            )}

            {tab === 'tips' && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 mb-1">Day-of-Interview Tips</h3>
                {(result.day_of_tips || []).map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
                    <span className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i+1}</span>
                    <p className="text-sm text-gray-700">{tip}</p>
                  </div>
                ))}
                {(result.red_flags_to_avoid || []).length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                      <FiAlertTriangle className="text-red-500" />
                      <span>Red Flags to Avoid</span>
                    </h3>
                    {result.red_flags_to_avoid.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 py-2 border-b border-gray-50 text-sm text-red-700">
                        <FiX className="text-red-500 flex-shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
