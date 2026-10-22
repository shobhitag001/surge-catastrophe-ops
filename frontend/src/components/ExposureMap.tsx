import React from 'react';
import { Catastrophe, PolicySample } from '../types';
import { MapPin, ShieldAlert, Home, Building2, Truck, Store, Layers } from 'lucide-react';

interface ExposureMapProps {
  catastrophe: Catastrophe | null;
  policies: PolicySample[];
}

export const ExposureMap: React.FC<ExposureMapProps> = ({ catastrophe, policies }) => {
  if (!catastrophe) return null;

  // Aggregate product counts
  const productCounts: Record<string, number> = {};
  policies.forEach(p => {
    productCounts[p.product] = (productCounts[p.product] || 0) + 1;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Catastrophe Impact Zone & Exposure Clusters
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Geographic vulnerability & policy asset distribution in {catastrophe.region}.
          </p>
        </div>

        <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
          Radius: {Math.round(Math.sqrt(catastrophe.affected_area_sqkm / Math.PI))} km
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Exposure Zone Stats */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Peril Geography & Impact Area
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Hazard Peril:</span>
              <span className="font-semibold text-white">{catastrophe.type}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Peak Gusts:</span>
              <span className="font-mono text-cyan-400">{catastrophe.wind_speed_kmh} km/h</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Storm Surge:</span>
              <span className="font-mono text-blue-400">{catastrophe.storm_surge_m} meters</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Inundation Footprint:</span>
              <span className="font-mono text-slate-200">{catastrophe.affected_area_sqkm.toLocaleString()} sq km</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Claim Penetration:</span>
              <span className="font-mono text-amber-400 font-bold">
                {Math.round(catastrophe.expected_claim_rate * 100)}% of exposed
              </span>
            </div>
          </div>
        </div>

        {/* Product Portfolio Mix */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Portfolio Asset Distribution
          </h4>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Home className="h-3.5 w-3.5 text-cyan-400" />
                Residential Homes
              </span>
              <span className="font-mono text-cyan-400 font-semibold">
                {productCounts['Residential Property (Home)'] || 42}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-amber-400" />
                Commercial & Industrial
              </span>
              <span className="font-mono text-amber-400 font-semibold">
                {productCounts['Commercial Property & Industrial'] || 20}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-indigo-400" />
                Auto & Fleets
              </span>
              <span className="font-mono text-indigo-400 font-semibold">
                {productCounts['Auto & Commercial Fleet'] || 26}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-purple-400" />
                SME & Retail Business
              </span>
              <span className="font-mono text-purple-400 font-semibold">
                {productCounts['SME Business & Retail Interruption'] || 12}%
              </span>
            </div>
          </div>
        </div>

        {/* Exposed District Hotspots */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Vulnerable Coastal Sectors
          </h4>

          <div className="space-y-1.5">
            {policies.slice(0, 5).map((p, idx) => (
              <div 
                key={idx} 
                className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-200 block">{p.district || 'Coastal District'}</span>
                  <span className="text-[10px] text-slate-400">{p.product}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-emerald-400 block">
                    ₹{(p.insured_value / 100000).toFixed(1)}L
                  </span>
                  <span className="text-[9px] text-rose-400 font-semibold">
                    Vuln: {p.structural_vulnerability}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
