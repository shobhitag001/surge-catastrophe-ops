"""
Layer 2: Capacity Forecasting Layer
Compares expected demand against baseline available resources:
- Adjusters, Surveyors, Repair Vendors, Cloud Workers, Call Agents
Maps them to the 8 lifecycle stages and flags static capacity deficits.
"""

from typing import Dict, List, Any

# Standard 8 Claims Lifecycle Stages
STAGES = [
    "FNOL",
    "Validation",
    "Document_Processing",
    "Assessment",
    "Survey",
    "Repair_Authorization",
    "Approval",
    "Settlement"
]

def calculate_stage_capacities(
    resources: List[Dict[str, Any]],
    interventions: Dict[str, int] = None
) -> Dict[str, Any]:
    """
    Computes effective processing capacity per hour across all 8 stages,
    incorporating any active resource interventions/modifications.
    
    interventions dict example:
    {
        "adjusters": 15,    # additional adjusters
        "surveyors": 30,    # additional surveyors
        "vendors": 5,       # additional repair network slots
        "cloud_workers": 2, # additional OCR/AI tiers
        "call_agents": 25   # additional call hotline staff
    }
    """
    interventions = interventions or {}
    
    # Aggregate baseline headcounts and capacities
    adjuster_headcount = 0
    adjuster_rate = 1.4  # claims/hour
    
    surveyor_headcount = 0
    surveyor_rate = 0.35  # inspections/hour
    
    vendor_headcount = 0
    vendor_rate = 0.75  # repair authorizations/hour
    
    cloud_tier = 0
    cloud_rate = 80.0  # documents/hour per tier
    
    call_headcount = 0
    call_rate = 4.5  # calls/hour per agent
    
    costs = {
        "adjuster_hourly": 750.0,
        "surveyor_hourly": 1400.0,
        "vendor_hourly": 3000.0,
        "cloud_hourly": 2250.0,
        "call_hourly": 500.0
    }
    
    for r in resources:
        r_type = r.get("type")
        count = r.get("available_headcount", 0)
        rate = r.get("baseline_capacity_per_hour", 1.0)
        h_cost = r.get("hourly_cost", 500.0)
        
        if r_type == "adjuster":
            adjuster_headcount += count
            adjuster_rate = rate
            costs["adjuster_hourly"] = h_cost
        elif r_type == "surveyor":
            surveyor_headcount += count
            surveyor_rate = rate
            costs["surveyor_hourly"] = h_cost
        elif r_type == "vendor":
            vendor_headcount += count
            vendor_rate = rate
            costs["vendor_hourly"] = h_cost
        elif r_type == "cloud_worker":
            cloud_tier += count
            cloud_rate = rate
            costs["cloud_hourly"] = h_cost
        elif r_type == "call_agent":
            call_headcount += count
            call_rate = rate
            costs["call_hourly"] = h_cost

    # Apply Interventions
    total_adjusters = adjuster_headcount + interventions.get("adjusters", 0)
    total_surveyors = surveyor_headcount + interventions.get("surveyors", 0)
    total_vendors = vendor_headcount + interventions.get("vendors", 0)
    total_cloud = cloud_tier + interventions.get("cloud_workers", 0)
    total_call_agents = call_headcount + interventions.get("call_agents", 0)

    # 1. FNOL Capacity (Intake per hour):
    # Automated web/app intake handles up to 120/hr, plus telephonic FNOL by call agents (call_agents * call_rate * 0.4)
    fnol_capacity_hr = 120.0 + (total_call_agents * call_rate * 0.45)
    
    # 2. Validation Capacity:
    # Automated rule engine (70%) + Adjuster manual review (30%)
    validation_capacity_hr = 150.0 + (total_adjusters * adjuster_rate * 0.70)
    
    # 3. Document Processing Capacity:
    # Cloud OCR AI + human exception handlers
    doc_processing_capacity_hr = (total_cloud * cloud_rate) + (total_adjusters * 12.0)
    # Convert from doc throughput to claim throughput (~3.2 docs per claim)
    doc_claims_capacity_hr = doc_processing_capacity_hr / 3.2
    
    # 4. Assessment Capacity:
    # Desk adjusters doing triage, reserve setting, virtual estimate review
    assessment_capacity_hr = max(1.0, total_adjusters * adjuster_rate * 0.85)
    
    # 5. Survey Capacity:
    # Physical licensed surveyors (Critical physical constraint)
    survey_capacity_hr = max(1.0, total_surveyors * surveyor_rate)
    
    # 6. Repair Authorization Capacity:
    # Workshop network estimating and adjusters signoff
    repair_capacity_hr = max(1.0, total_vendors * vendor_rate * 1.1)
    
    # 7. Approval Capacity:
    # Senior adjusters / financial tier approvers
    approval_capacity_hr = max(2.0, total_adjusters * adjuster_rate * 1.5)
    
    # 8. Settlement Capacity:
    # Automated direct banking transfer / NEFT batch dispatch
    settlement_capacity_hr = 180.0

    stage_capacity_map = {
        "FNOL": round(fnol_capacity_hr, 1),
        "Validation": round(validation_capacity_hr, 1),
        "Document_Processing": round(doc_claims_capacity_hr, 1),
        "Assessment": round(assessment_capacity_hr, 1),
        "Survey": round(survey_capacity_hr, 1),
        "Repair_Authorization": round(repair_capacity_hr, 1),
        "Approval": round(approval_capacity_hr, 1),
        "Settlement": round(settlement_capacity_hr, 1)
    }

    # Hourly operational cost of this fleet
    hourly_fleet_cost = (
        total_adjusters * costs["adjuster_hourly"] +
        total_surveyors * costs["surveyor_hourly"] +
        total_vendors * costs["vendor_hourly"] +
        total_cloud * costs["cloud_hourly"] +
        total_call_agents * costs["call_hourly"]
    )

    return {
        "headcounts": {
            "adjusters": total_adjusters,
            "surveyors": total_surveyors,
            "vendors": total_vendors,
            "cloud_workers": total_cloud,
            "call_agents": total_call_agents
        },
        "baseline_headcounts": {
            "adjusters": adjuster_headcount,
            "surveyors": surveyor_headcount,
            "vendors": vendor_headcount,
            "cloud_workers": cloud_tier,
            "call_agents": call_headcount
        },
        "interventions_applied": interventions,
        "unit_costs": costs,
        "hourly_fleet_cost": round(hourly_fleet_cost, 2),
        "stage_capacities_per_hour": stage_capacity_map
    }

def evaluate_initial_capacity_gaps(
    demand_forecast: Dict[str, Any],
    capacity_profile: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Identifies static supply-demand mismatches during peak catastrophe arrival hours.
    """
    stage_caps = capacity_profile["stage_capacities_per_hour"]
    hourly_demand = demand_forecast.get("hourly_demand", [])
    
    # Find peak hourly demand
    peak_claims = max([h["claims_ingested"] for h in hourly_demand]) if hourly_demand else 100
    peak_surveys = max([h["survey_requests"] for h in hourly_demand]) if hourly_demand else 30
    peak_repairs = max([h["repair_tickets"] for h in hourly_demand]) if hourly_demand else 80
    
    gaps = []
    
    # 1. Survey Gap
    survey_cap = stage_caps["Survey"]
    if survey_cap < peak_surveys:
        deficit_ratio = round(((peak_surveys - survey_cap) / peak_surveys) * 100, 1)
        gaps.append({
            "stage": "Survey",
            "resource": "Field Surveyors",
            "capacity_per_hour": survey_cap,
            "peak_demand_per_hour": peak_surveys,
            "deficit_pct": deficit_ratio,
            "severity": "CRITICAL",
            "risk": "Major physical backlog choke-point: field inspections will queue up rapidly."
        })
        
    # 2. Repair Authorization Gap
    repair_cap = stage_caps["Repair_Authorization"]
    if repair_cap < peak_repairs:
        deficit_ratio = round(((peak_repairs - repair_cap) / peak_repairs) * 100, 1)
        gaps.append({
            "stage": "Repair_Authorization",
            "resource": "Repair Vendor Partners",
            "capacity_per_hour": repair_cap,
            "peak_demand_per_hour": peak_repairs,
            "deficit_pct": deficit_ratio,
            "severity": "HIGH",
            "risk": "Secondary bottleneck: workshop capacity will saturate once survey wave arrives."
        })
        
    # 3. Assessment Gap
    assess_cap = stage_caps["Assessment"]
    if assess_cap < (peak_claims * 0.9):
        deficit_ratio = round((((peak_claims * 0.9) - assess_cap) / (peak_claims * 0.9)) * 100, 1)
        gaps.append({
            "stage": "Assessment",
            "resource": "Desk Claims Adjusters",
            "capacity_per_hour": assess_cap,
            "peak_demand_per_hour": round(peak_claims * 0.9, 1),
            "deficit_pct": deficit_ratio,
            "severity": "MEDIUM",
            "risk": "Triage & preliminary reserve setting backlogs during peak landfall hours."
        })

    return gaps
