import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import KpiCards from './components/KpiCards';
import ControlsPanel from './components/ControlsPanel';
import ReliabilityChart from './components/ReliabilityChart';
import LivePacketFeed from './components/LivePacketFeed';
import SensorMatrix101 from './components/SensorMatrix101';
import CrcSandbox from './components/CrcSandbox';
import FileIntegrityChecker from './components/FileIntegrityChecker';
import RunHistoryView from './components/RunHistoryView';
import PacketDetailModal from './components/PacketDetailModal';
import EmptyState from './components/EmptyState';
import { getSocket } from './services/socket';
import { simulationApi, sensorApi } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPacket, setSelectedPacket] = useState(null);
  const [isFeedPaused, setIsFeedPaused] = useState(false);

  // Simulation state
  const [simulationState, setSimulationState] = useState({
    status: 'IDLE',
    runId: null,
    config: {
      sensorCount: 101,
      packetsPerSensor: 50,
      rateMs: 200,
      corruptionRate: 0.05,
      lossRate: 0.0,
      seed: null,
      continuous: false
    },
    stats: {
      generated: 0,
      received: 0,
      valid: 0,
      corrupted: 0,
      lost: 0,
      reliability: 0.0,
      errorRate: 0.0,
      startTime: null,
      endTime: null
    }
  });

  const [packets, setPackets] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [chartHistory, setChartHistory] = useState([]);

  const isPausedRef = useRef(isFeedPaused);
  useEffect(() => {
    isPausedRef.current = isFeedPaused;
  }, [isFeedPaused]);

  // Connect to WebSocket
  useEffect(() => {
    const socket = getSocket();

    socket.on('simulation:state', (data) => {
      setSimulationState((prev) => ({
        ...prev,
        status: data.status || prev.status,
        runId: data.runId,
        config: data.config || prev.config,
        stats: data.stats || prev.stats
      }));

      // If reset to IDLE, reset packets & chart
      if (data.status === 'IDLE' && (!data.stats || data.stats.generated === 0)) {
        setPackets([]);
        setChartHistory([]);
      }
    });

    socket.on('packets:stream', (newPackets) => {
      if (!isPausedRef.current && Array.isArray(newPackets) && newPackets.length > 0) {
        setPackets((prev) => {
          const combined = [...newPackets, ...prev];
          return combined.slice(0, 300); // Keep last 300 in buffer
        });
      }
    });

    socket.on('stats:update', (data) => {
      if (data.stats) {
        setSimulationState((prev) => ({
          ...prev,
          stats: data.stats
        }));

        // Append to chart timeseries
        setChartHistory((prev) => {
          const elapsed = data.stats.startTime
            ? Math.round((Date.now() - new Date(data.stats.startTime).getTime()) / 1000)
            : prev.length;

          const point = {
            time: `${elapsed}s`,
            reliability: parseFloat(data.stats.reliability || 0),
            errorRate: parseFloat(data.stats.errorRate || 0),
            valid: data.stats.valid || 0,
            corrupted: data.stats.corrupted || 0
          };

          const updated = [...prev, point];
          return updated.slice(-40);
        });
      }
    });

    // Initial fetch of current state & sensors
    simulationApi.getCurrent().then((res) => {
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setSimulationState((prev) => ({
          ...prev,
          status: d.status || 'IDLE',
          runId: d.currentRunId,
          config: d.config || prev.config,
          stats: d.stats || prev.stats
        }));
        if (d.recentPackets) setPackets(d.recentPackets);
        if (d.sensors) setSensors(d.sensors);
      }
    }).catch(err => console.error('Error fetching initial state:', err));

    sensorApi.getAll().then((res) => {
      if (res.data?.success && res.data.data) {
        setSensors(res.data.data);
      }
    }).catch(err => console.error('Error fetching sensors:', err));

    return () => {
      socket.off('simulation:state');
      socket.off('packets:stream');
      socket.off('stats:update');
    };
  }, []);

  // Handlers
  const handleStart = async () => {
    try {
      const res = await simulationApi.start(simulationState.config);
      if (res.data?.success) {
        setSimulationState((prev) => ({
          ...prev,
          status: 'RUNNING',
          runId: res.data.runId
        }));
      }
    } catch (err) {
      console.error('Failed to start simulation:', err);
    }
  };

  const handleStop = async () => {
    try {
      await simulationApi.stop();
      setSimulationState((prev) => ({ ...prev, status: 'STOPPED' }));
    } catch (err) {
      console.error('Failed to stop simulation:', err);
    }
  };

  const handleReset = async () => {
    try {
      await simulationApi.reset();
      setSimulationState((prev) => ({
        ...prev,
        status: 'IDLE',
        runId: null,
        stats: {
          generated: 0,
          received: 0,
          valid: 0,
          corrupted: 0,
          lost: 0,
          reliability: 0.0,
          errorRate: 0.0,
          startTime: null,
          endTime: null
        }
      }));
      setPackets([]);
      setChartHistory([]);
      // Refresh sensors
      const res = await sensorApi.getAll();
      if (res.data?.success) setSensors(res.data.data);
    } catch (err) {
      console.error('Failed to reset simulation:', err);
    }
  };

  const handleToggleSensor = async (sensorId) => {
    try {
      await sensorApi.toggle(sensorId);
      setSensors((prev) =>
        prev.map((s) => (s.sensorId === sensorId ? { ...s, enabled: !s.enabled } : s))
      );
    } catch (err) {
      console.error('Failed to toggle sensor:', err);
    }
  };

  const hasData = simulationState.stats.generated > 0 || simulationState.status === 'RUNNING';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        simulationState={simulationState}
        onStart={handleStart}
        onStop={handleStop}
        onReset={handleReset}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <KpiCards
              stats={simulationState.stats}
              config={simulationState.config}
              status={simulationState.status}
            />

            {/* Controls Panel */}
            <ControlsPanel
              config={simulationState.config}
              setConfig={(fn) =>
                setSimulationState((prev) => ({ ...prev, config: fn(prev.config) }))
              }
              status={simulationState.status}
              onStart={handleStart}
              onStop={handleStop}
              onReset={handleReset}
            />

            {/* If No Data & Idle, display clean Section 13 Empty State */}
            {!hasData && (
              <EmptyState onStartDefault={handleStart} />
            )}

            {/* Active Telemetry: Charts & Live Packet Stream */}
            {hasData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ReliabilityChart
                  historyData={chartHistory}
                  currentStats={simulationState.stats}
                />
                <LivePacketFeed
                  packets={packets}
                  onSelectPacket={setSelectedPacket}
                  isPaused={isFeedPaused}
                  setIsPaused={setIsFeedPaused}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: 101 Sensors Grid */}
        {activeTab === 'sensors' && (
          <SensorMatrix101
            sensors={sensors.length > 0 ? sensors : Array.from({ length: 101 }, (_, i) => ({
              sensorId: `S${String(i + 1).padStart(3, '0')}`,
              enabled: true,
              totalPackets: 0,
              validPackets: 0,
              corruptedPackets: 0,
              reliability: 0.0
            }))}
            onSelectSensor={setSelectedPacket}
            onToggleSensor={handleToggleSensor}
          />
        )}

        {/* Tab 3: Full Packet Monitor */}
        {activeTab === 'packets' && (
          <div className="space-y-4">
            <LivePacketFeed
              packets={packets}
              onSelectPacket={setSelectedPacket}
              isPaused={isFeedPaused}
              setIsPaused={setIsFeedPaused}
            />
          </div>
        )}

        {/* Tab 4: CRC Sandbox & Fault Injector */}
        {activeTab === 'sandbox' && (
          <CrcSandbox />
        )}

        {/* Tab 5: Binary File Integrity Checker */}
        {activeTab === 'file-checker' && (
          <FileIntegrityChecker />
        )}

        {/* Tab 6: Run History & Data Export */}
        {activeTab === 'history' && (
          <RunHistoryView />
        )}

      </main>

      {/* Packet Inspector Modal */}
      {selectedPacket && (
        <PacketDetailModal
          packet={selectedPacket}
          onClose={() => setSelectedPacket(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#06090F] py-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Smart Greenhouse IoT Packet Reliability Monitor — IEEE 802.3 CRC-32</span>
          <span className="font-mono text-emerald-400/80">101 Virtual Sensors (S001 - S101) • 0xEDB88320</span>
        </div>
      </footer>
    </div>
  );
}
