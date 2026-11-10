import React from 'react';
import { motion } from 'framer-motion';

export function ScoreCircle({ score = 0, label, color = '#3b82f6', size = 'md' }) {
  const dim = size === 'sm' ? 64 : size === 'lg' ? 120 : 88;
  const r = dim * 0.42;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative rounded-full bg-white p-1 shadow-[0_12px_30px_rgba(15,23,42,0.08)]" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} className="-rotate-90">
          <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={dim * 0.085} />
          <motion.circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={dim * 0.085}
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${dash} ${circ}` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="block font-black text-slate-900" style={{ fontSize: dim * 0.22 }}>{score}</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Score</span>
          </div>
        </div>
      </div>
      {label && <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 text-center">{label}</span>}
    </div>
  );
}

export function ScoreBar({ label, score, color = '#3b82f6' }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-bold" style={{ color }}>{score}/100</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          className="h-full rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

export function FreshnessBadge({ label }) {
  const bg =
    label?.includes('Just') ? 'bg-emerald-500' :
    label?.includes('min') ? 'bg-amber-500' :
    label?.includes('Today') ? 'bg-blue-500' : 'bg-gray-400';
  return (
    <span className={`${bg} text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm`}>
      {label || 'Recent'}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const styles = {
    CRITICAL: 'bg-red-100 text-red-700 border-red-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    LOW: 'bg-green-100 text-green-700 border-green-200',
  };
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${styles[priority] || styles.LOW}`}>
      {priority}
    </span>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm animate-pulse">
      <div className="flex gap-3 mb-4">
        <div className="w-10 h-10 bg-slate-100 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-100 rounded-xl w-3/4" />
          <div className="h-3 bg-slate-100 rounded-xl w-1/2" />
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-5 bg-slate-100 rounded-full w-20" />
        <div className="h-5 bg-slate-100 rounded-full w-16" />
      </div>
      <div className="h-8 bg-slate-100 rounded-2xl" />
    </div>
  );
}

export function PageSkeleton({ count = 6 }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(count)].map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}

export function SectionHeader({ title, subtitle, badge }) {
  return (
    <div className="mb-6">
      {badge && (
        <div className="flex items-center gap-2 mb-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">{badge}</span>
        </div>
      )}
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="py-20 text-center">
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
        {Icon && <Icon className="mx-auto mb-4 text-5xl text-slate-200" />}
      </motion.div>
      <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
      {desc && <p className="mx-auto mt-2 max-w-sm text-sm text-slate-400">{desc}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}

export function AIThinking({ message = 'AI is analyzing...' }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-blue-500"
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
          />
        ))}
      </div>
      <span className="text-sm font-medium text-blue-700">{message}</span>
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, color = 'text-blue-600', bg = 'bg-blue-50' }) {
  return (
    <div className={`${bg} flex items-center gap-3 rounded-2xl p-4 shadow-sm`}>
      {Icon && <Icon className={`${color} flex-shrink-0 text-xl`} />}
      <div>
        <div className={`text-xl font-black ${color}`}>{value}</div>
        <div className="mt-0.5 text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export function TabBar({ tabs, active, onChange }) {
  return (
    <div className="mb-5 flex gap-2 overflow-x-auto border-b border-slate-200 pb-1.5">
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`whitespace-nowrap rounded-t-2xl px-4 py-2.5 text-sm font-medium transition-all ${
            active === key
              ? 'border-b-2 border-blue-600 bg-blue-50/70 text-blue-700 shadow-sm -mb-px'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
