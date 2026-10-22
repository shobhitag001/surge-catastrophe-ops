import React from 'react';
import { Interventions } from '../types';
import { Sliders, Play, RotateCcw, UserPlus, Users, Wrench, Cloud, PhoneCall } from 'lucide-react';

interface WhatIfSimulatorProps {
  interventions: Interventions;
  onChangeInterventions: (interventions: Interventions) => void;
  onSimulate: () => void;
  onReset: () => void;
  isLoading: boolean;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  interventions,
  onChangeInterventions,
  onSimulate,
  onReset,
  isLoading
}) => {
  const updateField = (field: keyof Interventions, val: number) => {
    onChangeInterventions({
      ...interventions,
      [field]: Math.max(0, val)
    });
  };

  // Estimated 3-day surge cost in INR
  const estimatedCost = (
    interventions.adjusters * 19500 +
    interventions.surveyors * 36000 +
    interventions.vendors * 75000 +
    interventions.cloud_workers * 54000 +
    interventions.call_agents * 12000
  );

  const applyPreset = (preset: 'surveyor' | 'balanced' | 'vendor') => {
    if (preset === 'surveyor') {
      onChangeInterventions({
        adjusters: 15,
        surveyors: 35,
        vendors: 10,
        cloud_workers: 1,
        call_agents: 20
      });
    } else if (preset === 'balanced') {
      onChangeInterventions({
        adjusters: 25,
        surveyors: 25,
        vendors: 12,
        cloud_workers: 2,
        call_agents: 30
      });
    } else if (preset === 'vendor') {
      onChangeInterventions({
        adjusters: 10,
        surveyors: 20,
        vendors: 20,
        cloud_workers: 1,
        call_agents: 15
      });
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              What-If Resource Interventions
            </h3>
          </div>
          <button
            onClick={onReset}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-2">
          Manually tweak additional headcount and technical capacity to dynamically simulate bottleneck relief.
        </p>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-[10px] uppercase font-bold text-slate-500">Presets:</span>
          <button
            onClick={() => applyPreset('surveyor')}
            className="text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:border-cyan-500 transition"
          >
            Surveyor Focus (+35)
          </button>
          <button
            onClick={() => applyPreset('balanced')}
            className="text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:border-cyan-500 transition"
          >
            Balanced Surge
          </button>
          <button
            onClick={() => applyPreset('vendor')}
            className="text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:border-cyan-500 transition"
          >
            Repair Vendor Scale (+20)
          </button>
        </div>

        {/* Sliders Grid */}
        <div className="space-y-4 mt-5">
          {/* Field Surveyors */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-rose-400" />
                Additional Field Surveyors
              </span>
              <span className="font-mono font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                +{interventions.surveyors}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={interventions.surveyors}
              onChange={(e) => updateField('surveyors', parseInt(e.target.value))}
              className="w-full accent-rose-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0 (Baseline)</span>
              <span>₹12,000/day</span>
              <span>+60 Surveyors</span>
            </div>
          </div>

          {/* Desk Claims Adjusters */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <UserPlus className="h-4 w-4 text-cyan-400" />
                Additional Desk Adjusters
              </span>
              <span className="font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                +{interventions.adjusters}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              value={interventions.adjusters}
              onChange={(e) => updateField('adjusters', parseInt(e.target.value))}
              className="w-full accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0 (Baseline)</span>
              <span>₹6,500/day</span>
              <span>+80 Adjusters</span>
            </div>
          </div>

          {/* Repair Network Partner Vendors */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Wrench className="h-4 w-4 text-amber-400" />
                Additional Repair Vendor Slots
              </span>
              <span className="font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                +{interventions.vendors}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              value={interventions.vendors}
              onChange={(e) => updateField('vendors', parseInt(e.target.value))}
              className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0 (Baseline)</span>
              <span>₹25,000/day</span>
              <span>+30 Vendor Slots</span>
            </div>
          </div>

          {/* Cloud OCR & Document AI */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Cloud className="h-4 w-4 text-purple-400" />
                Cloud OCR & Document AI Clusters
              </span>
              <span className="font-mono font-bold text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800">
                +{interventions.cloud_workers}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="6"
              value={interventions.cloud_workers}
              onChange={(e) => updateField('cloud_workers', parseInt(e.target.value))}
              className="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0 (Baseline)</span>
              <span>₹18,000/day</span>
              <span>+6 Clusters</span>
            </div>
          </div>

          {/* Call Center Intake Agents */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <PhoneCall className="h-4 w-4 text-emerald-400" />
                Emergency Inbound Call Agents
              </span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                +{interventions.call_agents}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              value={interventions.call_agents}
              onChange={(e) => updateField('call_agents', parseInt(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0 (Baseline)</span>
              <span>₹4,000/day</span>
              <span>+80 Agents</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="mt-5 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="text-slate-400">Est. 72h Surge Budget:</span>
          <span className="font-mono font-bold text-cyan-300 text-sm">
            ₹{(estimatedCost / 100000).toFixed(2)} Lakhs
          </span>
        </div>

        <button
          onClick={onSimulate}
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-cyan transition disabled:opacity-50"
        >
          <Play className="h-4 w-4 fill-slate-950" />
          <span>{isLoading ? 'Simulating Digital Twin...' : 'Simulate Intervention (DES)'}</span>
        </button>
      </div>
    </div>
  );
};
