"""
Catastrophes router: list events, retrieve details, and query exposure.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Catastrophe, Policy, Claim
from app.simulation.demand_engine import forecast_event_demand

router = APIRouter(prefix="/api/catastrophes", tags=["Catastrophes"])

@router.get("/")
def list_catastrophes(db: Session = Depends(get_db)):
    """Returns all active catastrophe events with summary exposure."""
    cats = db.query(Catastrophe).all()
    results = []
    
    for c in cats:
        policies = db.query(Policy).filter(Policy.region == c.region).all()
        pol_dicts = [
            {"policy_id": p.policy_id, "insured_value": p.insured_value, "product": p.product}
            for p in policies
        ]
        
        c_dict = {
            "event_id": c.event_id,
            "name": c.name,
            "type": c.type,
            "intensity": c.intensity,
            "region": c.region,
            "affected_area_sqkm": c.affected_area_sqkm,
            "start_time": c.start_time.isoformat() if c.start_time else None,
            "wind_speed_kmh": c.wind_speed_kmh,
            "rainfall_mm": c.rainfall_mm,
            "storm_surge_m": c.storm_surge_m,
            "expected_claim_rate": c.expected_claim_rate,
            "description": c.description
        }
        
        demand = forecast_event_demand(c_dict, pol_dicts)
        
        results.append({
            **c_dict,
            "total_exposed_policies": len(policies),
            "total_insured_value": demand["total_insured_value"],
            "estimated_gross_loss": demand["estimated_gross_loss"],
            "expected_total_claims": demand["expected_total_claims"],
            "expected_survey_requests": demand["expected_survey_requests"],
            "expected_repair_tickets": demand["expected_repair_tickets"]
        })
        
    return results

@router.get("/{event_id}")
def get_catastrophe(event_id: str, db: Session = Depends(get_db)):
    """Returns details for a single catastrophe event."""
    cat = db.query(Catastrophe).filter(Catastrophe.event_id == event_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Catastrophe not found")
        
    policies = db.query(Policy).filter(Policy.region == cat.region).all()
    pol_dicts = [
        {"policy_id": p.policy_id, "insured_value": p.insured_value, "product": p.product}
        for p in policies
    ]
    
    c_dict = {
        "event_id": cat.event_id,
        "name": cat.name,
        "type": cat.type,
        "intensity": cat.intensity,
        "region": cat.region,
        "affected_area_sqkm": cat.affected_area_sqkm,
        "start_time": cat.start_time.isoformat() if cat.start_time else None,
        "wind_speed_kmh": cat.wind_speed_kmh,
        "rainfall_mm": cat.rainfall_mm,
        "storm_surge_m": cat.storm_surge_m,
        "expected_claim_rate": cat.expected_claim_rate,
        "description": cat.description
    }
    
    demand = forecast_event_demand(c_dict, pol_dicts)
    return {
        **c_dict,
        "exposure_summary": demand
    }

@router.get("/{event_id}/policies")
def get_catastrophe_policies(event_id: str, limit: int = 150, db: Session = Depends(get_db)):
    """Returns sample exposed policies for map visualization."""
    cat = db.query(Catastrophe).filter(Catastrophe.event_id == event_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Catastrophe not found")
        
    policies = db.query(Policy).filter(Policy.region == cat.region).limit(limit).all()
    return [
        {
            "policy_id": p.policy_id,
            "product": p.product,
            "district": p.district,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "insured_value": p.insured_value,
            "coverage": p.coverage,
            "structural_vulnerability": p.structural_vulnerability
        }
        for p in policies
    ]
