import React from 'react';
import { Activity, ShieldCheck, Cpu, Radio, ListFilter, Play, Square, RotateCcw, BarChart3, Binary, History, Zap, FileCheck2 } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  simulationState,
  onStart,
  onStop,
  onReset,
  onApplyPreset
}) {
  const { status, stats, config } = simulationState;

  const getStatusBadge = () => {
    switch (status) {
      case 'RUNNING':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            RUNNING
          </div>
        );
      case 'STOPPED':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            STOPPED
          </div>
        );
      case 'COMPLETED':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            COMPLETED
          </div>
        );
      case 'IDLE':
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            IDLE
          </div>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#080C14]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">Smart Greenhouse IoT</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-medium border border-emerald-500/30">CRC-32</span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Packet Reliability & Data Integrity Monitor</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500 text-black font-semibold shadow-md shadow-emerald-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab('sensors')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'sensors'
                  ? 'bg-emerald-500 text-black font-semibold shadow-md shadow-emerald-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              101 Sensors Grid
            </button>

            <button
              onClick={() => setActiveTab('packets')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'packets'
                  ? 'bg-emerald-500 text-black font-semibold shadow-md shadow-emerald-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              Packet Monitor
            </button>

            <button
              onClick={() => setActiveTab('sandbox')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'sandbox'
                  ? 'bg-emerald-500 text-black font-semibold shadow-md shadow-emerald-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Binary className="w-3.5 h-3.5" />
              CRC Sandbox
            </button>

            <button
              onClick={() => setActiveTab('file-checker')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'file-checker'
                  ? 'bg-emerald-500 text-black font-semibold shadow-md shadow-emerald-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              File Integrity
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-emerald-500 text-black font-semibold shadow-md shadow-emerald-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Run History
            </button>
          </nav>

          {/* Quick Simulation Controls & Status */}
          <div className="flex items-center gap-3">
            {getStatusBadge()}

            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              {status !== 'RUNNING' ? (
                <button
                  onClick={onStart}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-semibold text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  Start
                </button>
              ) : (
                <button
                  onClick={onStop}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs transition-all active:scale-95"
                >
                  <Square className="w-3.5 h-3.5 fill-amber-300" />
                  Stop
                </button>
              )}

              <button
                onClick={onReset}
                title="Reset simulation and clear counters"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 overflow-x-auto gap-2">
          {['dashboard', 'sensors', 'packets', 'sandbox', 'file-checker', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-emerald-500 text-black font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'sensors' ? '101 Sensors' : tab === 'file-checker' ? 'File Integrity' : tab}
            </button>
          ))}
        </div>

      </div>
    </header>
  );
}
