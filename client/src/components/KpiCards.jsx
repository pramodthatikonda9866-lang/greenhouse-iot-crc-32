import React from 'react';
import { Cpu, Layers, CheckCircle2, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

export default function KpiCards({ stats, config, status }) {
  const generated = stats?.generated || 0;
  const received = stats?.received || 0;
  const valid = stats?.valid || 0;
  const corrupted = stats?.corrupted || 0;
  const lost = stats?.lost || 0;

  // Exact calculations adhering to Section 9 & Section 13
  const reliability = received > 0 ? ((valid / received) * 100).toFixed(1) : '0.0';
  const errorRate = received > 0 ? ((corrupted / received) * 100).toFixed(1) : '0.0';
  const validPct = received > 0 ? ((valid / received) * 100).toFixed(1) : '0.0';
  const corruptedPct = received > 0 ? ((corrupted / received) * 100).toFixed(1) : '0.0';
  const sensorCount = config?.sensorCount || 101;

  const getReliabilityColor = (rel) => {
    const val = parseFloat(rel);
    if (received === 0) return 'text-slate-400 border-slate-700 bg-slate-800/40';
    if (val >= 98) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 text-glow-emerald';
    if (val >= 90) return 'text-teal-300 border-teal-500/30 bg-teal-500/10';
    if (val >= 75) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10 text-glow-rose';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
      
      {/* 1. Total Sensors */}
      <div className="glass-panel rounded-2xl p-4 transition-all hover:border-slate-700 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all"></div>
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Virtual Sensors</span>
          <div className="p-1.5 rounded-lg bg-slate-800/80 text-emerald-400 border border-slate-700">
            <Cpu className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{sensorCount}</span>
          <span className="text-xs text-slate-400 font-medium">Nodes (S001-S101)</span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Greenhouse Grid Online</span>
        </div>
      </div>

      {/* 2. Total Packets */}
      <div className="glass-panel rounded-2xl p-4 transition-all hover:border-slate-700 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all"></div>
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Packets</span>
          <div className="p-1.5 rounded-lg bg-slate-800/80 text-cyan-400 border border-slate-700">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{received.toLocaleString()}</span>
          <span className="text-xs text-slate-400">/ {generated.toLocaleString()} gen</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
          <span>Received Rate:</span>
          <span className="font-mono text-cyan-300 font-semibold">
            {generated > 0 ? `${((received / generated) * 100).toFixed(0)}%` : '0%'}
          </span>
        </div>
      </div>

      {/* 3. Valid Packets */}
      <div className="glass-panel rounded-2xl p-4 transition-all hover:border-emerald-500/40 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Valid (CRC Match)</span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-emerald-400 tracking-tight">{valid.toLocaleString()}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-medium">
            {validPct}%
          </span>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-400">
          <span>Checksums Verified</span>
        </div>
      </div>

      {/* 4. Corrupted Packets */}
      <div className="glass-panel rounded-2xl p-4 transition-all hover:border-rose-500/40 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all"></div>
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">Corrupted (CRC Fail)</span>
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-extrabold text-rose-400 tracking-tight">{corrupted.toLocaleString()}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-medium">
            {errorRate}%
          </span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
          <span>Fault Injections Caught</span>
        </div>
      </div>

      {/* 5. Overall Packet Reliability */}
      <div className="col-span-2 md:col-span-3 lg:col-span-1 glass-panel rounded-2xl p-4 border border-emerald-500/30 relative overflow-hidden group shadow-lg shadow-emerald-950/20">
        <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/15 rounded-full blur-2xl group-hover:bg-emerald-500/25 transition-all"></div>
        <div className="flex items-center justify-between text-slate-300 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Reliability Score</span>
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl lg:text-4xl font-black font-mono tracking-tight ${getReliabilityColor(reliability)}`}>
              {received > 0 ? `${reliability}%` : '—'}
            </span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
            received === 0 ? 'bg-slate-800 text-slate-400' :
            parseFloat(reliability) >= 95 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
            parseFloat(reliability) >= 80 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
            'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}>
            {received === 0 ? 'NO DATA' : parseFloat(reliability) >= 95 ? 'OPTIMAL' : parseFloat(reliability) >= 80 ? 'DEGRADED' : 'CRITICAL'}
          </span>
        </div>

        {/* Mini progress bar */}
        <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              parseFloat(reliability) >= 95 ? 'bg-gradient-to-r from-teal-400 to-emerald-500' :
              parseFloat(reliability) >= 80 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
              'bg-gradient-to-r from-rose-500 to-red-600'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, parseFloat(reliability)))}%` }}
          ></div>
        </div>
      </div>

    </div>
  );
}
