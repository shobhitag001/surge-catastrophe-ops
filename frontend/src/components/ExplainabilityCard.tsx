import React from 'react';
import { Explainability } from '../types';
import { 
  Lightbulb, 
  HelpCircle, 
  CheckCircle2, 
  TrendingUp, 
  PieChart, 
  ShieldCheck,
  Scale
} from 'lucide-react';

interface ExplainabilityCardProps {
  explainability: Explainability | null;
}

export const ExplainabilityCard: React.FC<ExplainabilityCardProps> = ({ explainability }) => {
  if (!explainability) return null;

  const budget = explainability.budget_breakdown || {};

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
      {/* Background glowing gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center glow-cyan">
            <Lightbulb className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              Optimization Explainability & Decision Intelligence
            </h3>
            <p className="text-xs text-slate-400">
              Mathematical rationale and sensitivity analysis justifying the recommended deployment mix.
            </p>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono font-semibold">
          Explainable AI (XAI)
        </span>
      </div>

      {/* Executive Headline & Core Narrative */}
      <div className="mt-5 space-y-3">
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 to-slate-950 border border-indigo-800/40">
          <p className="text-sm font-semibold text-indigo-200 leading-relaxed">
            {explainability.headline}
          </p>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {explainability.core_narrative}
        </p>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-5">
        {explainability.key_takeaways.map((item, idx) => (
          <div 
            key={idx}
            className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <h4 className="text-xs font-bold text-slate-100">{item.pillar}</h4>
            </div>
            <p className="text-[11px] font-semibold text-cyan-400 mb-1">{item.finding}</p>
            <p className="text-[11px] text-slate-400 leading-normal">{item.impact}</p>
          </div>
        ))}
      </div>

      {/* Trade-off Analysis */}
      <div className="mt-5 p-3.5 rounded-lg bg-slate-950 border border-amber-900/30 flex items-start gap-3">
        <Scale className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-amber-300">Operational Trade-Off Rationale</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {explainability.tradeoff_analysis}
          </p>
        </div>
      </div>

      {/* Budget Allocation Breakdown Bar */}
      <div className="mt-5 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-slate-300">Surge Budget Utilization Breakdown:</span>
          <span className="text-slate-400 text-[11px]">Calculated over 72-hour operational window</span>
        </div>

        <div className="h-3 w-full rounded-full bg-slate-800 flex overflow-hidden">
          {budget.surveyors && budget.surveyors.pct > 0 && (
            <div 
              style={{ width: `${budget.surveyors.pct}%` }} 
              className="bg-rose-500 h-full" 
              title={`Surveyors: ${budget.surveyors.pct}% (₹${(budget.surveyors.cost / 100000).toFixed(1)}L)`}
            />
          )}
          {budget.vendors && budget.vendors.pct > 0 && (
            <div 
              style={{ width: `${budget.vendors.pct}%` }} 
              className="bg-amber-500 h-full" 
              title={`Vendors: ${budget.vendors.pct}% (₹${(budget.vendors.cost / 100000).toFixed(1)}L)`}
            />
          )}
          {budget.adjusters && budget.adjusters.pct > 0 && (
            <div 
              style={{ width: `${budget.adjusters.pct}%` }} 
              className="bg-cyan-500 h-full" 
              title={`Adjusters: ${budget.adjusters.pct}% (₹${(budget.adjusters.cost / 100000).toFixed(1)}L)`}
            />
          )}
          {budget.cloud_workers && budget.cloud_workers.pct > 0 && (
            <div 
              style={{ width: `${budget.cloud_workers.pct}%` }} 
              className="bg-purple-500 h-full" 
              title={`Cloud AI: ${budget.cloud_workers.pct}%`}
            />
          )}
          {budget.call_agents && budget.call_agents.pct > 0 && (
            <div 
              style={{ width: `${budget.call_agents.pct}%` }} 
              className="bg-emerald-500 h-full" 
              title={`Call Staff: ${budget.call_agents.pct}%`}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span>Surveyors ({budget.surveyors?.pct || 0}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>Vendors ({budget.vendors?.pct || 0}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
            <span>Adjusters ({budget.adjusters?.pct || 0}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
            <span>AI Tiers ({budget.cloud_workers?.pct || 0}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>Call Agents ({budget.call_agents?.pct || 0}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
