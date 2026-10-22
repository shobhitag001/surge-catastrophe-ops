"""
Simulation router: runs discrete-event simulation, what-if scenarios, and bottleneck cascade analysis.
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Catastrophe, Policy, Resource
from app.simulation.demand_engine import forecast_event_demand
from app.simulation.capacity_engine import calculate_stage_capacities, evaluate_initial_capacity_gaps
from app.simulation.des_model import run_discrete_event_simulation
from app.simulation.cascade_engine import analyze_bottlenecks_and_cascades
from app.simulation.state_cache import get_cached_state, set_cached_state

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])

class WhatIfRequest(BaseModel):
    event_id: str
    interventions: Dict[str, int] = Field(
        default_factory=lambda: {
            "adjusters": 0,
            "surveyors": 0,
            "vendors": 0,
            "cloud_workers": 0,
            "call_agents": 0
        }
    )
    simulation_hours: int = 72

def _get_event_context(event_id: str, db: Session):
    cat = db.query(Catastrophe).filter(Catastrophe.event_id == event_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Catastrophe not found")
        
    policies = db.query(Policy).filter(Policy.region == cat.region).all()
    pol_dicts = [
        {"policy_id": p.policy_id, "insured_value": p.insured_value, "product": p.product}
        for p in policies
    ]
    
    cat_dict = {
        "event_id": cat.event_id,
        "name": cat.name,
        "type": cat.type,
        "intensity": cat.intensity,
        "region": cat.region,
        "affected_area_sqkm": cat.affected_area_sqkm,
        "wind_speed_kmh": cat.wind_speed_kmh,
        "rainfall_mm": cat.rainfall_mm,
        "storm_surge_m": cat.storm_surge_m,
        "expected_claim_rate": cat.expected_claim_rate
    }
    
    # Fetch resources for this region or global
    resources = db.query(Resource).filter(
        (Resource.region == cat.region) | (Resource.region == "Global/Cloud") | (Resource.region == "National Call Hub")
    ).all()
    res_dicts = [
        {
            "resource_id": r.resource_id,
            "type": r.type,
            "role": r.role,
            "region": r.region,
            "unit_cost_per_day": r.unit_cost_per_day,
            "hourly_cost": r.hourly_cost,
            "baseline_capacity_per_hour": r.baseline_capacity_per_hour,
            "available_headcount": r.available_headcount
        }
        for r in resources
    ]
    
    return cat_dict, pol_dicts, res_dicts

@router.get("/baseline/{event_id}")
def get_baseline_simulation(event_id: str, db: Session = Depends(get_db)):
    """Runs or retrieves cached baseline DES simulation and cascade analysis."""
    cache_key = f"baseline_{event_id}"
    cached = get_cached_state(cache_key)
    if cached:
        return cached

    cat_dict, pol_dicts, res_dicts = _get_event_context(event_id, db)
    demand = forecast_event_demand(cat_dict, pol_dicts)
    capacity = calculate_stage_capacities(res_dicts, interventions={})
    initial_gaps = evaluate_initial_capacity_gaps(demand, capacity)
    sim_result = run_discrete_event_simulation(demand, capacity)
    cascade_result = analyze_bottlenecks_and_cascades(sim_result)

    response = {
        "event_id": event_id,
        "catastrophe_name": cat_dict["name"],
        "region": cat_dict["region"],
        "demand_summary": {
            "total_exposed_policies": demand["total_exposed_policies"],
            "expected_total_claims": demand["expected_total_claims"],
            "expected_survey_requests": demand["expected_survey_requests"],
            "expected_repair_tickets": demand["expected_repair_tickets"],
            "estimated_gross_loss": demand["estimated_gross_loss"]
        },
        "initial_capacity_gaps": initial_gaps,
        "baseline_capacities": capacity["stage_capacities_per_hour"],
        "baseline_metrics": {
            "peak_backlog": sim_result["peak_backlog"],
            "peak_backlog_hour": sim_result["peak_backlog_hour"],
            "total_claims": sim_result["total_claims"],
            "total_settled": sim_result["total_settled"],
            "mean_settlement_time_hours": sim_result["mean_settlement_time_hours"],
            "sla_breach_pct": sim_result["sla_breach_pct"],
            "sla_breach_count": sim_result["sla_breach_count"],
            "total_operational_cost": sim_result["total_operational_cost"],
            "total_sla_penalties": sim_result["total_sla_penalties"],
            "total_economic_impact": sim_result["total_economic_impact"]
        },
        "cascade_analysis": cascade_result,
        "hourly_timeline": sim_result["hourly_timeline"]
    }
    
    set_cached_state(cache_key, response, ttl_seconds=1800)
    return response

@router.post("/run")
def run_what_if_simulation(req: WhatIfRequest, db: Session = Depends(get_db)):
    """
    Executes a What-If scenario with user-specified resource interventions.
    Compares the result against the baseline simulation.
    """
    cat_dict, pol_dicts, res_dicts = _get_event_context(req.event_id, db)
    demand = forecast_event_demand(cat_dict, pol_dicts, simulation_hours=req.simulation_hours)
    
    # Baseline simulation
    baseline_cap = calculate_stage_capacities(res_dicts, interventions={})
    baseline_sim = run_discrete_event_simulation(demand, baseline_cap, simulation_hours=req.simulation_hours)
    
    # What-If simulation with interventions
    what_if_cap = calculate_stage_capacities(res_dicts, interventions=req.interventions)
    what_if_sim = run_discrete_event_simulation(demand, what_if_cap, simulation_hours=req.simulation_hours)
    what_if_cascade = analyze_bottlenecks_and_cascades(what_if_sim)

    # Compute Deltas
    backlog_red_pct = round(
        ((baseline_sim["peak_backlog"] - what_if_sim["peak_backlog"]) / max(1.0, baseline_sim["peak_backlog"])) * 100, 1
    )
    settlement_accel_hrs = round(
        baseline_sim["mean_settlement_time_hours"] - what_if_sim["mean_settlement_time_hours"], 1
    )
    sla_red_pct = round(
        baseline_sim["sla_breach_pct"] - what_if_sim["sla_breach_pct"], 1
    )
    penalties_saved = round(
        baseline_sim["total_sla_penalties"] - what_if_sim["total_sla_penalties"], 2
    )

    # Additional intervention cost
    intervention_cost = (
        req.interventions.get("adjusters", 0) * 19500.0 +
        req.interventions.get("surveyors", 0) * 36000.0 +
        req.interventions.get("vendors", 0) * 75000.0 +
        req.interventions.get("cloud_workers", 0) * 54000.0 +
        req.interventions.get("call_agents", 0) * 12000.0
    )

    return {
        "event_id": req.event_id,
        "interventions_applied": req.interventions,
        "intervention_cost": round(intervention_cost, 2),
        "stage_capacities": what_if_cap["stage_capacities_per_hour"],
        "baseline_metrics": {
            "peak_backlog": baseline_sim["peak_backlog"],
            "mean_settlement_time_hours": baseline_sim["mean_settlement_time_hours"],
            "sla_breach_pct": baseline_sim["sla_breach_pct"],
            "total_economic_impact": baseline_sim["total_economic_impact"]
        },
        "what_if_metrics": {
            "peak_backlog": what_if_sim["peak_backlog"],
            "mean_settlement_time_hours": what_if_sim["mean_settlement_time_hours"],
            "sla_breach_pct": what_if_sim["sla_breach_pct"],
            "total_settled": what_if_sim["total_settled"],
            "total_economic_impact": what_if_sim["total_economic_impact"]
        },
        "deltas": {
            "backlog_reduction_pct": backlog_red_pct,
            "settlement_acceleration_hours": settlement_accel_hrs,
            "sla_breach_reduction_pct": sla_red_pct,
            "sla_penalties_saved": penalties_saved,
            "net_savings": round(penalties_saved - intervention_cost, 2)
        },
        "cascade_analysis": what_if_cascade,
        "hourly_timeline": what_if_sim["hourly_timeline"]
    }
