import React, { useState, useMemo } from 'react';
import { Radio, Search, Filter, CheckCircle2, AlertTriangle, HelpCircle, Pause, Play, Eye, Flame, CornerDownRight } from 'lucide-react';

export default function LivePacketFeed({
  packets = [],
  onSelectPacket,
  isPaused,
  setIsPaused
}) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPackets = useMemo(() => {
    return packets.filter((p) => {
      const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
      const matchesSearch =
        !searchTerm ||
        p.sensorId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.sequenceNo).includes(searchTerm) ||
        p.originalCrc32?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.recalculatedCrc32?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [packets, filterStatus, searchTerm]);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col h-full">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="w-5 h-5 text-cyan-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          </div>
          <div>
            <h3 className="font-bold text-white text-base tracking-tight">Live Packet Monitor & CRC-32 Stream</h3>
            <p className="text-xs text-slate-400">Deterministic receiver validation telemetry</p>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Pause / Resume button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isPaused
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            {isPaused ? (
              <>
                <Play className="w-3.5 h-3.5 fill-amber-300" />
                Resume Stream
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" />
                Pause
              </>
            )}
          </button>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter sensor, seq, CRC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none w-36 sm:w-44 font-mono"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
            {['ALL', 'VALID', 'CORRUPTED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  filterStatus === st
                    ? st === 'VALID'
                      ? 'bg-emerald-500 text-black font-semibold'
                      : st === 'CORRUPTED'
                      ? 'bg-rose-500 text-white font-semibold'
                      : 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Packet Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[420px] mt-3">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60 sticky top-0 z-10 backdrop-blur-sm">
              <th className="py-2.5 px-3">Time</th>
              <th className="py-2.5 px-3">Sensor</th>
              <th className="py-2.5 px-3">Seq #</th>
              <th className="py-2.5 px-3">Readings</th>
              <th className="py-2.5 px-3 font-mono">Transmitted CRC</th>
              <th className="py-2.5 px-3 font-mono">Recalculated CRC</th>
              <th className="py-2.5 px-3">Verdict</th>
              <th className="py-2.5 px-3 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredPackets.length > 0 ? (
              filteredPackets.map((pkt) => {
                const isValid = pkt.status === 'VALID';
                const isLost = pkt.status === 'LOST';

                return (
                  <tr
                    key={pkt.packetId || `${pkt.sensorId}-${pkt.sequenceNo}-${pkt.timestamp}`}
                    onClick={() => onSelectPacket(pkt)}
                    className={`hover:bg-slate-800/60 cursor-pointer transition-colors group ${
                      !isValid && !isLost ? 'bg-rose-500/5' : ''
                    }`}
                  >
                    {/* Time */}
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(pkt.timestamp).toLocaleTimeString()}
                    </td>

                    {/* Sensor ID */}
                    <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-300">
                        {pkt.sensorId}
                      </span>
                    </td>

                    {/* Sequence No */}
                    <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                      #{pkt.sequenceNo}
                    </td>

                    {/* Readings */}
                    <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                      <span className="text-amber-300">{pkt.temperature}°C</span>
                      <span className="text-slate-500 mx-1.5">|</span>
                      <span className="text-cyan-300">{pkt.humidity}%</span>
                    </td>

                    {/* Transmitted CRC */}
                    <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">
                        {pkt.originalCrc32}
                      </span>
                    </td>

                    {/* Recalculated CRC */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {isLost ? (
                        <span className="text-slate-500 italic">—</span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded border font-semibold ${
                            isValid
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-400 text-glow-rose'
                          }`}
                        >
                          {pkt.recalculatedCrc32}
                        </span>
                      )}
                    </td>

                    {/* Verdict */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {isValid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          VALID
                        </span>
                      ) : isLost ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">
                          LOST
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-bold border border-rose-500/30">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          CORRUPTED
                        </span>
                      )}
                    </td>

                    {/* Inspect Button */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPacket(pkt);
                        }}
                        className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 group-hover:text-emerald-400 transition-colors"
                        title="View Packet Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-500 font-sans">
                  {packets.length === 0 ? (
                    <div className="space-y-1">
                      <p className="text-slate-400 font-medium">No packets transmitted yet</p>
                      <p className="text-xs text-slate-500">Configure parameters and click "Launch Simulation" above</p>
                    </div>
                  ) : (
                    <p>No packets matching filter criteria.</p>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span>Showing {filteredPackets.length} of {packets.length} recent packets</span>
        <span className="text-[11px] text-slate-500">Click any packet to inspect raw payload & byte diff</span>
      </div>
    </div>
  );
}
