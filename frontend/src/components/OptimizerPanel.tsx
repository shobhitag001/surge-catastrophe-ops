import React, { useState } from 'react';
import { Sparkles, Cpu, Target, Check, IndianRupee, ShieldCheck } from 'lucide-react';
import { Interventions } from '../types';

interface OptimizerPanelProps {
  onOptimize: (budget: number, objective: string) => void;
  isLoading: boolean;
  recommendedResources?: Interventions;
  budgetUtilized?: number;
  solverName?: string;
}

const OBJECTIVES = [
  { id: 'sla', label: 'SLA Optimized', desc: 'Minimize regulatory SLA breach % and penalty liability' },
  { id: 'speed', label: 'Speed Optimized', desc: 'Accelerate mean cycle time to final settlement' },
  { id: 'cost', label: 'Cost Optimized', desc: 'Minimize total operational and delay costs' },
  { id: 'customer', label: 'Customer First', desc: 'Prioritize prompt contact, intake & triage' }
];

const BUDGET_PRESETS = [
  { label: '₹25 Lakhs', value: 2500000 },
  { label: '₹50 Lakhs', value: 5000000 },
  { label: '₹1 Crore', value: 10000000 },
  { label: '₹2.5 Crore', value: 25000000 }
];

export const OptimizerPanel: React.FC<OptimizerPanelProps> = ({
  onOptimize,
  isLoading,
  recommendedResources,
  budgetUtilized,
  solverName
}) => {
  const [budget, setBudget] = useState<number>(5000000);
  const [objective, setObjective] = useState<string>('sla');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              OR-Tools Budget Optimization Engine
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
            {solverName || 'OR-Tools SCIP MILP'}
          </span>
        </div>

        <p className="text-xs text-slate-400 mt-2">
          Finds the mathematically optimal mix of human, vendor, and technical resources given a fixed catastrophe budget constraint.
        </p>

        {/* Budget Input & Presets */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
            <span>Operational Budget Constraint</span>
            <span className="font-mono text-cyan-400 text-sm font-bold">
              ₹{(budget / 100000).toFixed(1)} Lakhs
            </span>
          </label>

          <div className="flex items-center gap-2 mb-2">
            <input
              type="range"
              min="1000000"
              max="25000000"
              step="500000"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer h-2"
            />
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {BUDGET_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setBudget(preset.value)}
                className={`text-[11px] py-1 rounded border font-medium transition ${
                  budget === preset.value
                    ? 'bg-indigo-950 border-indigo-500 text-indigo-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Optimization Objective Selector */}
        <div className="mt-5">
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Optimization Objective
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {OBJECTIVES.map((obj) => (
              <div
                key={obj.id}
                onClick={() => setObjective(obj.id)}
                className={`p-2.5 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                  objective === obj.id
                    ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${objective === obj.id ? 'text-indigo-300' : 'text-slate-300'}`}>
                    {obj.label}
                  </span>
                  {objective === obj.id && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{obj.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Mix Pills (if available) */}
        {recommendedResources && (
          <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-300">Optimal Deployment Mix:</span>
              <span className="text-[10px] text-slate-400">
                Utilized: <strong className="text-emerald-400 font-mono">₹{((budgetUtilized || 0) / 100000).toFixed(1)}L</strong>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-mono">
                +{recommendedResources.surveyors} Surveyors
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono">
                +{recommendedResources.vendors} Vendors
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono">
                +{recommendedResources.adjusters} Adjusters
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-mono">
                +{recommendedResources.cloud_workers} AI Tiers
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono">
                +{recommendedResources.call_agents} Call Staff
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="mt-5 pt-4 border-t border-slate-800">
        <button
          onClick={() => onOptimize(budget, objective)}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-cyan transition disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          <span>{isLoading ? 'Solving Mathematical Model...' : 'Solve with Google OR-Tools'}</span>
        </button>
      </div>
    </div>
  );
};
