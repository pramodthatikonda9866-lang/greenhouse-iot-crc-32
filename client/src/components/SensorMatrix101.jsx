import React, { useState, useMemo } from 'react';
import { Cpu, Search, AlertTriangle, ShieldCheck, CheckCircle2, Thermometer, Droplets, Power, RefreshCw, Layers } from 'lucide-react';

export default function SensorMatrix101({
  sensors = [],
  onSelectSensor,
  onToggleSensor
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [selectedSensorDetail, setSelectedSensorDetail] = useState(null);

  // Group sensors into 5 realistic greenhouse microclimate zones
  const zones = [
    { id: 'ALL', name: 'All 101 Nodes' },
    { id: 'ZONE_A', name: 'Zone A: Nursery (S001-S020)', range: [1, 20] },
    { id: 'ZONE_B', name: 'Zone B: Hydroponics (S021-S040)', range: [21, 40] },
    { id: 'ZONE_C', name: 'Zone C: Canopy (S041-S065)', range: [41, 65] },
    { id: 'ZONE_D', name: 'Zone D: Blossom (S066-S085)', range: [66, 85] },
    { id: 'ZONE_E', name: 'Zone E: Ventilation (S086-S101)', range: [86, 101] }
  ];

  // High-error ranking
  const topCorruptedSensors = useMemo(() => {
    return [...sensors]
      .filter(s => (s.totalPackets || 0) > 0)
      .sort((a, b) => (b.corruptedPackets || 0) - (a.corruptedPackets || 0) || (a.reliability || 0) - (b.reliability || 0))
      .slice(0, 10);
  }, [sensors]);

  const filteredSensors = useMemo(() => {
    return sensors.filter(s => {
      const idNum = parseInt(s.sensorId.replace(/\D/g, ''), 10);
      const matchesSearch = !searchTerm || s.sensorId.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesZone = true;
      if (zoneFilter !== 'ALL') {
        const targetZone = zones.find(z => z.id === zoneFilter);
        if (targetZone && targetZone.range) {
          matchesZone = idNum >= targetZone.range[0] && idNum <= targetZone.range[1];
        }
      }

      return matchesSearch && matchesZone;
    });
  }, [sensors, searchTerm, zoneFilter]);

  const getNodeStatusColor = (sensor) => {
    if (!sensor.enabled) return 'bg-slate-800 border-slate-700 text-slate-500 opacity-40';
    if (sensor.totalPackets === 0) return 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500';
    if (sensor.reliability >= 100) return 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 hover:border-emerald-400 hover:shadow-emerald-500/20';
    if (sensor.reliability >= 85) return 'bg-teal-950/40 border-teal-500/40 text-teal-300 hover:border-teal-400';
    if (sensor.reliability >= 60) return 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:border-amber-400';
    return 'bg-rose-950/50 border-rose-500/50 text-rose-300 hover:border-rose-400 animate-pulse';
  };

  return (
    <div className="space-y-6">
      
      {/* Top Bar: Zone Select & Search */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-white text-base tracking-tight">101 Virtual Greenhouse Sensor Grid</h2>
            </div>
            <p className="text-xs text-slate-400">Microclimate environmental telemetry and reliability matrix</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search S001-S101..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none w-40 font-mono"
              />
            </div>

            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs overflow-x-auto">
              {zones.map((z) => (
                <button
                  key={z.id}
                  onClick={() => setZoneFilter(z.id)}
                  className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-all ${
                    zoneFilter === z.id
                      ? 'bg-emerald-500 text-black font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {z.id === 'ALL' ? 'All' : z.id.replace('ZONE_', 'Zone ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left 3 Columns: 101 Sensor Grid */}
        <div className="lg:col-span-3 glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 text-xs text-slate-400">
            <span>Showing {filteredSensors.length} of 101 Sensor Nodes</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> 100% Valid</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> 60-99%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400"></span> &lt;60% Error</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-600"></span> Idle</span>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5 max-h-[540px] overflow-y-auto p-1">
            {filteredSensors.map((sensor) => {
              const hasPackets = (sensor.totalPackets || 0) > 0;
              return (
                <div
                  key={sensor.sensorId}
                  onClick={() => setSelectedSensorDetail(sensor)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between items-center text-center group shadow-md ${getNodeStatusColor(sensor)}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono font-bold">{sensor.sensorId}</span>
                    {hasPackets && sensor.corruptedPackets > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
                    )}
                  </div>

                  <div className="my-1.5 font-mono">
                    <span className="text-xs font-black block">
                      {hasPackets ? `${sensor.reliability}%` : '—'}
                    </span>
                    <span className="text-[9px] text-slate-400 block">
                      {sensor.validPackets || 0}v / {sensor.corruptedPackets || 0}c
                    </span>
                  </div>

                  {sensor.lastReading ? (
                    <div className="text-[9px] text-slate-400 w-full pt-1 border-t border-slate-800/60 flex justify-between">
                      <span>{sensor.lastReading.temperature}°C</span>
                      <span>{sensor.lastReading.humidity}%</span>
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-500">Standby</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Column: High-Error Ranking Leaderboard */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h3 className="font-bold text-white text-sm tracking-tight">High-Error Sensors Ranking</h3>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[500px] space-y-2.5">
            {topCorruptedSensors.length > 0 ? (
              topCorruptedSensors.map((s, idx) => (
                <div
                  key={s.sensorId}
                  onClick={() => setSelectedSensorDetail(s)}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/40 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      idx === 0 ? 'bg-rose-500 text-white' :
                      idx === 1 ? 'bg-rose-500/50 text-rose-200' :
                      idx === 2 ? 'bg-amber-500/40 text-amber-200' : 'bg-slate-800 text-slate-400'
                    }`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="text-xs font-mono font-bold text-white">{s.sensorId}</span>
                      <p className="text-[10px] text-slate-400">Total: {s.totalPackets} pkts</p>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-xs font-bold text-rose-400 block">
                      {s.corruptedPackets} corrupted
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {s.reliability}% rel
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-xs text-slate-500">
                <ShieldCheck className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                <p>No corrupted sensors detected yet.</p>
                <p className="text-[10px] text-slate-600 mt-1">Run a simulation with &gt;0% corruption rate.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Single Sensor Detail Modal */}
      {selectedSensorDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel-glow bg-[#0D131F] border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white font-mono">{selectedSensorDetail.sensorId} Detail</h3>
                  <span className="text-xs text-slate-400">Virtual Greenhouse Node</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSensorDetail(null)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 bg-slate-800 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Packets</span>
                <span className="text-xl font-mono font-bold text-white">{selectedSensorDetail.totalPackets || 0}</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Reliability</span>
                <span className="text-xl font-mono font-bold text-emerald-400">{selectedSensorDetail.reliability || 0}%</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-emerald-400 uppercase font-semibold block">Valid Checksums</span>
                <span className="text-xl font-mono font-bold text-emerald-400">{selectedSensorDetail.validPackets || 0}</span>
              </div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-rose-400 uppercase font-semibold block">Corrupted Failures</span>
                <span className="text-xl font-mono font-bold text-rose-400">{selectedSensorDetail.corruptedPackets || 0}</span>
              </div>
            </div>

            {selectedSensorDetail.lastReading && (
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">Latest Telemetry</span>
                <div className="flex justify-between font-mono">
                  <span className="text-amber-300">Temperature: {selectedSensorDetail.lastReading.temperature}°C</span>
                  <span className="text-cyan-300">Humidity: {selectedSensorDetail.lastReading.humidity}%</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Last active: {new Date(selectedSensorDetail.lastReading.timestamp).toLocaleTimeString()}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-between">
              <button
                onClick={() => {
                  onToggleSensor(selectedSensorDetail.sensorId);
                  setSelectedSensorDetail(prev => ({ ...prev, enabled: !prev.enabled }));
                }}
                className={`px-4 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                  selectedSensorDetail.enabled
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                {selectedSensorDetail.enabled ? 'Disable Sensor' : 'Enable Sensor'}
              </button>

              <button
                onClick={() => setSelectedSensorDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
