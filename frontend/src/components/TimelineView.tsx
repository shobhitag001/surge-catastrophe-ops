import React, { useState } from 'react';
import { HourlyRecord, CascadeAnalysis } from '../types';
import { 
  Clock, 
  AlertOctagon, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle,
  Info
} from 'lucide-react';

interface TimelineViewProps {
  timeline: HourlyRecord[];
  cascadeAnalysis: CascadeAnalysis | null;
  selectedHour: number;
  onSelectHour: (hour: number) => void;
}

const STAGES = [
  { key: 'FNOL', label: '1. FNOL Ingestion', resource: 'Call Agents + Web Intake' },
  { key: 'Validation', label: '2. Policy Validation', resource: 'Rule Engine + Desk Adjusters' },
  { key: 'Document_Processing', label: '3. Document Processing', resource: 'Cloud OCR AI + Human Verification' },
  { key: 'Assessment', label: '4. Desk Assessment', resource: 'Desk Claims Adjusters' },
  { key: 'Survey', label: '5. Field Survey', resource: 'Independent Licensed Surveyors' },
  { key: 'Repair_Authorization', label: '6. Repair Authorization', resource: 'Partner Network Garages & Workshops' },
  { key: 'Approval', label: '7. Financial Approval', resource: 'Senior Claims Authorities' },
  { key: 'Settlement', label: '8. Settlement & Payment', resource: 'Banking / NEFT Disbursement API' },
];

export const TimelineView: React.FC<TimelineViewProps> = ({
  timeline,
  cascadeAnalysis,
  selectedHour,
  onSelectHour,
}) => {
  // Filter timeline display ticks (e.g. sample every 2-3 hours to fit cleanly, or show full scrollable view)
  const displayHours = timeline.filter((_, idx) => idx % 2 === 0);
  const activeRecord = timeline[selectedHour] || timeline[0];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
      {/* Header & Milestone Alert Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Operational Timeline & Bottleneck Cascade Heatmap
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              T+0 to T+72 Hours
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visual hourly countdown showing when operational tiers transition from Green (Laminar) to Amber (Strained) to Red (Breached).
          </p>
        </div>

        {/* Cascade Narrative Pills */}
        {cascadeAnalysis?.primary_bottleneck && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-700/60 text-xs text-rose-200">
              <AlertOctagon className="h-4 w-4 text-rose-400" />
              <span>
                <strong>Primary Choke:</strong> {cascadeAnalysis.primary_bottleneck.stage.replace('_', ' ')} at {cascadeAnalysis.primary_bottleneck.label}
              </span>
            </div>

            {cascadeAnalysis.cascading_bottlenecks.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/80 border border-amber-700/60 text-xs text-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>
                  <strong>Cascading Wave:</strong> {cascadeAnalysis.cascading_bottlenecks[0].stage.replace('_', ' ')} at {cascadeAnalysis.cascading_bottlenecks[0].label}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hourly Heatmap Grid */}
      <div className="mt-5 overflow-x-auto pb-2">
        <div className="min-w-[900px]">
          {/* Timeline Header Row (Hours T+0 to T+72) */}
          <div className="grid grid-cols-[220px_repeat(37,minmax(20px,1fr))] gap-1 items-center mb-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Claims Lifecycle Stage
            </div>
            {displayHours.map((rec) => (
              <button
                key={rec.hour}
                onClick={() => onSelectHour(rec.hour)}
                className={`text-[10px] font-mono text-center rounded py-1 transition ${
                  selectedHour === rec.hour
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={`Select hour ${rec.label}`}
              >
                {rec.hour}h
              </button>
            ))}
          </div>

          {/* 8 Stage Heatmap Rows */}
          <div className="space-y-1.5">
            {STAGES.map((stg) => {
              const primaryBreachHour = cascadeAnalysis?.stage_breach_hours[stg.key];

              return (
                <div 
                  key={stg.key} 
                  className="grid grid-cols-[220px_repeat(37,minmax(20px,1fr))] gap-1 items-center bg-slate-950/50 p-1 rounded-lg border border-slate-800/60 hover:border-slate-700 transition"
                >
                  {/* Stage Label */}
                  <div className="pr-2 flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 truncate" title={stg.label}>
                        {stg.label}
                      </span>
                      {primaryBreachHour !== undefined && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-900/60 text-rose-300 border border-rose-700/50 font-bold">
                          T+{primaryBreachHour}h
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 truncate" title={stg.resource}>
                      {stg.resource}
                    </span>
                  </div>

                  {/* Hourly Heatmap Cells */}
                  {displayHours.map((rec) => {
                    const statusData = rec.stage_statuses?.[stg.key];
                    const status = statusData?.status || 'GREEN';
                    const backlog = rec.queues?.[stg.key] || 0;
                    const isSelected = selectedHour === rec.hour;

                    let bgClass = 'bg-emerald-900/50 hover:bg-emerald-800/80 border-emerald-700/40 text-emerald-300';
                    if (status === 'AMBER') {
                      bgClass = 'bg-amber-900/60 hover:bg-amber-800/90 border-amber-600/50 text-amber-200 timeline-amber-strip';
                    } else if (status === 'RED') {
                      bgClass = 'bg-rose-950 hover:bg-rose-900 border-rose-600 text-rose-200 timeline-red-strip';
                    }

                    return (
                      <div
                        key={rec.hour}
                        onClick={() => onSelectHour(rec.hour)}
                        className={`h-7 rounded border cursor-pointer transition flex items-center justify-center relative group ${bgClass} ${
                          isSelected ? 'ring-2 ring-cyan-400 scale-105 z-10' : ''
                        }`}
                        title={`${stg.label} at T+${rec.hour}h: Backlog ${backlog.toFixed(1)} claims (Status: ${status})`}
                      >
                        {status === 'RED' && (
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                        )}

                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-30 pointer-events-none">
                          <div className="bg-slate-900 text-white border border-slate-700 text-[10px] rounded p-2 shadow-2xl whitespace-nowrap">
                            <p className="font-bold text-cyan-400">{stg.label} ({rec.label})</p>
                            <p className="text-slate-300">Queue Backlog: <span className="font-mono text-white">{backlog.toFixed(1)} claims</span></p>
                            <p className="text-slate-300">Dwell Ratio: <span className="font-mono text-white">{statusData?.dwell_hours || 0} hrs</span></p>
                            <p className="text-slate-300">Status: <span className={`font-bold ${status === 'RED' ? 'text-rose-400' : status === 'AMBER' ? 'text-amber-400' : 'text-emerald-400'}`}>{status}</span></p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend & Selected Hour Quick Peek */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-3">
        {/* Heatmap Legend */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-emerald-700 border border-emerald-500/50" />
            <span>Green (Laminar Flow &lt;1.2h)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-amber-700 border border-amber-500/50" />
            <span>Amber (Elevated Dwell 1.2h - 3.0h)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-rose-900 border border-rose-500/50" />
            <span>Red (Critical SLA Breach &gt;3.0h)</span>
          </div>
        </div>

        {/* Selected Hour Details */}
        {activeRecord && (
          <div className="flex items-center gap-4 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="font-mono font-bold text-cyan-400">
              Selected Time: {activeRecord.label}
            </span>
            <span>Total Backlog: <strong className="text-white font-mono">{activeRecord.total_backlog}</strong></span>
            <span>Cumulative Settled: <strong className="text-emerald-400 font-mono">{activeRecord.settled_claims}</strong></span>
            <span>Est. Financial Impact: <strong className="text-amber-400 font-mono">₹{(activeRecord.total_financial_impact / 100000).toFixed(1)}L</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};
