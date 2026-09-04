import React from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, Binary, Copy, Check, ArrowRight, CornerDownRight } from 'lucide-react';

export default function PacketDetailModal({ packet, onClose }) {
  const [copied, setCopied] = React.useState(false);

  if (!packet) return null;

  const isValid = packet.status === 'VALID';
  const isLost = packet.status === 'LOST';

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Split payloads into fields for side-by-side diff
  const originalFields = packet.originalPayload ? packet.originalPayload.split('|') : [];
  const receivedFields = packet.receivedPayload ? packet.receivedPayload.split('|') : [];
  const fieldNames = ['Sensor ID', 'Sequence #', 'Temperature (°C)', 'Humidity (%)', 'Timestamp'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel-glow bg-[#0D131F] border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              isValid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
              isLost ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
              'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}>
              <Binary className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">CRC-32 Packet Inspector</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
                  isValid ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  isLost ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {packet.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Sensor {packet.sensorId} • Sequence #{packet.sequenceNo} • {new Date(packet.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">

          {/* CRC Checksum Verdict Banner */}
          <div className={`p-4 rounded-2xl border ${
            isValid
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              : isLost
              ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
          }`}>
            <div className="flex items-start gap-3">
              {isValid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
              )}
              <div className="text-xs space-y-1">
                <h4 className="font-bold text-sm">
                  {isValid ? 'CRC-32 Integrity Verification Passed' : 'CRC-32 Integrity Verification Failed (Corruption Detected)'}
                </h4>
                <p className="text-slate-300">
                  {isValid
                    ? 'The receiver recalculated the CRC-32 checksum over the received payload bytes and obtained an exact match with the transmitted checksum.'
                    : `Transmission noise or simulated fault altered the payload data in transit. Transmitted CRC (${packet.originalCrc32}) ≠ Recalculated CRC (${packet.recalculatedCrc32}).`}
                </p>
                {packet.corruptionType && packet.corruptionType !== 'NONE' && (
                  <p className="font-mono text-rose-300 mt-1">
                    Fault Injection Mode: <strong>{packet.corruptionType}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* CRC Checksum Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Transmitted Checksum (Sender)
              </span>
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-2xl font-black text-white tracking-widest">
                  {packet.originalCrc32}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  IEEE 802.3
                </span>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${
              isValid ? 'bg-slate-900/80 border-emerald-500/40' : 'bg-slate-900/80 border-rose-500/40'
            }`}>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Recalculated Checksum (Receiver)
              </span>
              <div className="flex items-baseline justify-between font-mono">
                <span className={`text-2xl font-black tracking-widest ${
                  isValid ? 'text-emerald-400' : 'text-rose-400 text-glow-rose'
                }`}>
                  {packet.recalculatedCrc32 || 'N/A'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  isValid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {isValid ? 'MATCH' : 'MISMATCH'}
                </span>
              </div>
            </div>
          </div>

          {/* Field-by-Field Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Deterministic Payload Field Comparison
            </h4>

            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800/80">
              {fieldNames.map((name, idx) => {
                const origVal = originalFields[idx] || '';
                const recVal = receivedFields[idx] || '';
                const isDifferent = origVal !== recVal && !isLost;

                return (
                  <div
                    key={name}
                    className={`p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isDifferent ? 'bg-rose-500/10' : ''
                    }`}
                  >
                    <span className="text-slate-400 font-medium w-36 shrink-0">{name}</span>
                    
                    <div className="flex items-center gap-3 font-mono flex-1 justify-end">
                      <span className="text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                        {origVal || '—'}
                      </span>

                      {!isValid && !isLost && (
                        <>
                          <ArrowRight className={`w-3.5 h-3.5 ${isDifferent ? 'text-rose-400' : 'text-slate-600'}`} />
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            isDifferent ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400'
                          }`}>
                            {recVal || '—'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Raw Payload Strings */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Raw Payload String Contract</span>
              <button
                onClick={() => copyToClipboard(packet.originalPayload)}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto select-all">
              {packet.originalPayload}
            </div>

            {packet.receivedPayload && packet.receivedPayload !== packet.originalPayload && (
              <div className="mt-2">
                <span className="text-[11px] text-rose-400 font-mono block mb-1">Received (Corrupted) Payload:</span>
                <div className="bg-rose-950/30 p-3.5 rounded-xl border border-rose-500/30 font-mono text-xs text-rose-300 overflow-x-auto select-all">
                  {packet.receivedPayload}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
}
