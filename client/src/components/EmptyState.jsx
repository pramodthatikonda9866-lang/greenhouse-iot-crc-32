import React from 'react';
import { Play, Sliders, ShieldCheck, Sparkles } from 'lucide-react';

export default function EmptyState({ onStartDefault }) {
  return (
    <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-slate-800 text-center max-w-2xl mx-auto my-6 relative overflow-hidden">
      <div className="absolute -top-16 -left-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-950/40">
        <ShieldCheck className="w-8 h-8 text-emerald-400" />
      </div>

      <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
        No simulation data yet
      </h3>

      <p className="text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
        Configure the virtual greenhouse parameters (101 sensors, packet count, corruption rate) and launch the simulation to begin real-time CRC-32 monitoring.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onStartDefault}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
        >
          <Play className="w-4 h-4 fill-black" />
          Launch Standard Test (5% Noise)
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap justify-center gap-6 text-xs text-slate-500 font-mono">
        <span>✓ 101 Virtual Sensors</span>
        <span>✓ Deterministic IEEE 802.3 CRC-32</span>
        <span>✓ Live WebSocket Streaming</span>
      </div>
    </div>
  );
}
