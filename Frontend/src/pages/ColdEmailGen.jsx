import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { coldEmailAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiSend, FiCopy, FiZap, FiUpload, FiGlobe, FiMail, FiSearch, FiCheck, FiCalendar } from 'react-icons/fi';

export default function ColdEmailGen() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    resume_text: user?.resume_text || '',
    job_title: params.get('role') || '',
    company_name: params.get('company') || '',
    hr_name: '',
    company_email: ''
  });
  const [loading, setLoading] = useState(false);
  const [researching, setResearching] = useState(false);
  const [result, setResult] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [activeEmail, setActiveEmail] = useState(0);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const res = await userAPI.uploadResume(file);
    setForm(p => ({ ...p, resume_text: res.data.preview || '' }));
    toast.success('Resume loaded!');
  };

  const handleResearch = async () => {
    if (!form.company_name) { toast.error('Enter company name first'); return; }
    setResearching(true);
    try {
      const res = await coldEmailAPI.companyResearch({ company_name: form.company_name, company_website: companyWebsite });
      setCompanyInfo(res.data);
      if (res.data.emails_found?.length > 0) {
        setForm(p => ({ ...p, company_email: res.data.emails_found[0] }));
      }
      toast.success(`Found ${res.data.emails_found?.length || 0} contacts!`);
    } catch { toast.error('Research failed'); } finally { setResearching(false); }
  };

  const handleGenerate = async () => {
    if (!form.job_title || !form.company_name) { toast.error('Fill in job title and company'); return; }
    setLoading(true);
    try {
      const res = await coldEmailAPI.generate(form);
      setResult(res.data);
      toast.success('Cold emails generated!');
    } catch { toast.error('Generation failed'); } finally { setLoading(false); }
  };

  const copy = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cold Email Generator</h1>
        <p className="text-gray-500 text-sm mt-1">Reach HR directly with personalized emails that get responses</p>
      </div>

      {/* Company Research */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><FiGlobe className="text-blue-600" /> Company Research</h2>
        <div className="flex gap-3 flex-wrap">
          <input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
            placeholder="Company name *" className="flex-1 min-w-40 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)}
            placeholder="Company website (optional)" className="flex-1 min-w-40 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={handleResearch} disabled={researching} className="btn-secondary flex items-center gap-2 disabled:opacity-50">
            {researching ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <FiSearch />}
            Find HR Contacts
          </button>
        </div>

        {companyInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Found Contact Info</h3>
            {companyInfo.emails_found?.length > 0 ? (
              <div className="space-y-2">
                {companyInfo.emails_found.map((email, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <FiMail className="text-green-500 text-xs" />
                    <span className="text-sm text-gray-700 font-mono">{email}</span>
                    <button onClick={() => { setForm(p => ({ ...p, company_email: email })); toast.success('Email set!'); }}
                      className="text-xs text-blue-600 hover:underline">Use</button>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-500">No emails found on public pages. Try their LinkedIn or Careers page.</p>}
            {companyInfo.careers_page && (
              <a href={companyInfo.careers_page} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2">
                <FiGlobe /> View Careers Page
              </a>
            )}
          </motion.div>
        )}
      </div>

      {/* Email Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2"><FiSend className="text-blue-600" /> Generate Cold Emails</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Role *</label>
            <input value={form.job_title} onChange={e => setForm(p => ({ ...p, job_title: e.target.value }))}
              placeholder="e.g. Software Engineer" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">HR Name (optional)</label>
            <input value={form.hr_name} onChange={e => setForm(p => ({ ...p, hr_name: e.target.value }))}
              placeholder="e.g. Priya Mehta" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">HR Email (optional)</label>
            <input value={form.company_email} onChange={e => setForm(p => ({ ...p, company_email: e.target.value }))}
              placeholder="hr@company.com" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <label className="btn-secondary cursor-pointer flex items-center gap-2 py-2.5 w-full justify-center">
              <FiUpload /> Upload Resume
              <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleUpload} />
            </label>
          </div>
        </div>
        {form.resume_text && (
          <div className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
            <FiCheck className="text-green-500" />
            <span>Resume loaded ({form.resume_text.length} chars)</span>
          </div>
        )}
        <button onClick={handleGenerate} disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</> : <><FiZap /> Generate 3 Email Variations</>}
        </button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Email Tabs */}
          <div className="flex gap-2">
            {(result.emails || []).map((email, i) => (
              <button key={i} onClick={() => setActiveEmail(i)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${activeEmail === i ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
              >{email.type}</button>
            ))}
          </div>

          {result.emails?.[activeEmail] && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{result.emails[activeEmail].type}</h3>
                  <p className="text-xs text-gray-500 mt-1">Best for: {result.emails[activeEmail].best_for}</p>
                </div>
                <button onClick={() => copy(`Subject: ${result.emails[activeEmail].subject}\n\n${result.emails[activeEmail].body}`)}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                ><FiCopy /> Copy All</button>
              </div>
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 mb-1.5">SUBJECT LINE</div>
                <div className="bg-gray-50 rounded-xl p-3 text-sm font-medium text-gray-800 flex justify-between items-center">
                  {result.emails[activeEmail].subject}
                  <button onClick={() => copy(result.emails[activeEmail].subject)} className="text-blue-600 hover:underline text-xs ml-3 flex-shrink-0"><FiCopy /></button>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1.5">EMAIL BODY</div>
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 bg-gray-50 rounded-xl p-4 leading-relaxed">{result.emails[activeEmail].body}</pre>
              </div>
            </div>
          )}

          {/* Follow-up */}
          {result.follow_up_template && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
                <FiMail className="text-blue-500" />
                <span>Follow-up Template (7 days later)</span>
              </h3>
              <pre className="whitespace-pre-wrap font-sans text-sm text-gray-600 bg-gray-50 rounded-xl p-4">{result.follow_up_template}</pre>
              <button onClick={() => copy(result.follow_up_template)} className="text-xs text-blue-600 flex items-center gap-1 mt-3 hover:underline"><FiCopy /> Copy</button>
            </div>
          )}

          {/* Tips */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <h3 className="font-semibold text-amber-800 mb-2 text-sm flex items-center gap-1.5">
              <FiCalendar className="text-amber-600 animate-pulse" />
              <span>Sending Tips</span>
            </h3>
            <p className="text-xs text-amber-700 mb-2"><strong>Best time:</strong> {result.best_time_to_send}</p>
            <ul className="space-y-1">
              {(result.sending_tips || []).map((tip, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5"><FiCheck className="text-amber-600 mt-0.5 flex-shrink-0" />{tip}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  );
}
