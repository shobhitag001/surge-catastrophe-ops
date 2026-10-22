export interface Catastrophe {
  event_id: string;
  name: string;
  type: string;
  intensity: string;
  region: string;
  affected_area_sqkm: number;
  start_time: string;
  wind_speed_kmh: number;
  rainfall_mm: number;
  storm_surge_m: number;
  expected_claim_rate: number;
  description: string;
  total_exposed_policies?: number;
  total_insured_value?: number;
  estimated_gross_loss?: number;
  expected_total_claims?: number;
  expected_survey_requests?: number;
  expected_repair_tickets?: number;
}

export interface Resource {
  resource_id: string;
  type: string;
  role: string;
  region: string;
  unit_cost_per_day: number;
  hourly_cost: number;
  baseline_capacity_per_hour: number;
  available_headcount: number;
  max_surge_headcount: number;
  surge_onboarding_lead_hours: number;
}

export interface Interventions {
  adjusters: number;
  surveyors: number;
  vendors: number;
  cloud_workers: number;
  call_agents: number;
}

export interface StageStatus {
  status: 'GREEN' | 'AMBER' | 'RED';
  backlog: number;
  dwell_hours: number;
  capacity: number;
}

export interface HourlyRecord {
  hour: number;
  label: string;
  total_backlog: number;
  settled_claims: number;
  hourly_settled: number;
  stage_statuses: Record<string, StageStatus>;
  queues: Record<string, number>;
  cumulative_cost: number;
  cumulative_penalty: number;
  total_financial_impact: number;
}

export interface PrimaryBottleneck {
  stage: string;
  time_to_breach_hours: number;
  label: string;
  peak_backlog: number;
  severity: string;
  root_cause: string;
  description: string;
}

export interface CascadingBottleneck {
  stage: string;
  time_to_breach_hours: number;
  label: string;
  delay_from_primary_hours: number;
  peak_backlog: number;
  severity: string;
  cascade_trigger: string;
  description: string;
}

export interface CascadeGraphNode {
  id: string;
  label: string;
  breach_hour?: number | null;
}

export interface CascadeGraphEdge {
  from: string;
  to: string;
  type: string;
  share?: string;
}

export interface CascadeAnalysis {
  primary_bottleneck: PrimaryBottleneck | null;
  cascading_bottlenecks: CascadingBottleneck[];
  stage_breach_hours: Record<string, number>;
  stage_peak_backlogs: Record<string, number>;
  cascade_graph: {
    nodes: CascadeGraphNode[];
    edges: CascadeGraphEdge[];
  };
  narrative_insights: string[];
}

export interface BaselineMetrics {
  peak_backlog: number;
  peak_backlog_hour: number;
  total_claims?: number;
  total_settled?: number;
  mean_settlement_time_hours: number;
  sla_breach_pct: number;
  sla_breach_count?: number;
  total_operational_cost?: number;
  total_sla_penalties?: number;
  total_economic_impact: number;
}

export interface BaselineSimulationResponse {
  event_id: string;
  catastrophe_name: string;
  region: string;
  demand_summary: {
    total_exposed_policies: number;
    expected_total_claims: number;
    expected_survey_requests: number;
    expected_repair_tickets: number;
    estimated_gross_loss: number;
  };
  initial_capacity_gaps: Array<{
    stage: string;
    resource: string;
    capacity_per_hour: number;
    peak_demand_per_hour: number;
    deficit_pct: number;
    severity: string;
    risk: string;
  }>;
  baseline_capacities: Record<string, number>;
  baseline_metrics: BaselineMetrics;
  cascade_analysis: CascadeAnalysis;
  hourly_timeline: HourlyRecord[];
}

export interface WhatIfResponse {
  event_id: string;
  interventions_applied: Interventions;
  intervention_cost: number;
  stage_capacities: Record<string, number>;
  baseline_metrics: BaselineMetrics;
  what_if_metrics: {
    peak_backlog: number;
    mean_settlement_time_hours: number;
    sla_breach_pct: number;
    total_settled: number;
    total_economic_impact: number;
  };
  deltas: {
    backlog_reduction_pct: number;
    settlement_acceleration_hours: number;
    sla_breach_reduction_pct: number;
    sla_penalties_saved: number;
    net_savings: number;
  };
  cascade_analysis: CascadeAnalysis;
  hourly_timeline: HourlyRecord[];
}

export interface ExplainabilityPillar {
  pillar: string;
  finding: string;
  impact: string;
}

export interface Explainability {
  headline: string;
  core_narrative: string;
  key_takeaways: ExplainabilityPillar[];
  tradeoff_analysis: string;
  budget_breakdown: Record<string, { count: number; cost: number; pct: number }>;
}

export interface OptimizationResponse {
  event_id: string;
  catastrophe_name: string;
  solver: string;
  objective: string;
  budget_allocated: number;
  budget_utilized: number;
  budget_utilization_pct: number;
  recommended_resources: Interventions;
  baseline_metrics: BaselineMetrics;
  optimized_metrics: {
    peak_backlog: number;
    peak_backlog_hour: number;
    mean_settlement_time_hours: number;
    sla_breach_pct: number;
    total_operational_cost: number;
    total_sla_penalties: number;
    total_economic_impact: number;
  };
  delta_metrics: {
    backlog_reduction_pct: number;
    settlement_acceleration_hours: number;
    sla_breach_reduction_pct: number;
    sla_penalties_saved: number;
    net_economic_savings: number;
    roi_ratio: number;
  };
  explainability: Explainability;
  hourly_timeline_optimized: HourlyRecord[];
}

export interface PolicySample {
  policy_id: string;
  product: string;
  district: string;
  latitude: number;
  longitude: number;
  insured_value: number;
  coverage: string;
  structural_vulnerability: number;
}
