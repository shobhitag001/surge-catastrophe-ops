import { 
  Catastrophe, 
  BaselineSimulationResponse, 
  WhatIfResponse, 
  OptimizationResponse, 
  Resource, 
  PolicySample,
  Interventions 
} from '../types';

const API_BASE = '/api';

export async function fetchCatastrophes(): Promise<Catastrophe[]> {
  const res = await fetch(`${API_BASE}/catastrophes/`);
  if (!res.ok) throw new Error('Failed to load catastrophes');
  return res.json();
}

export async function fetchCatastrophe(id: string): Promise<Catastrophe & { exposure_summary: any }> {
  const res = await fetch(`${API_BASE}/catastrophes/${id}`);
  if (!res.ok) throw new Error(`Failed to load catastrophe ${id}`);
  return res.json();
}

export async function fetchCatastrophePolicies(id: string, limit = 100): Promise<PolicySample[]> {
  const res = await fetch(`${API_BASE}/catastrophes/${id}/policies?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to load catastrophe policies');
  return res.json();
}

export async function fetchBaselineSimulation(id: string): Promise<BaselineSimulationResponse> {
  const res = await fetch(`${API_BASE}/simulation/baseline/${id}`);
  if (!res.ok) throw new Error('Failed to load baseline simulation');
  return res.json();
}

export async function runWhatIfSimulation(
  eventId: string, 
  interventions: Interventions, 
  simulationHours = 72
): Promise<WhatIfResponse> {
  const res = await fetch(`${API_BASE}/simulation/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_id: eventId,
      interventions,
      simulation_hours: simulationHours
    })
  });
  if (!res.ok) throw new Error('What-If simulation failed');
  return res.json();
}

export async function runOptimization(
  eventId: string,
  budget: number,
  objective: string
): Promise<OptimizationResponse> {
  const res = await fetch(`${API_BASE}/optimization/solve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_id: eventId,
      budget,
      objective
    })
  });
  if (!res.ok) throw new Error('Optimization failed');
  return res.json();
}

export async function fetchResources(region?: string): Promise<Resource[]> {
  const url = region ? `${API_BASE}/metrics/resources?region=${encodeURIComponent(region)}` : `${API_BASE}/metrics/resources`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load resources');
  return res.json();
}

export async function fetchSummary(): Promise<any> {
  const res = await fetch(`${API_BASE}/metrics/summary`);
  if (!res.ok) throw new Error('Failed to load control tower summary');
  return res.json();
}
