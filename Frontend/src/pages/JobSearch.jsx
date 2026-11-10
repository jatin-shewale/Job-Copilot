import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jobsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiSearch, FiMapPin, FiBriefcase, FiExternalLink, FiRefreshCw,
  FiFilter, FiClock, FiZap, FiTrendingUp, FiBookmark, FiSend, FiCalendar,
  FiX, FiInfo, FiLayers, FiStar
} from 'react-icons/fi';

const SOURCES = ['All', 'LinkedIn', 'Indeed', 'Wellfound', 'Internshala', 'Foundit', 'Greenhouse', 'Career Page'];
const FRESHNESS = [
  { key: 'All', label: 'All', icon: FiFilter },
  { key: 'Just Posted', label: 'Just Posted', icon: FiZap },
  { key: 'Last Hour', label: 'Last Hour', icon: FiClock },
  { key: 'Today', label: 'Today', icon: FiCalendar },
];

function FreshnessBadge({ label }) {
  const color = label?.includes('Just') ? 'bg-emerald-500'
    : label?.includes('min') ? 'bg-amber-500'
    : label?.includes('Today') ? 'bg-blue-500'
    : 'bg-gray-400';
  const Icon = label?.includes('Just') ? FiZap : label?.includes('min') ? FiClock : FiCalendar;

  return (
    <span className={`${color} text-white text-xs px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1`}>
      <Icon className="text-[10px]" />
      {label}
    </span>
  );
}

function getHighlights(description = '') {
  return description
    .replace(/\r/g, '\n')
    .split(/\n+/)
    .map(line => line.replace(/^[•\-\u2022]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 4);
}

function formatPostedAt(value) {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.max(1, Math.round(diffMs / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function JobCard({ job, onColdEmail, onCoverLetter, onSelect }) {
  const [saved, setSaved] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -2 }}
      onClick={() => onSelect(job)}
      className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
            {(job.company || 'J')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{job.title}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <span className="text-gray-600 text-xs font-medium">{job.company || 'Company'}</span>
              {job.location && (
                <span className="text-gray-400 text-xs flex items-center gap-1">
                  <FiMapPin className="text-xs" />
                  {job.location}
                </span>
              )}
              {job.salary && <span className="text-green-600 text-xs font-medium">{job.salary}</span>}
            </div>
            {job.description && (
              <p className="text-xs text-gray-500 mt-2 leading-relaxed max-h-10 overflow-hidden">
                {job.description}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSaved(!saved);
          }}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
            saved ? 'text-blue-600 bg-blue-50' : 'text-gray-300 hover:text-gray-500'
          }`}
        >
          <FiBookmark className={saved ? 'fill-blue-600' : ''} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <FreshnessBadge label={job.freshness} />
        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{job.source}</span>
        {job.job_type && <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">{job.job_type}</span>}
      </div>

      {job.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {job.skills.slice(0, 5).map((s, i) => (
            <span key={i} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-md">{s}</span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
        {job.apply_link && (
          <a
            onClick={(e) => e.stopPropagation()}
            href={job.apply_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <FiExternalLink className="text-xs" /> Apply Now
          </a>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCoverLetter(job);
          }}
          className="flex items-center gap-1.5 bg-purple-50 text-purple-700 text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-purple-100 transition-colors"
        >
          <FiZap className="text-xs" /> Cover Letter
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onColdEmail(job);
          }}
          className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-green-100 transition-colors"
        >
          <FiSend className="text-xs" /> Cold Email
        </button>
      </div>
    </motion.div>
  );
}

export default function JobSearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState(user?.target_role || '');
  const [location, setLocation] = useState(user?.location || '');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sourceFilter, setSourceFilter] = useState('All');
  const [freshnessFilter, setFreshnessFilter] = useState('All');
  const [searched, setSearched] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [selectedJob, setSelectedJob] = useState(null);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) {
      toast.error('Enter a role or keyword to search');
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await jobsAPI.search({ query: query.trim(), location: location.trim(), limit: 5000 });
      setJobs(res.data.jobs || []);
      setLiveCount(res.data.scraped_live || 0);
      setSelectedJob(null);
      toast.success(`Found ${res.data.jobs?.length || 0} jobs from ${res.data.scraped_live || 0} live sources!`);
    } catch (err) {
      toast.error('Search failed. Check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(j => {
    if (sourceFilter !== 'All' && j.source !== sourceFilter) return false;
    if (freshnessFilter !== 'All') {
      if (freshnessFilter === 'Just Posted' && !j.freshness?.includes('Just')) return false;
      if (freshnessFilter === 'Last Hour' && !j.freshness?.includes('min')) return false;
      if (freshnessFilter === 'Today' && !j.freshness?.includes('Today')) return false;
    }
    return true;
  });

  const justPosted = jobs.filter(j => j.freshness?.includes('Just') || j.freshness?.includes('min')).length;
  const sourceCounts = jobs.reduce((acc, job) => {
    const source = job.source || 'Unknown';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});

  const handleColdEmail = (job) => {
    const params = new URLSearchParams({ company: job.company, role: job.title, link: job.apply_link || '' });
    window.location.href = `/cold-email?${params}`;
  };

  const handleCoverLetter = (job) => {
    const params = new URLSearchParams({ company: job.company, role: job.title, desc: job.description || job.title || '' });
    window.location.href = `/cover-letter?${params}`;
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Live Job Intelligence</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Find Jobs Posted Minutes Ago</h1>
        <p className="text-gray-500 text-sm mt-1">Search by role or keyword. Location is optional, and we scrape LinkedIn, Indeed, Wellfound, Internshala, Foundit, Greenhouse, and company career pages in real-time, with results expanded up to 5000 matches.</p>
      </div>

      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Role, skill, or keyword (e.g. React Developer)"
              className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="sm:w-48 relative">
            <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Location is optional"
              className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2 justify-center sm:w-auto disabled:opacity-60"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSearch />}
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {searched && jobs.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Jobs Found', value: jobs.length, icon: FiBriefcase, color: 'text-blue-600' },
            { label: 'Just Posted / Last Hour', value: justPosted, icon: FiZap, color: 'text-green-600' },
            { label: 'Sources Scraped', value: [...new Set(jobs.map(j => j.source))].length, icon: FiTrendingUp, color: 'text-purple-600' },
            { label: 'After Filter', value: filteredJobs.length, icon: FiFilter, color: 'text-orange-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
              <Icon className={`${color} text-lg`} />
              <div>
                <div className={`text-lg font-bold ${color}`}>{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {jobs.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs text-gray-500 self-center font-medium">Source:</span>
            {SOURCES.map(s => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${sourceFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'}`}
            >
              {s}
            </button>
          ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            <span className="text-xs text-gray-500 self-center font-medium">Freshness:</span>
            {FRESHNESS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFreshnessFilter(key)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5 ${freshnessFilter === key ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300'}`}
              >
                <Icon className="text-[10px]" />
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors bg-white"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      )}

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                <div className="h-5 bg-gray-100 rounded-full w-20" />
                <div className="h-5 bg-gray-100 rounded-full w-16" />
              </div>
              <div className="h-8 bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {!loading && filteredJobs.length > 0 && (
        <AnimatePresence>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job, i) => (
              <JobCard
                key={job._id || job.source_id || i}
                job={job}
                onColdEmail={handleColdEmail}
                onCoverLetter={handleCoverLetter}
                onSelect={setSelectedJob}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {!loading && searched && filteredJobs.length === 0 && (
        <div className="text-center py-20">
          <FiSearch className="text-5xl text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500">No jobs found</h3>
          <p className="text-gray-400 text-sm mt-2">Try a different keyword or remove filters</p>
        </div>
      )}

      {!searched && (
        <div className="text-center py-20">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
            <FiSearch className="text-6xl text-blue-100 mx-auto mb-4" />
          </motion.div>
          <h3 className="text-xl font-bold text-gray-700">Enter a role to start live job discovery</h3>
          <p className="text-gray-400 mt-2 max-w-md mx-auto text-sm">
            We scrape LinkedIn, Indeed, Wellfound, Internshala, and more simultaneously to find the freshest opportunities.
          </p>
          {user?.target_role && (
            <button onClick={() => handleSearch()} className="mt-6 btn-primary">
              Search for "{user.target_role}"
            </button>
          )}
        </div>
      )}

      <AnimatePresence>
        {selectedJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm p-4 md:p-6 flex items-end md:items-center justify-center"
            onClick={() => setSelectedJob(null)}
          >
            <motion.div
              initial={{ y: 24, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 24, scale: 0.98, opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 240 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[88vh] overflow-hidden bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4 bg-gradient-to-r from-blue-50 via-white to-indigo-50">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                      <FiLayers className="text-[10px]" />
                      {selectedJob.source || 'Unknown'}
                    </span>
                    {selectedJob.freshness && <FreshnessBadge label={selectedJob.freshness} />}
                    {selectedJob.job_type && (
                      <span className="text-[11px] font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
                        {selectedJob.job_type}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">{selectedJob.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedJob.company || 'Company'}{selectedJob.location ? ` • ${selectedJob.location}` : ''}{selectedJob.salary ? ` • ${selectedJob.salary}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="shrink-0 w-9 h-9 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center justify-center"
                >
                  <FiX />
                </button>
              </div>

              <div className="grid md:grid-cols-[1.25fr_0.75fr] gap-0 flex-1 min-h-0">
                <div className="p-6 overflow-y-auto">
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-4">
                    <FiInfo />
                    Click-through details like a proper job board
                  </div>

                  {selectedJob.description && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-900 mb-3">Role Summary</h3>
                      <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap leading-7 bg-gray-50 border border-gray-100 rounded-2xl p-4">
                        {selectedJob.description}
                      </div>
                    </div>
                  )}

                  {getHighlights(selectedJob.description || '').length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-900 mb-3">Quick Highlights</h3>
                      <ul className="space-y-2">
                        {getHighlights(selectedJob.description || '').map((item, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                            <FiStar className="text-amber-500 mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3 mb-6">
                    <div className="bg-white border border-gray-100 rounded-2xl p-4">
                      <div className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Posted</div>
                      <div className="mt-1 text-sm font-semibold text-gray-900">{formatPostedAt(selectedJob.posted_at)}</div>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-4">
                      <div className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Source</div>
                      <div className="mt-1 text-sm font-semibold text-gray-900">{selectedJob.source || 'Unknown'}</div>
                    </div>
                  </div>

                  {selectedJob.skills?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-3">Skills Mentioned</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedJob.skills.map((skill, index) => (
                          <span key={index} className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1.5 rounded-full font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-slate-50 border-t md:border-t-0 md:border-l border-gray-100 overflow-y-auto">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Actions</h3>
                  <div className="space-y-3">
                    {selectedJob.apply_link && (
                      <a
                        onClick={(e) => e.stopPropagation()}
                        href={selectedJob.apply_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white text-sm px-4 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                      >
                        <FiExternalLink className="text-sm" />
                        Apply Now
                      </a>
                    )}
                    <button
                      onClick={() => handleCoverLetter(selectedJob)}
                      className="w-full inline-flex items-center justify-center gap-2 bg-purple-50 text-purple-700 text-sm px-4 py-3 rounded-xl font-semibold hover:bg-purple-100 transition-colors"
                    >
                      <FiZap className="text-sm" />
                      Generate Cover Letter
                    </button>
                    <button
                      onClick={() => handleColdEmail(selectedJob)}
                      className="w-full inline-flex items-center justify-center gap-2 bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl font-semibold hover:bg-green-100 transition-colors"
                    >
                      <FiSend className="text-sm" />
                      Draft Cold Email
                    </button>
                  </div>

                  <div className="mt-6 bg-white border border-gray-100 rounded-2xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Search Snapshot</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-gray-500">Role</span>
                        <span className="text-gray-900 font-medium text-right">{query}</span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-gray-500">Location</span>
                        <span className="text-gray-900 font-medium text-right">{location || 'Any location'}</span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-gray-500">Current Source Count</span>
                        <span className="text-gray-900 font-medium text-right">{sourceCounts[selectedJob.source || 'Unknown'] || 1}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
