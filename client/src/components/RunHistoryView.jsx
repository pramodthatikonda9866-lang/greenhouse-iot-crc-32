import React, { useState, useEffect } from 'react';
import { History, Download, FileText, CheckCircle2, AlertTriangle, Clock, RefreshCw, Layers } from 'lucide-react';
import { simulationApi, analyticsApi } from '../services/api';

export default function RunHistoryView() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState(null);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const res = await simulationApi.getRuns();
      if (res.data?.success) {
        setRuns(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching past runs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleDownload = (runId, format) => {
    const url = analyticsApi.getExportUrl(runId, format);
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Simulation Run History & Persistence</h2>
            <p className="text-xs text-slate-400">Archived telemetry runs persisted in MongoDB</p>
          </div>
        </div>

        <button
          onClick={fetchRuns}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Runs Table */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 overflow-hidden">
        {runs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                  <th className="py-3 px-3.5">Run ID</th>
                  <th className="py-3 px-3.5">Date & Time</th>
                  <th className="py-3 px-3.5">Sensors</th>
                  <th className="py-3 px-3.5">Target Noise</th>
                  <th className="py-3 px-3.5">Packets (Val/Err)</th>
                  <th className="py-3 px-3.5">Reliability</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Export</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {runs.map((r) => {
                  const summary = r.summary || {};
                  const reliability = summary.reliability !== undefined ? summary.reliability : 0;
                  const isHighReliability = reliability >= 90;

                  return (
                    <tr key={r.runId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3.5 font-bold text-white whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-300">
                          {r.runId.substring(0, 18)}...
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-slate-400 whitespace-nowrap">
                        {new Date(r.startTime || r.createdAt).toLocaleString()}
                      </td>

                      <td className="py-3 px-3.5 text-slate-300 whitespace-nowrap">
                        {r.sensorCount} Nodes
                      </td>

                      <td className="py-3 px-3.5 text-slate-300 whitespace-nowrap">
                        <span className="text-amber-300">{(r.corruptionRate * 100).toFixed(0)}%</span>
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="text-emerald-400">{summary.valid || 0}</span>
                        <span className="text-slate-600 mx-1">/</span>
                        <span className="text-rose-400">{summary.corrupted || 0}</span>
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded border font-bold ${
                          isHighReliability
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}>
                          {reliability.toFixed(1)}%
                        </span>
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap font-sans">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {r.status}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-right whitespace-nowrap font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDownload(r.runId, 'json')}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700 transition-colors"
                            title="Download JSON telemetry"
                          >
                            <Download className="w-3 h-3" />
                            JSON
                          </button>
                          <button
                            onClick={() => handleDownload(r.runId, 'csv')}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700 transition-colors"
                            title="Download CSV spreadsheet"
                          >
                            <Download className="w-3 h-3" />
                            CSV
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500">
            <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-400">No simulation runs recorded yet</p>
            <p className="text-xs text-slate-500 mt-1">Run simulations on the dashboard to archive results here.</p>
          </div>
        )}
      </div>

    </div>
  );
}
