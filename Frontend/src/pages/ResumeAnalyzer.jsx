import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { analysisAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiUpload, FiZap, FiCheck, FiX, FiTarget, FiTrendingUp, FiStar, FiAlertCircle, FiEdit3, FiCheckCircle, FiXCircle, FiMessageSquare, FiFileText, FiImage, FiEye, FiEyeOff } from 'react-icons/fi';

const ScoreBar = ({ label, score, color }) => (
  <div>
    <div className="flex justify-between text-sm mb-1.5">
      <span className="text-gray-600 font-medium">{label}</span>
      <span className="font-bold" style={{ color }}>{score}/100</span>
    </div>
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1, delay: 0.3 }}
        className="h-full rounded-full" style={{ background: color }}
      />
    </div>
  </div>
);

export default function ResumeAnalyzer() {
  const { user, refreshUser } = useAuth();
  const [resumeText, setResumeText] = useState(user?.resume_text || '');
  const [jobTitle, setJobTitle] = useState(user?.target_role || '');
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(user?.last_analysis || null);
  const [activeTab, setActiveTab] = useState('overview');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showExtractedText, setShowExtractedText] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    toast.loading('Parsing resume...');
    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const res = await userAPI.uploadResume(file);
      setResumeText(res.data.resume_text || res.data.preview || '');
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setShowExtractedText(false);
      await refreshUser();
      toast.dismiss();
      toast.success('Resume uploaded!');
    } catch {
      toast.dismiss();
      toast.error('Upload failed');
    }
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim()) { toast.error('Please upload or paste your resume first'); return; }
    setLoading(true);
    try {
      const res = await analysisAPI.fullAnalysis({ resume_text: resumeText, job_title: jobTitle, job_description: jobDesc });
      setResult(res.data);
      await refreshUser();
      toast.success('AI analysis complete!');
    } catch {
      toast.error('Analysis failed. Is the AI model running?');
    } finally {
      setLoading(false);
    }
  };

  const tabs = ['overview', 'strengths', 'improvements', 'xyz_rewrites', 'interview'];

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Resume Analyzer</h1>
        <p className="text-slate-500 text-sm mt-1">Get recruiter-level feedback and ATS score in seconds</p>
      </div>

      {uploadedFile && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="section-shell space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Uploaded Resume Preview</div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">{uploadedFile.name}</h3>
              <p className="text-sm text-slate-500">The analysis uses the extracted text from this file.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowExtractedText(v => !v)}
              className="btn-secondary text-sm px-4 py-2.5"
            >
              {showExtractedText ? <FiEyeOff /> : <FiEye />}
              {showExtractedText ? 'Hide text' : 'Show extracted text'}
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 overflow-hidden">
            {previewUrl && uploadedFile.type === 'application/pdf' && (
              <iframe title="Resume preview" src={previewUrl} className="h-[520px] w-full bg-white" />
            )}
            {previewUrl && (uploadedFile.type || '').startsWith('image/') && (
              <img src={previewUrl} alt="Resume preview" className="h-[520px] w-full object-contain bg-white" />
            )}
            {previewUrl && !(uploadedFile.type || '').startsWith('image/') && uploadedFile.type !== 'application/pdf' && (
              <div className="flex min-h-[320px] items-center justify-center p-8 text-center">
                <div>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100 text-blue-600">
                    <FiFileText className="text-2xl" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900">Document preview unavailable</h4>
                  <p className="mt-2 text-sm text-slate-500">The file was uploaded successfully. We extracted the text for analysis.</p>
                </div>
              </div>
            )}
          </div>

          {showExtractedText && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Extracted Text</div>
              <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                {resumeText}
              </pre>
            </div>
          )}
        </motion.div>
      )}

      {/* Input Area */}
      <div className="section-shell space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Target Job Title</label>
            <input value={jobTitle} onChange={e => setJobTitle(e.target.value)}
              placeholder="e.g. Software Engineer, Data Scientist"
              className="field"
            />
          </div>
          <div className="sm:w-auto flex items-end">
            <label className="btn-secondary cursor-pointer flex items-center gap-2 py-3">
              <FiUpload /> Upload Resume
              <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Job Description (optional - improves accuracy)</label>
          <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} rows={3}
            placeholder="Paste the job description here for tailored analysis..."
            className="field resize-none"
          />
        </div>

        {!uploadedFile && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Resume Text</label>
            <textarea value={resumeText} onChange={e => setResumeText(e.target.value)} rows={10}
              placeholder="Or paste your resume text here..."
              className="field resize-none font-mono min-h-[18rem]"
            />
          </div>
        )}

        <button onClick={handleAnalyze} disabled={loading || !resumeText.trim()}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing with AI...</> : <><FiZap /> Run Full AI Analysis</>}
        </button>
      </div>

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Score Summary */}
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { label: 'ATS Score', value: result.ats_score, color: '#3b82f6', bg: 'bg-blue-50' },
              { label: 'Resume Score', value: result.resume_score, color: '#10b981', bg: 'bg-green-50' },
              { label: 'Selection %', value: result.selection_probability, color: '#f59e0b', bg: 'bg-amber-50' },
              { label: 'Grade', value: result.overall_grade, color: '#6366f1', bg: 'bg-indigo-50', isGrade: true },
            ].map(({ label, value, color, bg, isGrade }) => (
              <div key={label} className={`${bg} rounded-2xl p-5 text-center`}>
                <div className="text-3xl font-black mb-1" style={{ color }}>{isGrade ? value : `${value}`}{!isGrade && <span className="text-lg">/100</span>}</div>
                <div className="text-sm text-gray-600 font-medium">{label}</div>
              </div>
            ))}
          </div>

          {/* Key Finding */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
            <div className="flex items-start gap-3">
              <FiStar className="text-blue-600 text-xl flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Recruiter's Key Finding</h3>
                <p className="text-gray-700 text-sm leading-relaxed">{result.key_findings}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex overflow-x-auto border-b border-gray-100">
              {tabs.map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === t ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {t === 'xyz_rewrites' ? (
                    <span className="flex items-center gap-1.5"><FiEdit3 className="text-xs" /> XYZ Rewrites</span>
                  ) : t === 'overview' ? (
                    <span className="flex items-center gap-1.5"><FiTrendingUp className="text-xs" /> Overview</span>
                  ) : t === 'strengths' ? (
                    <span className="flex items-center gap-1.5"><FiCheckCircle className="text-xs" /> Strengths & Gaps</span>
                  ) : t === 'improvements' ? (
                    <span className="flex items-center gap-1.5"><FiTarget className="text-xs" /> Improvements</span>
                  ) : (
                    <span className="flex items-center gap-1.5"><FiMessageSquare className="text-xs" /> Interview Tips</span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800 text-sm">Score Breakdown</h3>
                      <ScoreBar label="ATS Compatibility" score={result.ats_score} color="#3b82f6" />
                      <ScoreBar label="Resume Quality" score={result.resume_score} color="#10b981" />
                      <ScoreBar label="Selection Probability" score={result.selection_probability} color="#f59e0b" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm mb-3">Present Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {(result.present_skills || []).map((s, i) => (
                          <span key={i} className="bg-green-50 text-green-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-green-100 flex items-center gap-1">
                            <FiCheck className="text-green-500" />{s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-3">Recruiter Feedback</h3>
                    <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 rounded-xl p-4">{result.recruiter_feedback}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-2">Salary Estimate</h3>
                    <div className="flex items-center gap-3">
                      <span className="bg-green-100 text-green-800 px-3 py-1.5 rounded-lg text-sm font-semibold">{result.salary_estimate}</span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-semibold">Level: {result.career_level}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'strengths' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><FiCheck className="text-green-500" /> Strengths</h3>
                    <ul className="space-y-3">
                      {(result.strengths || []).map((s, i) => (
                        <li key={i} className="flex items-start gap-2.5 bg-green-50 rounded-xl p-3 text-sm text-gray-700">
                          <FiCheck className="text-green-500 flex-shrink-0 mt-0.5" />{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><FiX className="text-red-500" /> Missing Skills</h3>
                    <ul className="space-y-3">
                      {(result.missing_skills || []).map((s, i) => (
                        <li key={i} className="flex items-start gap-2.5 bg-red-50 rounded-xl p-3 text-sm text-gray-700">
                          <FiX className="text-red-500 flex-shrink-0 mt-0.5" />{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'improvements' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 mb-1">Priority Action Items</h3>
                  {(result.action_items || []).map((item, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${item.priority === 'HIGH' ? 'bg-red-50 border-red-200' : item.priority === 'MEDIUM' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.priority === 'HIGH' ? 'bg-red-100 text-red-700' : item.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{item.action}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.impact}</p>
                    </div>
                  ))}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3 mt-4">ATS Keywords Missing</h3>
                    <div className="flex flex-wrap gap-2">
                      {(result.ats_keywords_missing || []).map((k, i) => (
                        <span key={i} className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-lg text-xs font-medium">{k}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Formatting Issues</h3>
                    {(result.formatting_issues || []).map((issue, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-600 py-2 border-b border-gray-100">
                        <FiAlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" />{issue}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'xyz_rewrites' && (
                <div className="space-y-5">
                  <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
                    <strong>Google XYZ Formula:</strong> "Accomplished [X] as measured by [Y], by doing [Z]" - transforms weak bullets into powerful achievement statements.
                  </p>
                  {(result.xyz_rewrites || []).map((rewrite, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                      <div className="bg-red-50/50 p-4">
                        <span className="text-xs font-bold text-red-600 uppercase">Before</span>
                        <div className="flex items-start gap-2 text-sm text-gray-700 mt-1">
                          <FiXCircle className="text-red-500 flex-shrink-0 mt-0.5" />
                          <span>{rewrite.original}</span>
                        </div>
                      </div>
                      <div className="bg-green-50/50 p-4">
                        <span className="text-xs font-bold text-green-600 uppercase">After (XYZ Formula)</span>
                        <div className="flex items-start gap-2 text-sm text-gray-800 mt-1 font-medium">
                          <FiCheckCircle className="text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{rewrite.improved}</span>
                        </div>
                      </div>
                      {rewrite.impact && (
                        <div className="bg-blue-50 p-3">
                          <p className="text-xs text-blue-700"><strong>Why:</strong> {rewrite.impact}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'interview' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Interview Tips</h3>
                  {(result.interview_tips || []).map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                      <p className="text-sm text-gray-700">{tip}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
