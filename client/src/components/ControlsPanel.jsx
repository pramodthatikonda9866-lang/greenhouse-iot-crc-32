import React, { useState } from 'react';
import { Sliders, Play, Square, RotateCcw, Sparkles, RefreshCw, Hash, Gauge, AlertOctagon } from 'lucide-react';

export default function ControlsPanel({
  config,
  setConfig,
  status,
  onStart,
  onStop,
  onReset
}) {
  const isRunning = status === 'RUNNING';

  const handleSliderChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const applyPreset = (preset) => {
    switch (preset) {
      case 'CLEAN_0':
        setConfig(prev => ({ ...prev, sensorCount: 101, corruptionRate: 0.0, lossRate: 0.0, packetsPerSensor: 50 }));
        break;
      case 'STANDARD_5':
        setConfig(prev => ({ ...prev, sensorCount: 101, corruptionRate: 0.05, lossRate: 0.0, packetsPerSensor: 50 }));
        break;
      case 'HEAVY_25':
        setConfig(prev => ({ ...prev, sensorCount: 101, corruptionRate: 0.25, lossRate: 0.05, packetsPerSensor: 60 }));
        break;
      case 'EXTREME_100':
        setConfig(prev => ({ ...prev, sensorCount: 101, corruptionRate: 1.0, lossRate: 0.0, packetsPerSensor: 30 }));
        break;
      default:
        break;
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 relative">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-emerald-400" />
          <h2 className="font-bold text-white text-base tracking-tight">Simulation & Fault Injection Controls</h2>
        </div>
        
        {/* Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Presets:</span>
          <button
            onClick={() => applyPreset('CLEAN_0')}
            disabled={isRunning}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all disabled:opacity-50"
          >
            0% Clean
          </button>
          <button
            onClick={() => applyPreset('STANDARD_5')}
            disabled={isRunning}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 transition-all disabled:opacity-50"
          >
            5% Std
          </button>
          <button
            onClick={() => applyPreset('HEAVY_25')}
            disabled={isRunning}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all disabled:opacity-50"
          >
            25% Noise
          </button>
          <button
            onClick={() => applyPreset('EXTREME_100')}
            disabled={isRunning}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all disabled:opacity-50"
          >
            100% Fail
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Control 1: Virtual Sensors Count */}
        <div className="space-y-2 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">Virtual Sensors Count</span>
            <span className="font-mono font-bold text-emerald-400">{config.sensorCount} Sensors</span>
          </div>
          <input
            type="range"
            min="1"
            max="101"
            value={config.sensorCount}
            disabled={isRunning}
            onChange={(e) => handleSliderChange('sensorCount', parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>1 Node</span>
            <span>50 Nodes</span>
            <span>101 Nodes (Max)</span>
          </div>
        </div>

        {/* Control 2: Corruption Probability */}
        <div className="space-y-2 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">Corruption Probability</span>
            <span className={`font-mono font-bold ${
              config.corruptionRate > 0.5 ? 'text-rose-400' :
              config.corruptionRate > 0.1 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {(config.corruptionRate * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={config.corruptionRate}
            disabled={isRunning}
            onChange={(e) => handleSliderChange('corruptionRate', parseFloat(e.target.value))}
            className={`w-full h-2 bg-slate-800 rounded-lg cursor-pointer disabled:cursor-not-allowed ${
              config.corruptionRate > 0.5 ? 'accent-rose-500' :
              config.corruptionRate > 0.1 ? 'accent-amber-500' : 'accent-emerald-500'
            }`}
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0% (Clean)</span>
            <span>50% (Heavy)</span>
            <span>100% (All Error)</span>
          </div>
        </div>

        {/* Control 3: Packets Per Sensor / Mode */}
        <div className="space-y-2 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">Packets / Sensor</span>
            <span className="font-mono font-bold text-cyan-400">
              {config.continuous ? 'Continuous' : `${config.packetsPerSensor} pkts`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="5"
              max="500"
              disabled={isRunning || config.continuous}
              value={config.packetsPerSensor}
              onChange={(e) => handleSliderChange('packetsPerSensor', Math.max(1, parseInt(e.target.value, 10) || 10))}
              className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none disabled:opacity-40"
            />
            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.continuous}
                disabled={isRunning}
                onChange={(e) => handleSliderChange('continuous', e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
              />
              <span>Live Infinite Stream</span>
            </label>
          </div>
        </div>

        {/* Control 4: Packet Generation Rate */}
        <div className="space-y-2 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">Tick Interval</span>
            <span className="font-mono font-bold text-teal-300">{config.rateMs} ms</span>
          </div>
          <input
            type="range"
            min="50"
            max="1000"
            step="25"
            value={config.rateMs}
            disabled={isRunning}
            onChange={(e) => handleSliderChange('rateMs', parseInt(e.target.value, 10))}
            className="w-full accent-teal-400 h-2 bg-slate-800 rounded-lg cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>50ms (Ultra Fast)</span>
            <span>200ms (Default)</span>
            <span>1000ms (Slow)</span>
          </div>
        </div>

        {/* Control 5: Packet Drop / Loss Rate */}
        <div className="space-y-2 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">Simulated Packet Loss</span>
            <span className="font-mono font-bold text-amber-400">{(config.lossRate * 100).toFixed(0)}% Drop</span>
          </div>
          <input
            type="range"
            min="0"
            max="0.4"
            step="0.01"
            value={config.lossRate}
            disabled={isRunning}
            onChange={(e) => handleSliderChange('lossRate', parseFloat(e.target.value))}
            className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0% (No Loss)</span>
            <span>20%</span>
            <span>40% (High Loss)</span>
          </div>
        </div>

        {/* Control 6: PRNG Seed */}
        <div className="space-y-2 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">Deterministic PRNG Seed</span>
            <span className="text-[11px] text-slate-400 font-mono">{config.seed || 'Random'}</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 42, test-run"
              disabled={isRunning}
              value={config.seed || ''}
              onChange={(e) => handleSliderChange('seed', e.target.value || null)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none disabled:opacity-40"
            />
            <button
              type="button"
              disabled={isRunning}
              onClick={() => handleSliderChange('seed', Math.floor(Math.random() * 10000).toString())}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors disabled:opacity-40"
              title="Generate random seed"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Main Execution Action Bar */}
      <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Configured: <strong className="text-slate-200">{config.sensorCount}</strong> sensors × <strong className="text-slate-200">{config.continuous ? '∞' : config.packetsPerSensor}</strong> pkts @ <strong className="text-slate-200">{(config.corruptionRate * 100).toFixed(0)}%</strong> error rate</span>
        </div>

        <div className="flex items-center gap-2">
          {status !== 'RUNNING' ? (
            <button
              onClick={onStart}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-black" />
              Launch Simulation
            </button>
          ) : (
            <button
              onClick={onStop}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 font-bold text-sm shadow-lg shadow-amber-500/10 transition-all transform active:scale-95"
            >
              <Square className="w-4 h-4 fill-amber-300" />
              Halt Simulation
            </button>
          )}

          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium text-sm transition-all transform active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
