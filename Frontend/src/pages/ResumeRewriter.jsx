import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { resumeAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiEdit3, FiUpload, FiZap, FiCopy, FiCheck, FiLinkedin, FiFileText, FiAward } from 'react-icons/fi';

export default function ResumeRewriter() {
  const { user } = useAuth();
  const [resumeText, setResumeText] = useState(user?.resume_text || '');
  const [targetRole, setTargetRole] = useState(user?.target_role || '');
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [linkedinResult, setLinkedinResult] = useState(null);
  const [tab, setTab] = useState('bullets');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const res = await userAPI.uploadResume(file);
    setResumeText(res.data.resume_text || res.data.preview || '');
    toast.success('Resume loaded!');
  };

  const handleRewrite = async () => {
    if (!resumeText) { toast.error('Upload or paste your resume first'); return; }
    setLoading(true);
    try {
      const res = await resumeAPI.rewrite({ resume_text: resumeText, target_role: targetRole, job_description: jobDesc });
      setResult(res.data);
      toast.success('Resume rewritten with XYZ formula!');
    } catch { toast.error('Rewrite failed'); } finally { setLoading(false); }
  };

  const handleLinkedin = async () => {
    if (!resumeText) { toast.error('Upload resume first'); return; }
    setLinkedinLoading(true);
    try {
      const res = await resumeAPI.linkedin({ resume_text: resumeText });
      setLinkedinResult(res.data);
      setTab('linkedin');
      toast.success('LinkedIn profile generated!');
    } catch { toast.error('LinkedIn generation failed'); } finally { setLinkedinLoading(false); }
  };

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resume Rewriter</h1>
        <p className="text-gray-500 text-sm mt-1">Transform weak bullets into powerful Google XYZ achievement statements</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>Google XYZ Formula:</strong> "Accomplished <em>[X]</em> as measured by <em>[Y]</em>, by doing <em>[Z]</em>"
          — Every bullet is rewritten to quantify your impact and impress recruiters.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Role</label>
            <input value={targetRole} onChange={e => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Software Engineer"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <label className="btn-secondary cursor-pointer flex items-center gap-2 w-full justify-center py-2.5">
              <FiUpload /> Upload Resume (PDF/DOCX)
              <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleUpload} />
            </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Description (optional)</label>
          <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={3}
            placeholder="Paste job description for tailored keyword optimization..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Resume Text</label>
          <textarea value={resumeText} onChange={e => setResumeText(e.target.value)} rows={6}
            placeholder="Paste your resume here or upload above..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={handleRewrite} disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Rewriting...</> : <><FiEdit3 /> Rewrite with XYZ Formula</>}
          </button>
          <button onClick={handleLinkedin} disabled={linkedinLoading} className="btn-secondary flex items-center gap-2 disabled:opacity-50">
            {linkedinLoading ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <FiZap />}
            Generate LinkedIn Profile
          </button>
        </div>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Score Improvement */}
          {result.score_improvement && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-black text-gray-400">{result.score_improvement.before}</div>
                <div className="text-xs text-gray-500">Before</div>
              </div>
              <div className="text-3xl text-blue-400">→</div>
              <div className="text-center">
                <div className="text-3xl font-black text-green-600">{result.score_improvement.after}</div>
                <div className="text-xs text-green-600">After</div>
              </div>
              <div className="ml-auto bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
                <div className="text-2xl font-black text-green-700">+{result.score_improvement.after - result.score_improvement.before}</div>
                <div className="text-xs text-green-600">Score Boost</div>
              </div>
            </div>
          )}

          <div className="flex gap-1 flex-wrap">
            {['bullets', 'summary', 'skills', 'full', linkedinResult && 'linkedin'].filter(Boolean).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 text-xs font-medium rounded-lg capitalize transition-colors inline-flex items-center gap-1.5 ${tab === t ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
              >
                {t === 'bullets' && <FiEdit3 className="text-xs" />}
                {t === 'summary' && <FiFileText className="text-xs" />}
                {t === 'skills' && <FiAward className="text-xs" />}
                {t === 'full' && <FiCheck className="text-xs" />}
                {t === 'linkedin' && <FiLinkedin className="text-xs" />}
                <span>{t}</span>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            {tab === 'bullets' && (
              <div className="space-y-6">
                <h3 className="font-semibold text-gray-800">Experience Rewrites (XYZ Formula)</h3>
                {(result.experience_rewrites || []).map((exp, i) => (
                  <div key={i}>
                    <h4 className="font-bold text-gray-900 text-sm">{exp.original_title} at {exp.company}</h4>
                    <p className="text-xs text-gray-500 mb-3">{exp.duration}</p>
                    <div className="space-y-3">
                      {(exp.rewritten_bullets || []).map((bullet, j) => (
                        <div key={j} className="bg-green-50 rounded-xl p-3 flex items-start gap-2">
                          <FiCheck className="text-green-500 flex-shrink-0 mt-0.5 text-sm" />
                          <p className="text-sm text-gray-800">{bullet}</p>
                          <button onClick={() => copy(bullet)} className="ml-auto flex-shrink-0 text-gray-400 hover:text-gray-600"><FiCopy className="text-xs" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'summary' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">Optimized Professional Summary</h3>
                  <button onClick={() => copy(result.professional_summary)} className="text-xs text-blue-600 flex items-center gap-1 hover:underline"><FiCopy /> Copy</button>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-800 leading-relaxed">{result.professional_summary}</div>
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-700 text-sm mb-2">Keywords Added</h4>
                  <div className="flex flex-wrap gap-2">
                    {(result.keywords_added || []).map((k, i) => <span key={i} className="bg-green-50 text-green-700 border border-green-200 text-xs px-2.5 py-1 rounded-lg font-medium">{k}</span>)}
                  </div>
                </div>
              </div>
            )}

            {tab === 'skills' && result.skills_section && (
              <div className="space-y-4">
                {Object.entries(result.skills_section).map(([category, skills]) => skills?.length > 0 && (
                  <div key={category}>
                    <h4 className="font-semibold text-gray-700 text-sm capitalize mb-2">{category.replace('_', ' ')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((s, i) => <span key={i} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-1 rounded-lg">{s}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'full' && result.full_resume_text && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">Complete Rewritten Resume</h3>
                  <button onClick={() => copy(result.full_resume_text)} className="text-xs text-blue-600 flex items-center gap-1 hover:underline"><FiCopy /> Copy All</button>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 bg-gray-50 rounded-xl p-5 leading-relaxed max-h-96 overflow-y-auto">{result.full_resume_text}</pre>
              </div>
            )}

            {tab === 'linkedin' && linkedinResult && (
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between mb-2">
                    <h4 className="font-semibold text-gray-800 text-sm">LinkedIn Headline</h4>
                    <button onClick={() => copy(linkedinResult.headline)} className="text-xs text-blue-600 flex items-center gap-1 hover:underline"><FiCopy /> Copy</button>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-sm font-medium text-gray-800">{linkedinResult.headline}</div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <h4 className="font-semibold text-gray-800 text-sm">About Section</h4>
                    <button onClick={() => copy(linkedinResult.about)} className="text-xs text-blue-600 flex items-center gap-1 hover:underline"><FiCopy /> Copy</button>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">{linkedinResult.about}</div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm mb-2">Top Skills to Add</h4>
                  <div className="flex flex-wrap gap-2">
                    {(linkedinResult.skills || []).map((s, i) => <span key={i} className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-lg border border-indigo-200">{s}</span>)}
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
