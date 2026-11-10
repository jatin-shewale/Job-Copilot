import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { coverLetterAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMail, FiCopy, FiZap, FiUpload, FiFileText, FiAward, FiCheck } from 'react-icons/fi';

export default function CoverLetterGen() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    resume_text: user?.resume_text || '',
    job_title: params.get('role') || '',
    company_name: params.get('company') || '',
    job_description: params.get('desc') || '',
    company_info: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeVersion, setActiveVersion] = useState('full');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const res = await userAPI.uploadResume(file);
    setForm(p => ({ ...p, resume_text: res.data.resume_text || res.data.preview || '' }));
    toast.success('Resume loaded!');
  };

  const handleGenerate = async () => {
    if (!form.job_title || !form.company_name) { toast.error('Enter job title and company name'); return; }
    if (!form.resume_text) { toast.error('Upload or paste your resume first'); return; }
    setLoading(true);
    try {
      const res = await coverLetterAPI.generate(form);
      setResult(res.data);
      setActiveVersion(res.data.full_cover_letter ? 'full' : 'email');
      toast.success('Cover letter generated!');
    } catch { toast.error('Generation failed. Is AI running?'); } finally { setLoading(false); }
  };

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cover Letter Generator</h1>
        <p className="text-slate-500 text-sm mt-1">AI-generated personalized cover letters that stand out</p>
      </div>

      <div className="section-shell space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Job Title *</label>
            <input value={form.job_title} onChange={e => setForm(p => ({ ...p, job_title: e.target.value }))}
              placeholder="e.g. Software Engineer" className="field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name *</label>
            <input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
              placeholder="e.g. Google, Razorpay" className="field"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Job Description</label>
          <textarea value={form.job_description} onChange={e => setForm(p => ({ ...p, job_description: e.target.value }))} rows={4}
            placeholder="Paste the job description for a more personalized letter..."
            className="field resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Info (optional)</label>
          <input value={form.company_info} onChange={e => setForm(p => ({ ...p, company_info: e.target.value }))}
            placeholder="Recent news, product launches, values - helps personalize the letter"
            className="field"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">Your Resume</label>
            <label className="flex items-center gap-1.5 text-xs text-blue-600 cursor-pointer hover:underline">
              <FiUpload className="text-xs" /> Upload PDF/DOCX
              <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleUpload} />
            </label>
          </div>
          <textarea value={form.resume_text} onChange={e => setForm(p => ({ ...p, resume_text: e.target.value }))} rows={5}
            placeholder="Or paste your resume text here..."
            className="field resize-none font-mono"
          />
        </div>
        <button onClick={handleGenerate} disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</> : <><FiZap /> Generate Cover Letter</>}
        </button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex gap-2 border-b border-slate-200 pb-3">
            <button onClick={() => setActiveVersion('full')}
              className={`px-4 py-2 text-sm font-medium rounded-full flex items-center gap-1.5 ${activeVersion === 'full' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <FiFileText className="text-xs" />
              <span>Full Cover Letter</span>
            </button>
            <button onClick={() => setActiveVersion('email')}
              className={`px-4 py-2 text-sm font-medium rounded-full flex items-center gap-1.5 ${activeVersion === 'email' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <FiMail className="text-xs" />
              <span>Email Version</span>
            </button>
          </div>

          <div className="section-shell">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">
                {activeVersion === 'full' ? 'Full Cover Letter' : 'Email Version (150-200 words)'}
              </h3>
              <button onClick={() => copy(activeVersion === 'full' ? result.full_cover_letter : result.email_version)}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <FiCopy /> Copy
              </button>
            </div>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-2xl p-5">
                {(activeVersion === 'full' ? result.full_cover_letter : result.email_version) || 'No letter was generated. Please try again.'}
              </pre>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <p className="text-sm text-blue-800 font-medium flex items-center gap-1.5">
              <FiAward className="text-blue-600 animate-pulse" />
              <span>Pro Tips</span>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li className="flex items-start gap-1.5"><FiCheck className="text-blue-500 mt-0.5 flex-shrink-0" />Customize the opening line with a specific detail you know about the company</li>
              <li className="flex items-start gap-1.5"><FiCheck className="text-blue-500 mt-0.5 flex-shrink-0" />Add a specific metric from your experience that matches the JD</li>
              <li className="flex items-start gap-1.5"><FiCheck className="text-blue-500 mt-0.5 flex-shrink-0" />Send within 30 minutes of the job being posted for maximum impact</li>
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  );
}
