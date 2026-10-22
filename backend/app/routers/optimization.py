"""
Optimization router: solves budget-constrained resource allocation using OR-Tools
and returns delta metrics along with narrative explainability.
"""

from typing import Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Catastrophe, Policy, Resource
from app.simulation.demand_engine import forecast_event_demand
from app.optimization.optimizer import solve_resource_allocation
from app.optimization.explainability import generate_optimization_explainability

router = APIRouter(prefix="/api/optimization", tags=["Optimization"])

class OptimizationRequest(BaseModel):
    event_id: str
    budget: float = Field(default=5000000.0, description="Total surge budget in local currency (e.g. INR 50 Lakhs)")
    objective: str = Field(default="sla", description="Objective: 'sla', 'speed', 'cost', or 'customer'")

@router.post("/solve")
def solve_budget_optimization(req: OptimizationRequest, db: Session = Depends(get_db)):
    """
    Executes OR-Tools mixed-integer optimization to recommend the best resource mix
    for a catastrophe event under a fixed operational budget constraint.
    """
    cat = db.query(Catastrophe).filter(Catastrophe.event_id == req.event_id).first()
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

    demand = forecast_event_demand(cat_dict, pol_dicts)
    
    # Run OR-Tools Optimization
    opt_result = solve_resource_allocation(
        demand_forecast=demand,
        resources=res_dicts,
        budget=req.budget,
        objective=req.objective
    )

    # Generate Explainability narrative
    explainability = generate_optimization_explainability(opt_result, cat_dict)

    return {
        "event_id": req.event_id,
        "catastrophe_name": cat_dict["name"],
        **opt_result,
        "explainability": explainability
    }
