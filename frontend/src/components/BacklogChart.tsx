import React, { useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { HourlyRecord } from '../types';
import { BarChart3, Filter } from 'lucide-react';

interface BacklogChartProps {
  timeline: HourlyRecord[];
  comparisonTimeline?: HourlyRecord[];
  isComparing?: boolean;
}

const STAGE_CONFIG = [
  { key: 'FNOL', name: 'FNOL Inflow', color: '#38bdf8' },
  { key: 'Validation', name: 'Validation', color: '#818cf8' },
  { key: 'Document_Processing', name: 'Doc Processing', color: '#c084fc' },
  { key: 'Assessment', name: 'Desk Assessment', color: '#f472b6' },
  { key: 'Survey', name: 'Field Survey', color: '#ef4444' }, // Highlighted as critical physical bottleneck
  { key: 'Repair_Authorization', name: 'Repair Authorization', color: '#f97316' },
  { key: 'Approval', name: 'Approval', color: '#eab308' },
  { key: 'Settlement', name: 'Settlement Queue', color: '#10b981' }
];

export const BacklogChart: React.FC<BacklogChartProps> = ({
  timeline,
  comparisonTimeline,
  isComparing = false
}) => {
  const [activeStages, setActiveStages] = useState<Record<string, boolean>>({
    FNOL: true,
    Validation: true,
    Document_Processing: true,
    Assessment: true,
    Survey: true,
    Repair_Authorization: true,
    Approval: true,
    Settlement: true
  });

  const toggleStage = (key: string) => {
    setActiveStages(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Prepare chart data format
  const chartData = timeline.map((rec, idx) => {
    const item: any = {
      label: rec.label,
      hour: rec.hour,
      total_backlog: rec.total_backlog
    };

    // Add per stage queue backlog
    STAGE_CONFIG.forEach(stg => {
      item[stg.key] = rec.queues?.[stg.key] || 0;
    });

    if (comparisonTimeline && comparisonTimeline[idx]) {
      item.comparison_total = comparisonTimeline[idx].total_backlog;
    }

    return item;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Cumulative Pipeline Queue Backlog (By Stage)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Hourly volume of claims waiting across the 8 lifecycle stages. Notice the massive surge at Survey & Repair Authorization.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STAGE_CONFIG.map(stg => (
            <button
              key={stg.key}
              onClick={() => toggleStage(stg.key)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition flex items-center gap-1 ${
                activeStages[stg.key]
                  ? 'bg-slate-800 border-slate-600 text-slate-200'
                  : 'bg-slate-950 border-slate-800 text-slate-600 opacity-60'
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stg.color }} />
              {stg.name}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {STAGE_CONFIG.map(stg => (
                <linearGradient key={stg.key} id={`color-${stg.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={stg.color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={stg.color} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
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

            {STAGE_CONFIG.map(stg => {
              if (!activeStages[stg.key]) return null;
              return (
                <Area
                  key={stg.key}
                  type="monotone"
                  dataKey={stg.key}
                  name={stg.name}
                  stackId="1"
                  stroke={stg.color}
                  fill={`url(#color-${stg.key})`}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
