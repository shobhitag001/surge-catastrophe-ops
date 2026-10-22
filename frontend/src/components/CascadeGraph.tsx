import React from 'react';
import { CascadeAnalysis, HourlyRecord } from '../types';
import { 
  GitCommit, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  AlertOctagon, 
  Activity,
  Split
} from 'lucide-react';

interface CascadeGraphProps {
  cascadeAnalysis: CascadeAnalysis | null;
  currentRecord: HourlyRecord | null;
}

const STAGES = [
  { id: 'FNOL', name: 'FNOL', role: 'Intake' },
  { id: 'Validation', name: 'Validation', role: 'Fraud & Coverage' },
  { id: 'Document_Processing', name: 'Docs AI', role: 'OCR & Ingestion' },
  { id: 'Assessment', name: 'Assessment', role: 'Desk Triage' },
  { id: 'Survey', name: 'Surveyor', role: 'Physical Inspection' },
  { id: 'Repair_Authorization', name: 'Repair Auth', role: 'Garages & Parts' },
  { id: 'Approval', name: 'Approval', role: 'Financial Audit' },
  { id: 'Settlement', name: 'Settlement', role: 'Disbursement' }
];

export const CascadeGraph: React.FC<CascadeGraphProps> = ({
  cascadeAnalysis,
  currentRecord
}) => {
  const primaryStage = cascadeAnalysis?.primary_bottleneck?.stage;
  const cascadingStages = (cascadeAnalysis?.cascading_bottlenecks || []).map(b => b.stage);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <GitCommit className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Claims Lifecycle Digital Twin (Cascade Node Graph)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Sequential flow topology showing triage branch points and delay propagation from Survey to Repair.
          </p>
        </div>

        {cascadeAnalysis?.primary_bottleneck && (
          <div className="text-xs px-2.5 py-1 rounded bg-rose-950/80 border border-rose-800 text-rose-300 font-semibold flex items-center gap-1.5">
            <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
            <span>Root Choke: {cascadeAnalysis.primary_bottleneck.stage}</span>
          </div>
        )}
      </div>

      {/* Node Pipeline Flow */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5 relative">
        {STAGES.map((stg, idx) => {
          const isPrimary = stg.id === primaryStage;
          const isCascading = cascadingStages.includes(stg.id);
          const queue = currentRecord?.queues?.[stg.id] || 0;
          const status = currentRecord?.stage_statuses?.[stg.id]?.status || 'GREEN';
          const breachHour = cascadeAnalysis?.stage_breach_hours?.[stg.id];

          let borderClass = 'border-slate-800 bg-slate-950/60';
          let statusBadge = 'bg-emerald-950 text-emerald-400 border-emerald-800';

          if (isPrimary || status === 'RED') {
            borderClass = 'border-rose-600 bg-rose-950/30 glow-red ring-1 ring-rose-500/50';
            statusBadge = 'bg-rose-950 text-rose-300 border-rose-700';
          } else if (isCascading || status === 'AMBER') {
            borderClass = 'border-amber-600 bg-amber-950/20 glow-amber ring-1 ring-amber-500/50';
            statusBadge = 'bg-amber-950 text-amber-300 border-amber-700';
          }

          return (
            <div 
              key={stg.id}
              className={`p-3 rounded-xl border flex flex-col justify-between transition hover:border-slate-600 relative ${borderClass}`}
            >
              {/* Branch indicator for Assessment -> Survey */}
              {stg.id === 'Assessment' && (
                <div className="absolute -top-2 right-2 bg-indigo-950 border border-indigo-700 text-[9px] px-1.5 rounded text-indigo-300 font-bold flex items-center gap-0.5">
                  <Split className="h-2.5 w-2.5" />
                  <span>45% Physical</span>
                </div>
              )}

              {/* Node Header */}
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-mono text-slate-500">0{idx + 1}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${statusBadge}`}>
                    {status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white truncate" title={stg.name}>
                  {stg.name}
                </h4>
                <p className="text-[10px] text-slate-400 truncate">{stg.role}</p>
              </div>

              {/* Node Metrics */}
              <div className="mt-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Queue:</span>
                  <span className={`font-mono font-bold ${queue > 30 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {queue.toFixed(0)}
                  </span>
                </div>

                {breachHour !== undefined && (
                  <div className="flex items-center justify-between text-[10px] text-rose-400 font-mono mt-0.5">
                    <span>Breach:</span>
                    <span>T+{breachHour}h</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Narrative Insights Banner */}
      {cascadeAnalysis?.narrative_insights && cascadeAnalysis.narrative_insights.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
          {cascadeAnalysis.narrative_insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
              <span>{insight}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
