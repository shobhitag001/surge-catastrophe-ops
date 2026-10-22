import React from 'react';
import { Catastrophe } from '../types';
import { 
  AlertTriangle, 
  Wind, 
  CloudRain, 
  ShieldAlert, 
  Layers, 
  Activity, 
  RefreshCw,
  Clock,
  Compass
} from 'lucide-react';

interface HeaderProps {
  catastrophes: Catastrophe[];
  selectedCatastrophe: Catastrophe | null;
  onSelectCatastrophe: (cat: Catastrophe) => void;
  overallHealthStatus: 'GREEN' | 'AMBER' | 'RED';
  isLoading: boolean;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  catastrophes,
  selectedCatastrophe,
  onSelectCatastrophe,
  overallHealthStatus,
  isLoading,
  onRefresh
}) => {
  const formatCurrency = (val?: number) => {
    if (!val) return '₹0 Cr';
    const crores = val / 10000000;
    return `₹${crores.toFixed(1)} Cr`;
  };

  return (
    <header className="border-b border-slate-800 bg-[#090d16]/95 backdrop-blur sticky top-0 z-50 px-6 py-4">
      <div className="max-w-[1720px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Brand & Event Selector */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center glow-cyan">
              <ShieldAlert className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-wider text-white">SURGE</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  CAT OPS INTELLIGENCE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Predictive Capacity & Cascading Bottleneck Digital Twin
              </p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          {/* Active Catastrophe Selector */}
          <div className="relative">
            <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
              Active Catastrophe Event
            </label>
            <div className="relative">
              <select
                value={selectedCatastrophe?.event_id || ''}
                onChange={(e) => {
                  const found = catastrophes.find(c => c.event_id === e.target.value);
                  if (found) onSelectCatastrophe(found);
                }}
                className="bg-slate-900 text-white font-medium text-sm rounded-lg border border-slate-700 px-3 py-1.5 pr-8 focus:outline-none focus:border-cyan-500 hover:border-slate-600 transition"
              >
                {catastrophes.map((cat) => (
                  <option key={cat.event_id} value={cat.event_id}>
                    {cat.name} ({cat.region})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Real-time Catastrophe Parameters & Exposure Stats */}
        {selectedCatastrophe && (
          <div className="flex flex-wrap items-center gap-3 xl:gap-5 text-xs">
            {/* Intensity & Peril */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-2.5">
              <Wind className="h-4 w-4 text-cyan-400" />
              <div>
                <span className="text-slate-400 block text-[10px]">Hazard Intensity</span>
                <span className="font-semibold text-slate-200">{selectedCatastrophe.intensity}</span>
              </div>
            </div>

            {/* Inundation / Surge */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-2.5">
              <CloudRain className="h-4 w-4 text-blue-400" />
              <div>
                <span className="text-slate-400 block text-[10px]">Rainfall / Surge</span>
                <span className="font-semibold text-slate-200">
                  {selectedCatastrophe.rainfall_mm}mm | {selectedCatastrophe.storm_surge_m}m
                </span>
              </div>
            </div>

            {/* Exposed Policies */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-2.5">
              <Layers className="h-4 w-4 text-indigo-400" />
              <div>
                <span className="text-slate-400 block text-[10px]">Exposed Policies</span>
                <span className="font-semibold text-slate-200">
                  {selectedCatastrophe.total_exposed_policies?.toLocaleString() || '2,800'}
                </span>
              </div>
            </div>

            {/* Expected Claims */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <div>
                <span className="text-slate-400 block text-[10px]">Expected Inflow</span>
                <span className="font-semibold text-amber-300">
                  {selectedCatastrophe.expected_total_claims?.toLocaleString() || '1,141'} Claims
                </span>
              </div>
            </div>

            {/* Total Insured Exposure */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 flex items-center gap-2.5">
              <Compass className="h-4 w-4 text-emerald-400" />
              <div>
                <span className="text-slate-400 block text-[10px]">Total Insured Value</span>
                <span className="font-semibold text-emerald-400 font-mono">
                  {formatCurrency(selectedCatastrophe.total_insured_value)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Operational Health Badge & Actions */}
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 tracking-wide uppercase transition ${
            overallHealthStatus === 'RED'
              ? 'bg-rose-950/70 border-rose-600/50 text-rose-300 glow-red'
              : overallHealthStatus === 'AMBER'
              ? 'bg-amber-950/70 border-amber-600/50 text-amber-300 glow-amber'
              : 'bg-emerald-950/70 border-emerald-600/50 text-emerald-300 glow-emerald'
          }`}>
            <span className={`h-2.5 w-2.5 rounded-full animate-ping ${
              overallHealthStatus === 'RED' ? 'bg-rose-500' : overallHealthStatus === 'AMBER' ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />
            {overallHealthStatus === 'RED' ? 'Critical Deficit' : overallHealthStatus === 'AMBER' ? 'Elevated Backlog' : 'Laminar Flow'}
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition disabled:opacity-50"
            title="Refresh Simulation"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

      </div>
    </header>
  );
};
