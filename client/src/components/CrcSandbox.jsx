import React, { useState, useEffect, useMemo } from 'react';
import { Binary, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Zap, ShieldAlert, Copy, Check } from 'lucide-react';
import { packetApi } from '../services/api';

// Frontend fallback CRC-32 calculator for instant client-side responsiveness
const createCrc32Table = () => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
};

const CRC_TABLE = createCrc32Table();

function calculateLocalCrc32(str) {
  if (!str) return '00000000';
  let crc = 0xFFFFFFFF;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xFF];
  }
  return ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

export default function CrcSandbox() {
  const [sensorId, setSensorId] = useState('S025');
  const [sequenceNo, setSequenceNo] = useState(105);
  const [temperature, setTemperature] = useState(28.5);
  const [humidity, setHumidity] = useState(72);
  const [timestamp, setTimestamp] = useState('2026-09-04T14:30:25Z');

  // Corrupted / Received state
  const [receivedPayload, setReceivedPayload] = useState('S025|105|28.5|72|2026-09-04T14:30:25Z');
  const [activeFault, setActiveFault] = useState('NONE');
  const [copied, setCopied] = useState(false);

  // Original deterministic payload
  const originalPayload = useMemo(() => {
    const formattedTemp = Number.isInteger(Number(temperature)) ? `${temperature}.0` : `${temperature}`;
    return `${sensorId}|${sequenceNo}|${formattedTemp}|${humidity}|${timestamp}`;
  }, [sensorId, sequenceNo, temperature, humidity, timestamp]);

  // Sender CRC-32
  const originalCrc32 = useMemo(() => {
    return calculateLocalCrc32(originalPayload);
  }, [originalPayload]);

  // Recalculated CRC-32 on received payload
  const recalculatedCrc32 = useMemo(() => {
    return calculateLocalCrc32(receivedPayload);
  }, [receivedPayload]);

  const isValid = originalCrc32 === recalculatedCrc32 && receivedPayload === originalPayload;

  const handleResetToClean = () => {
    setReceivedPayload(originalPayload);
    setActiveFault('NONE');
  };

  const handleApplyFault = (type) => {
    setActiveFault(type);
    const parts = originalPayload.split('|');

    switch (type) {
      case 'TEMP_CHANGE': {
        const newTemp = (parseFloat(parts[2]) + 10.0).toFixed(1);
        parts[2] = newTemp;
        setReceivedPayload(parts.join('|'));
        break;
      }
      case 'HUM_CHANGE': {
        const newHum = parseInt(parts[3], 10) + 1;
        parts[3] = String(newHum);
        setReceivedPayload(parts.join('|'));
        break;
      }
      case 'SEQ_MUTATION': {
        const newSeq = parseInt(parts[1], 10) + 1;
        parts[1] = String(newSeq);
        setReceivedPayload(parts.join('|'));
        break;
      }
      case 'BIT_FLIP': {
        const str = originalPayload;
        const targetIdx = 8; // flip character at middle
        const charCode = str.charCodeAt(targetIdx);
        const mutated = str.slice(0, targetIdx) + String.fromCharCode(charCode ^ 1) + str.slice(targetIdx + 1);
        setReceivedPayload(mutated);
        break;
      }
      case 'MULTI_FIELD': {
        parts[2] = (parseFloat(parts[2]) + 12.5).toFixed(1);
        parts[3] = String(parseInt(parts[3], 10) + 5);
        setReceivedPayload(parts.join('|'));
        break;
      }
      default:
        break;
    }
  };

  const copyText = (t) => {
    navigator.clipboard.writeText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Binary className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Interactive CRC-32 & Fault Injection Sandbox</h2>
            <p className="text-xs text-slate-400">
              Test deterministic serialization and verify how IEEE 802.3 CRC-32 detects accidental data corruption
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Sender Payload Crafting */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              1. Transmitter / Sender Payload Builder
            </span>
            <button
              onClick={() => {
                setTemperature(Math.round((20 + Math.random() * 20) * 10) / 10);
                setHumidity(Math.round(40 + Math.random() * 50));
                setSequenceNo(prev => prev + 1);
                setTimestamp(new Date().toISOString());
              }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Randomize
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Sensor ID</label>
              <input
                type="text"
                value={sensorId}
                onChange={(e) => setSensorId(e.target.value.toUpperCase())}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Sequence #</label>
              <input
                type="number"
                value={sequenceNo}
                onChange={(e) => setSequenceNo(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Humidity (%)</label>
              <input
                type="number"
                value={humidity}
                onChange={(e) => setHumidity(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">ISO-8601 Timestamp</label>
            <input
              type="text"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Transmitter Output */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">
              Sender Payload (Deterministic)
            </span>
            <div className="font-mono text-xs text-emerald-400 select-all break-all">
              {originalPayload}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">Transmitted CRC-32:</span>
              <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-black text-sm border border-emerald-500/40">
                {originalCrc32}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Receiver Verification & Fault Injector */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              2. Channel Fault Injection & Receiver Check
            </span>
            <button
              onClick={handleResetToClean}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Reset to Clean
            </button>
          </div>

          {/* Fault Injection Preset Triggers */}
          <div>
            <label className="text-xs text-slate-400 block mb-2">Simulate Transmission Fault:</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => handleApplyFault('TEMP_CHANGE')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-800 text-slate-300 hover:text-rose-300 transition-all text-left"
              >
                <span className="block font-semibold">Temp +10°C</span>
                <span className="text-[10px] text-slate-500">28.5 → 38.5</span>
              </button>

              <button
                onClick={() => handleApplyFault('HUM_CHANGE')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-800 text-slate-300 hover:text-rose-300 transition-all text-left"
              >
                <span className="block font-semibold">Hum +1%</span>
                <span className="text-[10px] text-slate-500">72 → 73</span>
              </button>

              <button
                onClick={() => handleApplyFault('BIT_FLIP')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-800 text-slate-300 hover:text-rose-300 transition-all text-left"
              >
                <span className="block font-semibold">Bit Inversion</span>
                <span className="text-[10px] text-slate-500">Single Bit Flip</span>
              </button>

              <button
                onClick={() => handleApplyFault('SEQ_MUTATION')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-800 text-slate-300 hover:text-rose-300 transition-all text-left"
              >
                <span className="block font-semibold">Seq Mutation</span>
                <span className="text-[10px] text-slate-500">105 → 106</span>
              </button>

              <button
                onClick={() => handleApplyFault('MULTI_FIELD')}
                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-800 text-slate-300 hover:text-rose-300 transition-all text-left"
              >
                <span className="block font-semibold">Multi Field</span>
                <span className="text-[10px] text-slate-500">Temp + Hum</span>
              </button>

              <button
                onClick={handleResetToClean}
                className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition-all text-left font-semibold"
              >
                <span>No Fault</span>
                <span className="text-[10px] text-emerald-400/70 block">Original</span>
              </button>
            </div>
          </div>

          {/* Editable Received Payload */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">
              Received Payload at Destination (Live Editable):
            </label>
            <textarea
              rows={2}
              value={receivedPayload}
              onChange={(e) => setReceivedPayload(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Comparison and Result */}
          <div className={`p-4 rounded-2xl border ${
            isValid ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-rose-950/40 border-rose-500/40'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300">Receiver Validation Verdict:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-black font-mono border ${
                isValid ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}>
                {isValid ? 'VALID' : 'CORRUPTED'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Transmitted CRC:</span>
                <span className="text-base font-bold text-white">{originalCrc32}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">Recalculated CRC:</span>
                <span className={`text-base font-bold ${isValid ? 'text-emerald-400' : 'text-rose-400 text-glow-rose'}`}>
                  {recalculatedCrc32}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
