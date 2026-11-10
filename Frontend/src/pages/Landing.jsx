import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiZap, FiTarget, FiTrendingUp, FiMail, FiSearch, FiCheck, FiStar, FiArrowRight, FiClock, FiUsers, FiBriefcase, FiAward, FiCalendar, FiHeart } from 'react-icons/fi';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const features = [
  { icon: FiZap, title: 'Real-Time Job Discovery', desc: 'Find jobs posted minutes ago before other applicants even know they exist.', color: 'bg-yellow-100 text-yellow-600' },
  { icon: FiTarget, title: 'ATS Score Optimizer', desc: 'Beat applicant tracking systems with AI-powered keyword optimization.', color: 'bg-blue-100 text-blue-600' },
  { icon: FiTrendingUp, title: 'Skill Gap Analysis', desc: 'Know exactly what skills to learn next with personalized roadmaps.', color: 'bg-green-100 text-green-600' },
  { icon: FiMail, title: 'Cold Email Generator', desc: 'Reach HR directly with personalized emails that get 35%+ open rates.', color: 'bg-purple-100 text-purple-600' },
  { icon: FiSearch, title: 'AI Recruiter Agent', desc: 'Get honest recruiter feedback and selection probability for every job.', color: 'bg-red-100 text-red-600' },
  { icon: FiAward, title: 'Google XYZ Resume', desc: 'Rewrite your resume with Google\'s proven achievement formula.', color: 'bg-indigo-100 text-indigo-600' },
];

const steps = [
  { num: '01', title: 'Tell us your role', desc: 'Enter your desired job title, skills, and location.' },
  { num: '02', title: 'Upload your resume', desc: 'Drop your PDF/DOCX for AI analysis in seconds.' },
  { num: '03', title: 'Get live job matches', desc: 'See jobs posted minutes ago, sorted by best match.' },
  { num: '04', title: 'Apply with AI advantage', desc: 'Generate cover letters, cold emails, and ATS-optimized resumes.' },
];

const stats = [
  { value: '2x', label: 'Faster job discovery' },
  { value: '82%', label: 'Avg ATS score improvement' },
  { value: '10+', label: 'Job sources scraped' },
  { value: '500+', label: 'AI career insights' },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'Got hired at Razorpay', text: 'Found the job posting 3 hours before it went viral on LinkedIn. The AI cover letter was perfect.', stars: 5 },
  { name: 'Rahul Mehta', role: 'SDE at Flipkart', text: 'My ATS score went from 42 to 87. The skill gap roadmap was exactly what I needed.', stars: 5 },
  { name: 'Ananya Singh', role: 'Data Scientist at Swiggy', text: 'The cold email templates got me direct responses from 3 HRs within 48 hours.', stars: 5 },
];

const pricing = [
  { plan: 'Free', price: '₹0', period: '/mo', features: ['10 job searches/day', '1 resume analysis', 'Basic ATS check', '3 cover letters/mo'], cta: 'Get Started', highlight: false },
  { plan: 'Pro', price: '₹999', period: '/mo', features: ['Unlimited job searches', 'Live job alerts', 'Full AI analysis', 'Unlimited cover letters', 'Cold email generator', 'Skill gap roadmap', 'Career coach access'], cta: 'Start Pro', highlight: true },
  { plan: 'Team', price: '₹2499', period: '/mo', features: ['Everything in Pro', '5 team members', 'Priority scraping', 'Dedicated AI model', 'Analytics dashboard'], cta: 'Contact Sales', highlight: false },
];

const faqs = [
  { q: 'How do you find jobs before others?', a: 'We continuously scrape LinkedIn, Indeed, Wellfound, Internshala, Foundit, and company career pages in real-time. Jobs posted minutes ago appear on your feed instantly.' },
  { q: 'What is ATS and why does it matter?', a: 'Applicant Tracking Systems automatically reject 75% of resumes before a human ever sees them. Our ATS optimizer ensures your resume passes these filters.' },
  { q: 'How does the Google XYZ formula work?', a: '"Accomplished [X] as measured by [Y], by doing [Z]." Our AI rewrites your bullets to quantify impact and impress recruiters.' },
  { q: 'Can I use cold emails to reach HR directly?', a: 'Yes! We scrape company websites for HR contact information and generate personalized cold emails with proven 35%+ open rate templates.' },
];

export default function Landing() {
  const [faqOpen, setFaqOpen] = useState(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <FiZap className="text-white text-sm" />
            </div>
            <span className="font-bold text-gray-900 text-lg">JobCopilot <span className="text-blue-600">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium hidden sm:block">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white pt-20 pb-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full opacity-50 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-100 rounded-full opacity-50 blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto px-4 text-center relative">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <FiZap className="text-yellow-500" />
              Find jobs posted just minutes ago
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight"
          >
            Apply Earlier.<br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Get Interviews Faster.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}
            className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto"
          >
            AI-powered job intelligence that finds opportunities before everyone else. Beat ATS systems. Get more interviews.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/register" className="btn-primary text-lg py-4 px-8 flex items-center gap-2 justify-center">
              Get Started Free <FiArrowRight />
            </Link>
            <Link to="/register" className="btn-secondary text-lg py-4 px-8 flex items-center gap-2 justify-center">
              Upload Resume
            </Link>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
          >
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-extrabold text-blue-600">{s.value}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Live Job Preview */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">Jobs Posted Right Now</h2>
            <p className="text-gray-400">Real-time feed from 10+ sources</p>
          </div>
          <div className="grid gap-3">
            {[
              { title: 'Senior Software Engineer - React', company: 'Razorpay', time: '2 min ago', type: 'now', match: 94, source: 'LinkedIn' },
              { title: 'Data Scientist - ML Platform', company: 'Swiggy', time: '8 min ago', type: 'hot', match: 87, source: 'Indeed' },
              { title: 'Full Stack Developer', company: 'Groww', time: '23 min ago', type: 'today', match: 91, source: 'Wellfound' },
              { title: 'Backend Engineer - Python', company: 'CRED', time: 'Today', type: 'recent', match: 78, source: 'Foundit' },
            ].map((job, i) => (
              <motion.div
                key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/10 backdrop-blur rounded-xl p-4 flex items-center justify-between border border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {job.company[0]}
                  </div>
                  <div>
                    <div className="text-white font-medium">{job.title}</div>
                    <div className="text-gray-400 text-sm">{job.company} | {job.source}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-green-400 text-sm font-medium flex items-center gap-1">
                    {job.type === 'now' && <FiZap className="text-yellow-400 text-xs animate-pulse" />}
                    {job.type === 'hot' && <FiZap className="text-orange-500 text-xs animate-bounce" />}
                    {job.type === 'today' && <FiClock className="text-blue-400 text-xs" />}
                    {job.type === 'recent' && <FiCalendar className="text-gray-400 text-xs" />}
                    {job.time}
                  </span>
                  <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-lg font-bold">{job.match}% match</div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/register" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
              See All Live Jobs <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="text-4xl font-bold text-gray-900 mb-4">Everything You Need to Win</motion.h2>
            <motion.p variants={fadeUp} className="text-gray-600 text-lg">10+ AI agents working 24/7 to maximize your interview chances</motion.p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <motion.div key={f.title} variants={fadeUp} whileHover={{ y: -4 }} className="p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-all">
                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                  <f.icon className="text-xl" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600">From signup to interview in 4 steps</p>
          </div>
          <div className="space-y-8">
            {steps.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                className="flex gap-6 items-start"
              >
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                  {step.num}
                </div>
                <div className="flex-1 pt-3">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">What Candidates Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex mb-3">
                  {[...Array(t.stars)].map((_, j) => <FiStar key={j} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-gray-700 mb-4 text-sm leading-relaxed">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{t.name}</div>
                  <div className="text-sm text-blue-600">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Simple Pricing</h2>
          <p className="text-center text-gray-600 mb-16">Start free. Upgrade when you're ready.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((p) => (
              <motion.div key={p.plan} whileHover={{ y: -4 }}
                className={`p-8 rounded-2xl border-2 ${p.highlight ? 'border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-200' : 'border-gray-200 bg-white'}`}
              >
                <div className={`text-sm font-bold mb-2 ${p.highlight ? 'text-blue-100' : 'text-gray-500'}`}>{p.plan}</div>
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-4xl font-black">{p.price}</span>
                  <span className={`text-sm mb-1 ${p.highlight ? 'text-blue-200' : 'text-gray-500'}`}>{p.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <FiCheck className={p.highlight ? 'text-blue-200' : 'text-green-500'} />
                      <span className={p.highlight ? 'text-blue-100' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <button className={`w-full py-3 rounded-xl font-semibold transition-all ${p.highlight ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                    {p.cta}
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">FAQ</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full text-left px-6 py-4 font-semibold text-gray-900 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  {faq.q}
                  <span className={`transition-transform ${faqOpen === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {faqOpen === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="px-6 pb-4 text-gray-600 text-sm leading-relaxed">
                    {faq.a}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Start Finding Jobs Before Everyone Else</h2>
          <p className="text-blue-100 mb-10 text-lg">Join thousands of candidates who get interviews 2x faster with JobCopilot AI.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg">
            Get Started Free <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                <FiZap className="text-white text-xs" />
              </div>
              <span className="text-white font-bold">JobCopilot AI</span>
            </div>
            <p className="text-sm flex items-center gap-1">
              <span>&copy; 2024 JobCopilot AI. All rights reserved.</span> Built with <FiHeart className="text-red-500 fill-red-500 animate-pulse mx-1" /> for job seekers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
