import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function ReliabilityChart({ historyData = [], currentStats }) {
  // Format data for chart display
  const chartData = useMemo(() => {
    if (!historyData || historyData.length === 0) {
      // Return baseline placeholder points if no data yet
      return [
        { time: '0s', reliability: 0, valid: 0, corrupted: 0, errorRate: 0 }
      ];
    }
    return historyData.slice(-30); // Show last 30 intervals
  }, [historyData]);

  const hasData = historyData.length > 1;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-white text-base tracking-tight">Real-Time Packet Reliability & Error Trend</h3>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            Reliability (%)
          </span>
          <span className="flex items-center gap-1.5 text-rose-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
            Error Rate (%)
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                fontSize: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
              }}
              labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}
              formatter={(value, name) => [
                `${Number(value).toFixed(1)}%`,
                name === 'reliability' ? 'Reliability' : 'Error Rate'
              ]}
            />
            <Line
              type="monotone"
              dataKey="reliability"
              name="reliability"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="errorRate"
              name="errorRate"
              stroke="#f43f5e"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 4, fill: '#f43f5e', stroke: '#fff' }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {!hasData && (
        <div className="mt-2 text-center text-xs text-slate-500 py-1 bg-slate-900/40 rounded-lg">
          Live timeseries telemetry will plot continuously as packets arrive.
        </div>
      )}
    </div>
  );
}
