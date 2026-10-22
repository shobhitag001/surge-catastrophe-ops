import React from 'react';
import { BaselineMetrics } from '../types';
import { 
  TrendingDown, 
  Clock, 
  ShieldAlert, 
  IndianRupee, 
  ArrowDownRight, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

interface DeltaComparisonBarProps {
  baselineMetrics: BaselineMetrics;
  activeMetrics: {
    peak_backlog: number;
    mean_settlement_time_hours: number;
    sla_breach_pct: number;
    total_economic_impact?: number;
    total_settled?: number;
  };
  deltas?: {
    backlog_reduction_pct?: number;
    settlement_acceleration_hours?: number;
    sla_breach_reduction_pct?: number;
    sla_penalties_saved?: number;
    net_economic_savings?: number;
    net_savings?: number;
    roi_ratio?: number;
  };
  isModified: boolean;
}

export const DeltaComparisonBar: React.FC<DeltaComparisonBarProps> = ({
  baselineMetrics,
  activeMetrics,
  deltas,
  isModified
}) => {
  const backlogDelta = deltas?.backlog_reduction_pct || 
    Math.round(((baselineMetrics.peak_backlog - activeMetrics.peak_backlog) / Math.max(1, baselineMetrics.peak_backlog)) * 100);
  
  const timeDelta = deltas?.settlement_acceleration_hours || 
    Math.round((baselineMetrics.mean_settlement_time_hours - activeMetrics.mean_settlement_time_hours) * 10) / 10;
  
  const slaDelta = deltas?.sla_breach_reduction_pct || 
    Math.round((baselineMetrics.sla_breach_pct - activeMetrics.sla_breach_pct) * 10) / 10;

  const netSavings = deltas?.net_economic_savings ?? deltas?.net_savings ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Peak Backlog */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-semibold uppercase tracking-wider">Peak Queue Backlog</span>
          <TrendingDown className="h-4 w-4 text-cyan-400" />
        </div>

        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-black font-mono text-white">
            {activeMetrics.peak_backlog.toFixed(0)}
          </span>
          <span className="text-xs text-slate-400 font-mono">claims</span>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Baseline: <strong className="text-slate-300 font-mono">{baselineMetrics.peak_backlog.toFixed(0)}</strong>
          </span>
          {isModified && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono font-bold flex items-center gap-0.5">
              <ArrowDownRight className="h-3 w-3" />
              {backlogDelta > 0 ? `-${backlogDelta}%` : `${backlogDelta}%`}
            </span>
          )}
        </div>
      </div>

      {/* 2. Mean Settlement Time */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-semibold uppercase tracking-wider">Mean Settlement Cycle</span>
          <Clock className="h-4 w-4 text-amber-400" />
        </div>

        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-black font-mono text-white">
            {activeMetrics.mean_settlement_time_hours.toFixed(1)}
          </span>
          <span className="text-xs text-slate-400 font-mono">hours</span>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Baseline: <strong className="text-slate-300 font-mono">{baselineMetrics.mean_settlement_time_hours.toFixed(1)}h</strong>
          </span>
          {isModified && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono font-bold flex items-center gap-0.5">
              <ArrowDownRight className="h-3 w-3" />
              {timeDelta > 0 ? `-${timeDelta}h` : `${timeDelta}h`}
            </span>
          )}
        </div>
      </div>

      {/* 3. SLA Breach Rate */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-semibold uppercase tracking-wider">Regulatory SLA Breaches</span>
          <ShieldAlert className="h-4 w-4 text-rose-400" />
        </div>

        <div className="flex items-baseline gap-2 mt-1">
          <span className={`text-2xl font-black font-mono ${activeMetrics.sla_breach_pct > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {activeMetrics.sla_breach_pct.toFixed(1)}%
          </span>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Baseline: <strong className="text-slate-300 font-mono">{baselineMetrics.sla_breach_pct.toFixed(1)}%</strong>
          </span>
          {isModified && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono font-bold flex items-center gap-0.5">
              <ArrowDownRight className="h-3 w-3" />
              -{slaDelta}%
            </span>
          )}
        </div>
      </div>

      {/* 4. Net Economic Savings / ROI */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-semibold uppercase tracking-wider">Net Savings & ROI</span>
          <IndianRupee className="h-4 w-4 text-emerald-400" />
        </div>

        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-black font-mono text-emerald-400">
            {isModified ? `₹${(netSavings / 100000).toFixed(1)}L` : 'Baseline'}
          </span>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Penalties Averted
          </span>
          {isModified && deltas?.roi_ratio && (
            <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono font-bold flex items-center gap-0.5">
              <Sparkles className="h-3 w-3" />
              ROI {deltas.roi_ratio}x
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
