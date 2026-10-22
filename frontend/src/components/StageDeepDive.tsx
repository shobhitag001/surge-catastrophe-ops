import React from 'react';
import { HourlyRecord, CascadeAnalysis } from '../types';
import { 
  Layers, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon,
  ArrowRight
} from 'lucide-react';

interface StageDeepDiveProps {
  currentRecord: HourlyRecord | null;
  cascadeAnalysis: CascadeAnalysis | null;
  stageCapacities: Record<string, number>;
}

const STAGES = [
  { key: 'FNOL', name: 'FNOL Ingestion', sla: '4.0h', owner: 'Digital App & Call Hotlines', tip: 'Enable automated self-service claim registration via WhatsApp/Web.' },
  { key: 'Validation', name: 'Policy Validation', sla: '8.0h', owner: 'Coverage & Fraud Engine', tip: 'Bypass strict manual underwriting checks for verified active cat policies.' },
  { key: 'Document_Processing', name: 'Document OCR AI', sla: '14.0h', owner: 'Cloud Computer Vision', tip: 'Scale auto-damage photo estimation serverless microservices.' },
  { key: 'Assessment', name: 'Desk Assessment', sla: '24.0h', owner: 'Desk Claims Adjusters', tip: 'Fast-track low-severity auto & retail claims without field inspection.' },
  { key: 'Survey', name: 'Field Inspection', sla: '36.0h', owner: 'Licensed Independent Surveyors', tip: 'Deploy mutual-aid surveyors from non-impacted zones & activate drone surveys.' },
  { key: 'Repair_Authorization', name: 'Repair Authorization', sla: '48.0h', owner: 'Partner Workshop Network', tip: 'Pre-authorize standard part replacement allowances up to ₹50,000.' },
  { key: 'Approval', name: 'Financial Approval', sla: '60.0h', owner: 'Senior Adjusting Authorities', tip: 'Temporarily raise single-signoff limits from ₹2L to ₹10L during red alert.' },
  { key: 'Settlement', name: 'Settlement & Payment', sla: '72.0h', owner: 'Instant Banking / NEFT API', tip: 'Execute batched hourly instant NEFT bank transfers directly to customer accounts.' }
];

export const StageDeepDive: React.FC<StageDeepDiveProps> = ({
  currentRecord,
  cascadeAnalysis,
  stageCapacities
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              8-Tier Claims Lifecycle Operations & SLA Matrix
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Stage-by-stage operational capacities, queue health, dwell times, and recommended operational relief tactics.
          </p>
        </div>

        <span className="text-xs text-slate-400">
          Showing state at: <strong className="text-cyan-400 font-mono">{currentRecord?.label || 'T+00h'}</strong>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3">Stage & Owner</th>
              <th className="py-2.5 px-3">SLA Target</th>
              <th className="py-2.5 px-3">Active Capacity</th>
              <th className="py-2.5 px-3">Current Backlog</th>
              <th className="py-2.5 px-3">Est. Dwell Time</th>
              <th className="py-2.5 px-3">Health Status</th>
              <th className="py-2.5 px-3">Tactical Operations Directive</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {STAGES.map((stg) => {
              const statusData = currentRecord?.stage_statuses?.[stg.key];
              const status = statusData?.status || 'GREEN';
              const backlog = currentRecord?.queues?.[stg.key] || 0;
              const capacity = stageCapacities?.[stg.key] || statusData?.capacity || 10;
              const dwell = statusData?.dwell_hours || 0;
              const isBreached = cascadeAnalysis?.stage_breach_hours?.[stg.key] !== undefined;

              return (
                <tr key={stg.key} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-3">
                    <span className="font-bold text-white block">{stg.name}</span>
                    <span className="text-[10px] text-slate-400">{stg.owner}</span>
                  </td>

                  <td className="py-3 px-3 font-mono font-semibold text-slate-300">
                    &lt; {stg.sla}
                  </td>

                  <td className="py-3 px-3 font-mono text-cyan-300">
                    {capacity.toFixed(1)} / hr
                  </td>

                  <td className="py-3 px-3 font-mono font-bold">
                    <span className={backlog > 25 ? 'text-rose-400' : 'text-slate-200'}>
                      {backlog.toFixed(1)}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono">
                    <span className={dwell > 3 ? 'text-rose-400 font-bold' : dwell > 1.2 ? 'text-amber-400' : 'text-emerald-400'}>
                      {dwell.toFixed(1)} hrs
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      status === 'RED'
                        ? 'bg-rose-950 text-rose-300 border-rose-700'
                        : status === 'AMBER'
                        ? 'bg-amber-950 text-amber-300 border-amber-700'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    }`}>
                      {status === 'RED' ? 'CRITICAL BREACH' : status === 'AMBER' ? 'STRAINED' : 'OPTIMAL'}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-[11px] text-slate-300 max-w-xs">
                    {stg.tip}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
