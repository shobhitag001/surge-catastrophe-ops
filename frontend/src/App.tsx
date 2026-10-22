import React, { useState, useEffect } from 'react';
import { 
  Catastrophe, 
  BaselineSimulationResponse, 
  WhatIfResponse, 
  OptimizationResponse, 
  PolicySample,
  Interventions 
} from './types';
import { 
  fetchCatastrophes, 
  fetchBaselineSimulation, 
  runWhatIfSimulation, 
  runOptimization, 
  fetchCatastrophePolicies 
} from './services/api';

import { Header } from './components/Header';
import { TimelineView } from './components/TimelineView';
import { BacklogChart } from './components/BacklogChart';
import { SettlementThroughputChart } from './components/SettlementThroughputChart';
import { CascadeGraph } from './components/CascadeGraph';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { OptimizerPanel } from './components/OptimizerPanel';
import { DeltaComparisonBar } from './components/DeltaComparisonBar';
import { ExplainabilityCard } from './components/ExplainabilityCard';
import { StageDeepDive } from './components/StageDeepDive';
import { ExposureMap } from './components/ExposureMap';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [catastrophes, setCatastrophes] = useState<Catastrophe[]>([]);
  const [selectedCatastrophe, setSelectedCatastrophe] = useState<Catastrophe | null>(null);
  const [policies, setPolicies] = useState<PolicySample[]>([]);
  
  const [baselineData, setBaselineData] = useState<BaselineSimulationResponse | null>(null);
  const [whatIfData, setWhatIfData] = useState<WhatIfResponse | null>(null);
  const [optimizationData, setOptimizationData] = useState<OptimizationResponse | null>(null);

  const [selectedHour, setSelectedHour] = useState<number>(18);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const [interventions, setInterventions] = useState<Interventions>({
    adjusters: 0,
    surveyors: 0,
    vendors: 0,
    cloud_workers: 0,
    call_agents: 0
  });

  // 1. Initial Load: Catastrophes Catalog
  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        const cats = await fetchCatastrophes();
        setCatastrophes(cats);
        if (cats.length > 0) {
          const defaultCat = cats[0];
          setSelectedCatastrophe(defaultCat);
          await loadEventData(defaultCat.event_id);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // 2. Load Event Simulation & Policies
  const loadEventData = async (eventId: string) => {
    try {
      setIsLoading(true);
      const [baseSim, pols] = await Promise.all([
        fetchBaselineSimulation(eventId),
        fetchCatastrophePolicies(eventId, 60)
      ]);
      setBaselineData(baseSim);
      setPolicies(pols);
      setWhatIfData(null);
      setOptimizationData(null);
      setInterventions({
        adjusters: 0,
        surveyors: 0,
        vendors: 0,
        cloud_workers: 0,
        call_agents: 0
      });
      setSelectedHour(baseSim.cascade_analysis.primary_bottleneck?.time_to_breach_hours || 18);
    } catch (err) {
      console.error('Failed to load event data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCatastrophe = async (cat: Catastrophe) => {
    setSelectedCatastrophe(cat);
    await loadEventData(cat.event_id);
  };

  // 3. Run What-If Simulation
  const handleSimulateWhatIf = async () => {
    if (!selectedCatastrophe) return;
    try {
      setIsSimulating(true);
      const result = await runWhatIfSimulation(selectedCatastrophe.event_id, interventions);
      setWhatIfData(result);
      setOptimizationData(null); // Clear optimization view when manual what-if is run
    } catch (err) {
      console.error('What-If simulation failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // 4. Run OR-Tools Optimization
  const handleRunOptimization = async (budget: number, objective: string) => {
    if (!selectedCatastrophe) return;
    try {
      setIsSimulating(true);
      const result = await runOptimization(selectedCatastrophe.event_id, budget, objective);
      setOptimizationData(result);
      // Synchronize sliders with the optimal recommended resources
      setInterventions(result.recommended_resources);
      setWhatIfData(null);
    } catch (err) {
      console.error('Optimization failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // 5. Reset to Baseline
  const handleReset = () => {
    setInterventions({
      adjusters: 0,
      surveyors: 0,
      vendors: 0,
      cloud_workers: 0,
      call_agents: 0
    });
    setWhatIfData(null);
    setOptimizationData(null);
  };

  // Active state determination (Optimization takes priority if run, then What-If, else Baseline)
  const isInterventionActive = !!(whatIfData || optimizationData);
  const activeTimeline = optimizationData?.hourly_timeline_optimized || whatIfData?.hourly_timeline || baselineData?.hourly_timeline || [];
  const currentRecord = activeTimeline[selectedHour] || activeTimeline[0] || null;
  const activeCascade = optimizationData ? baselineData?.cascade_analysis : (whatIfData?.cascade_analysis || baselineData?.cascade_analysis);
  const activeCapacities = whatIfData?.stage_capacities || baselineData?.baseline_capacities || {};

  // Active Metrics for the Delta Bar
  const activeMetrics = optimizationData?.optimized_metrics || whatIfData?.what_if_metrics || baselineData?.baseline_metrics || {
    peak_backlog: 0,
    mean_settlement_time_hours: 0,
    sla_breach_pct: 0,
    total_economic_impact: 0
  };

  const activeDeltas = optimizationData?.delta_metrics || whatIfData?.deltas;

  // Determine overall health status
  const overallHealth = activeMetrics.sla_breach_pct > 35 
    ? 'RED' 
    : activeMetrics.sla_breach_pct > 18 
    ? 'AMBER' 
    : 'GREEN';

  if (isLoading && !baselineData) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center text-white">
        <Loader2 className="h-10 w-10 text-cyan-400 animate-spin mb-4" />
        <h2 className="text-lg font-bold tracking-wider uppercase">SURGE Control Tower</h2>
        <p className="text-xs text-slate-400 mt-1 font-mono">Initializing Discrete-Event Simulation & Mathematical Model...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans pb-16 selection:bg-cyan-500 selection:text-slate-950">
      
      {/* 1. Executive Top Banner */}
      <Header
        catastrophes={catastrophes}
        selectedCatastrophe={selectedCatastrophe}
        onSelectCatastrophe={handleSelectCatastrophe}
        overallHealthStatus={overallHealth}
        isLoading={isLoading || isSimulating}
        onRefresh={() => selectedCatastrophe && loadEventData(selectedCatastrophe.event_id)}
      />

      <main className="max-w-[1720px] mx-auto px-6 mt-6 space-y-6 w-full">
        
        {/* 2. Comparative Delta Metrics Cards */}
        {baselineData && (
          <DeltaComparisonBar
            baselineMetrics={baselineData.baseline_metrics}
            activeMetrics={activeMetrics}
            deltas={activeDeltas}
            isModified={isInterventionActive}
          />
        )}

        {/* 3. Hourly Heatmap Timeline View (T+0 to T+72h) */}
        {baselineData && (
          <TimelineView
            timeline={activeTimeline}
            cascadeAnalysis={activeCascade || null}
            selectedHour={selectedHour}
            onSelectHour={setSelectedHour}
          />
        )}

        {/* 4. Interactive Simulation & Optimization Engines Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Interventions & OR-Tools Solver (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <WhatIfSimulator
              interventions={interventions}
              onChangeInterventions={setInterventions}
              onSimulate={handleSimulateWhatIf}
              onReset={handleReset}
              isLoading={isSimulating}
            />

            <OptimizerPanel
              onOptimize={handleRunOptimization}
              isLoading={isSimulating}
              recommendedResources={optimizationData?.recommended_resources}
              budgetUtilized={optimizationData?.budget_utilized}
              solverName={optimizationData?.solver}
            />
          </div>

          {/* Right Column: Interactive Charts (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <BacklogChart
              timeline={activeTimeline}
              comparisonTimeline={baselineData?.hourly_timeline}
              isComparing={isInterventionActive}
            />

            <SettlementThroughputChart
              baselineTimeline={baselineData?.hourly_timeline || []}
              activeTimeline={activeTimeline}
              isInterventionActive={isInterventionActive}
            />
          </div>
        </div>

        {/* 5. Executive Explainability Block */}
        {optimizationData?.explainability && (
          <ExplainabilityCard explainability={optimizationData.explainability} />
        )}

        {/* 6. Digital Twin Topological Node Graph */}
        <CascadeGraph
          cascadeAnalysis={activeCascade || null}
          currentRecord={currentRecord}
        />

        {/* 7. Detailed 8-Stage Operational Health Table */}
        <StageDeepDive
          currentRecord={currentRecord}
          cascadeAnalysis={activeCascade || null}
          stageCapacities={activeCapacities}
        />

        {/* 8. Geographic Exposure & Vulnerability Footprint */}
        <ExposureMap
          catastrophe={selectedCatastrophe}
          policies={policies}
        />

      </main>
    </div>
  );
};

export default App;
