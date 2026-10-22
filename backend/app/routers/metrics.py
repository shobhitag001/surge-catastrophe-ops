"""
Metrics and Resources router: operational inventory and executive control tower summaries.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Resource, Catastrophe, Policy, Claim

router = APIRouter(prefix="/api/metrics", tags=["Metrics"])

@router.get("/resources")
def list_resources(region: str = None, db: Session = Depends(get_db)):
    """Returns baseline resource catalog."""
    query = db.query(Resource)
    if region:
        query = query.filter((Resource.region == region) | (Resource.region == "Global/Cloud") | (Resource.region == "National Call Hub"))
    resources = query.all()
    return [
        {
            "resource_id": r.resource_id,
            "type": r.type,
            "role": r.role,
            "region": r.region,
            "unit_cost_per_day": r.unit_cost_per_day,
            "hourly_cost": r.hourly_cost,
            "baseline_capacity_per_hour": r.baseline_capacity_per_hour,
            "available_headcount": r.available_headcount,
            "max_surge_headcount": r.max_surge_headcount,
            "surge_onboarding_lead_hours": r.surge_onboarding_lead_hours
        }
        for r in resources
    ]

@router.get("/summary")
def get_control_tower_summary(db: Session = Depends(get_db)):
    """Provides high-level health metrics for the control tower top-bar."""
    total_cats = db.query(Catastrophe).count()
    total_policies = db.query(Policy).count()
    total_claims = db.query(Claim).count()
    total_resources = db.query(Resource).count()
    
    # Active catastrophe (default to first active event)
    active_cat = db.query(Catastrophe).first()
    
    return {
        "active_catastrophe": {
            "event_id": active_cat.event_id if active_cat else "CAT-2026-01",
            "name": active_cat.name if active_cat else "Cyclone Tauktae",
            "region": active_cat.region if active_cat else "Coastal Maharashtra & Mumbai",
            "intensity": active_cat.intensity if active_cat else "Category 4",
            "status": "RED_ALERT"
        },
        "system_status": "ONLINE",
        "total_catastrophes": total_cats,
        "monitored_policies": total_policies,
        "historical_claims": total_claims,
        "registered_resources": total_resources,
        "operational_readiness": "CRITICAL_BOTTLENECK_DETECTED"
    }
