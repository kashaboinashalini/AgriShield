import React from 'react';

// ---------- Layout primitives ----------
export const Card: React.FC<any> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-green-100 p-4 ${className}`}>{children}</div>
);

export const Badge: React.FC<{ level?: string; children?: React.ReactNode }> = ({ level = 'MEDIUM', children }) => {
  const l = String(level || '').toUpperCase();
  const c = ['HIGH', 'SEVERE', 'CRITICAL', 'IRRIGATION_REQUIRED_NOW', 'POOR'].includes(l)
    ? 'bg-red-100 text-red-700'
    : ['LOW', 'NO_IRRIGATION_REQUIRED', 'GOOD', 'NONE'].includes(l)
    ? 'bg-green-100 text-green-700'
    : 'bg-amber-100 text-amber-700';
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${c}`}>{children ?? level}</span>;
};

export const Stat: React.FC<any> = ({ icon, label, value, sub, source, updated }) => (
  <Card className="flex items-start gap-3">
    <div className="text-green-700 mt-1">{icon}</div>
    <div className="min-w-0">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-xl md:text-2xl font-bold truncate">{value}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
      {source && <div className="text-[10px] mt-1 text-gray-400">Source: {source}{updated ? ` · Updated: ${updated}` : ''}</div>}
    </div>
  </Card>
);

export const Empty: React.FC<any> = ({ text }) => (
  <div className="text-center text-gray-400 py-10">
    <div className="text-3xl mb-2">🌱</div>
    <div className="text-sm">{text}</div>
  </div>
);

export const Spinner: React.FC = () => (
  <div className="py-10 flex flex-col items-center gap-2 text-green-700">
    <div className="w-8 h-8 border-4 border-green-100 border-t-green-700 rounded-full animate-spin" />
    <div className="text-sm text-gray-400">Loading…</div>
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />
);

export const PageHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({ title, subtitle, actions }) => (
  <div className="flex flex-wrap items-center gap-3 mb-4">
    <div className="mr-auto">
      <h1 className="text-2xl font-bold text-green-950">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {actions}
  </div>
);

export const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <label className="block">
    <span className="text-xs font-semibold text-gray-600">{label}</span>
    {children}
    {hint && <span className="text-[11px] text-gray-400">{hint}</span>}
  </label>
);

export const inputCls = 'w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent bg-white';
export const btnPrimary = 'bg-green-700 hover:bg-green-800 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors disabled:opacity-50';
export const btnGhost = 'border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors';

// ---------- Data source labels (spec §33) ----------
const LABELS: Record<string, { text: string; cls: string }> = {
  live: { text: 'LIVE DATA', cls: 'bg-green-600 text-white' },
  latest: { text: 'LATEST AVAILABLE DATA', cls: 'bg-blue-600 text-white' },
  database: { text: 'DATABASE DATA', cls: 'bg-violet-600 text-white' },
  calculated: { text: 'CALCULATED DATA', cls: 'bg-amber-500 text-white' },
  ai: { text: 'AI ANALYSIS', cls: 'bg-purple-600 text-white' },
  demo: { text: 'DEMO / SIMULATED DATA', cls: 'bg-gray-500 text-white' },
  unavailable: { text: 'DATA UNAVAILABLE', cls: 'bg-red-500 text-white' },
};

export const DataLabel: React.FC<{ type: string; source?: string }> = ({ type, source }) => {
  const l = LABELS[type] || LABELS.database;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded ${l.cls}`}>{l.text}</span>
      {source && <span className="text-[10px] text-gray-400">{source}</span>}
    </span>
  );
};

// ---------- Time helpers ----------
export const timeAgo = (d: string | Date): string => {
  const s = Math.max(1, Math.round((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
};

export const fmtDateTime = (d: string | Date): string =>
  new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
