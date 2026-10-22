import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { HourlyRecord } from '../types';
import { TrendingUp, CheckCircle, Zap } from 'lucide-react';

interface SettlementThroughputChartProps {
  baselineTimeline: HourlyRecord[];
  activeTimeline: HourlyRecord[];
  isInterventionActive: boolean;
}

export const SettlementThroughputChart: React.FC<SettlementThroughputChartProps> = ({
  baselineTimeline,
  activeTimeline,
  isInterventionActive
}) => {
  const chartData = baselineTimeline.map((base, idx) => {
    const act = activeTimeline[idx] || base;
    return {
      label: base.label,
      hour: base.hour,
      baseline_settled: base.settled_claims,
      active_settled: act.settled_claims,
      settlement_delta: Math.max(0, act.settled_claims - base.settled_claims),
      baseline_hourly: base.hourly_settled,
      active_hourly: act.hourly_settled
    };
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Cumulative Claim Settlements & Velocity Curve
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compares baseline settlement velocity against active intervention / OR-Tools optimized capacity.
          </p>
        </div>

        {isInterventionActive && (
          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-700/50 px-3 py-1 rounded-lg text-xs text-emerald-300 font-semibold">
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            <span>Intervention Accelerated Flow Active</span>
          </div>
        )}
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis 
              dataKey="label" 
              stroke="#64748b" 
              tick={{ fontSize: 10 }}
              interval={5}
            />
            <YAxis 
              stroke="#64748b" 
              tick={{ fontSize: 10 }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-950 border border-slate-700 p-3 rounded-lg shadow-2xl text-xs space-y-1">
                      <p className="font-bold text-cyan-400 border-b border-slate-800 pb-1">{label}</p>
                      {payload.map((entry: any) => (
                        <div key={entry.name} className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            {entry.name}:
                          </span>
                          <span className="font-mono font-bold text-white">{Number(entry.value).toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

            <Line 
              type="monotone" 
              dataKey="baseline_settled" 
              name="Baseline Settlements" 
              stroke="#94a3b8" 
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />

            {isInterventionActive && (
              <Line 
                type="monotone" 
                dataKey="active_settled" 
                name="Optimized / What-If Settlements" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
