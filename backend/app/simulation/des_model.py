"""
Layer 3: Digital Twin / Discrete-Event Simulation (DES) Layer
Models the 8 sequential claims lifecycle stages:
FNOL -> Validation -> Document Processing -> Assessment -> Survey -> Repair Authorization -> Approval -> Settlement.

Tracks queue backlogs, processing rates, resource contention, SLA breaches, and costs over hourly steps.
"""

import math
import random
from typing import Dict, List, Any

# Standard stage SLA limits in hours from initial FNOL arrival
STAGE_SLA_THRESHOLDS = {
    "FNOL": 4.0,
    "Validation": 8.0,
    "Document_Processing": 14.0,
    "Assessment": 24.0,
    "Survey": 36.0,
    "Repair_Authorization": 48.0,
    "Approval": 60.0,
    "Settlement": 72.0
}

# Penalty per claim per hour exceeding regulatory SLA (₹ / hour)
SLA_PENALTY_PER_CLAIM_HOUR = 350.0

def run_discrete_event_simulation(
    demand_forecast: Dict[str, Any],
    capacity_profile: Dict[str, Any],
    simulation_hours: int = 72,
    seed: int = 42
) -> Dict[str, Any]:
    """
    Simulates the flow of catastrophe claims through the 8 stages over 72 hours.
    Tracks state transitions, queue lengths, bottlenecks, and costs.
    """
    random.seed(seed)
    
    stage_caps = capacity_profile["stage_capacities_per_hour"]
    hourly_demand = demand_forecast.get("hourly_demand", [])
    interventions = capacity_profile.get("interventions_applied", {})
    hourly_fleet_cost = capacity_profile.get("hourly_fleet_cost", 50000.0)

    # Lead times for additional surge resources (onboarding ramp-up)
    adj_lead = 4 if interventions.get("adjusters", 0) > 0 else 0
    srv_lead = 8 if interventions.get("surveyors", 0) > 0 else 0
    vnd_lead = 12 if interventions.get("vendors", 0) > 0 else 0
    cloud_lead = 1 if interventions.get("cloud_workers", 0) > 0 else 0
    call_lead = 2 if interventions.get("call_agents", 0) > 0 else 0

    # Base capacities without interventions
    baseline_headcounts = capacity_profile.get("baseline_headcounts", {})
    base_caps = {
        "FNOL": 120.0 + (baseline_headcounts.get("call_agents", 40) * 4.5 * 0.45),
        "Validation": 150.0 + (baseline_headcounts.get("adjusters", 35) * 1.4 * 0.70),
        "Document_Processing": ((baseline_headcounts.get("cloud_workers", 2) * 80.0) + (baseline_headcounts.get("adjusters", 35) * 12.0)) / 3.2,
        "Assessment": max(1.0, baseline_headcounts.get("adjusters", 35) * 1.4 * 0.85),
        "Survey": max(1.0, baseline_headcounts.get("surveyors", 22) * 0.35),
        "Repair_Authorization": max(1.0, baseline_headcounts.get("vendors", 15) * 0.75 * 1.1),
        "Approval": max(2.0, baseline_headcounts.get("adjusters", 35) * 1.4 * 1.5),
        "Settlement": 180.0
    }

    # Queue buffers for each stage (count of claims waiting)
    queues = {
        "FNOL": 0.0,
        "Validation": 0.0,
        "Document_Processing": 0.0,
        "Assessment": 0.0,
        "Survey": 0.0,
        "Repair_Authorization": 0.0,
        "Approval": 0.0,
        "Settlement": 0.0
    }

    # Tracking metrics per stage
    stage_cumulative_processed = {s: 0.0 for s in queues}
    stage_breaches = {s: 0 for s in queues}
    
    hourly_records = []
    total_settled = 0
    cumulative_cost = 0.0
    cumulative_penalty = 0.0
    
    # Store peak queue length encountered
    peak_backlog = 0.0
    peak_backlog_hour = 0
    
    # Track completion time cohorts to calculate average settlement time
    settled_cohort_times = []

    for t in range(simulation_hours):
        # 1. Effective hourly capacity considering onboarding lead times
        cur_caps = {}
        for s in queues:
            cur_caps[s] = stage_caps[s]

        # If still in onboarding lead time, fall back to baseline capacity for that resource's stage
        if t < adj_lead:
            cur_caps["Assessment"] = base_caps["Assessment"]
            cur_caps["Approval"] = base_caps["Approval"]
            cur_caps["Validation"] = base_caps["Validation"]
        if t < srv_lead:
            cur_caps["Survey"] = base_caps["Survey"]
        if t < vnd_lead:
            cur_caps["Repair_Authorization"] = base_caps["Repair_Authorization"]
        if t < cloud_lead:
            cur_caps["Document_Processing"] = base_caps["Document_Processing"]
        if t < call_lead:
            cur_caps["FNOL"] = base_caps["FNOL"]

        # 2. Ingest new claims arriving at FNOL in this hour
        hour_demand_info = hourly_demand[t] if t < len(hourly_demand) else {}
        new_fnol = float(hour_demand_info.get("claims_ingested", 0))
        queues["FNOL"] += new_fnol

        # 3. Simulate processing sequentially from FNOL -> Settlement
        
        # --- Stage 1: FNOL ---
        fnol_cap = cur_caps["FNOL"]
        fnol_processed = min(queues["FNOL"], fnol_cap)
        queues["FNOL"] -= fnol_processed
        stage_cumulative_processed["FNOL"] += fnol_processed
        
        # --- Stage 2: Validation ---
        queues["Validation"] += fnol_processed
        val_cap = cur_caps["Validation"]
        val_processed = min(queues["Validation"], val_cap)
        queues["Validation"] -= val_processed
        stage_cumulative_processed["Validation"] += val_processed

        # --- Stage 3: Document Processing ---
        queues["Document_Processing"] += val_processed
        doc_cap = cur_caps["Document_Processing"]
        doc_processed = min(queues["Document_Processing"], doc_cap)
        queues["Document_Processing"] -= doc_processed
        stage_cumulative_processed["Document_Processing"] += doc_processed

        # --- Stage 4: Assessment (Triage & Desk Adjustment) ---
        queues["Assessment"] += doc_processed
        assess_cap = cur_caps["Assessment"]
        assess_processed = min(queues["Assessment"], assess_cap)
        queues["Assessment"] -= assess_processed
        stage_cumulative_processed["Assessment"] += assess_processed

        # Split assessment output:
        # ~45% require on-site field survey (High/Catastrophic claims, commercial properties)
        # ~55% proceed straight to Repair Authorization via fast-track virtual desk appraisal
        to_survey = assess_processed * 0.45
        to_direct_repair = assess_processed * 0.55

        # --- Stage 5: Survey (Physical On-Site Loss Assessment) ---
        queues["Survey"] += to_survey
        survey_cap = cur_caps["Survey"]
        survey_processed = min(queues["Survey"], survey_cap)
        queues["Survey"] -= survey_processed
        stage_cumulative_processed["Survey"] += survey_processed

        # --- Stage 6: Repair Authorization ---
        # Receives both completed field surveys AND direct fast-track claims
        queues["Repair_Authorization"] += (survey_processed + to_direct_repair)
        repair_cap = cur_caps["Repair_Authorization"]
        repair_processed = min(queues["Repair_Authorization"], repair_cap)
        queues["Repair_Authorization"] -= repair_processed
        stage_cumulative_processed["Repair_Authorization"] += repair_processed

        # --- Stage 7: Financial Approval & Audit ---
        queues["Approval"] += repair_processed
        approval_cap = cur_caps["Approval"]
        approval_processed = min(queues["Approval"], approval_cap)
        queues["Approval"] -= approval_processed
        stage_cumulative_processed["Approval"] += approval_processed

        # --- Stage 8: Settlement & Disbursement ---
        queues["Settlement"] += approval_processed
        settle_cap = cur_caps["Settlement"]
        settle_processed = min(queues["Settlement"], settle_cap)
        queues["Settlement"] -= settle_processed
        stage_cumulative_processed["Settlement"] += settle_processed

        total_settled += settle_processed
        for _ in range(int(round(settle_processed))):
            settled_cohort_times.append(t + 1)

        # 4. Compute Health Status for each stage at hour t
        # Green: Queue backlog / Capacity < 1.2 hours of work
        # Amber: 1.2 <= Backlog / Capacity < 3.0 hours
        # Red: Backlog / Capacity >= 3.0 hours (Critical breach zone)
        stage_statuses = {}
        for s in queues:
            cap = cur_caps[s]
            backlog = queues[s]
            dwell_ratio = backlog / max(1.0, cap)
            
            if dwell_ratio < 1.2:
                status = "GREEN"
            elif dwell_ratio < 3.0:
                status = "AMBER"
            else:
                status = "RED"
                stage_breaches[s] += int(backlog * 0.15) # claims breaching stage SLA
            
            stage_statuses[s] = {
                "status": status,
                "backlog": round(backlog, 1),
                "dwell_hours": round(dwell_ratio, 2),
                "capacity": round(cap, 1)
            }

        # Current total active backlog across all stages
        current_total_backlog = sum(queues.values())
        if current_total_backlog > peak_backlog:
            peak_backlog = current_total_backlog
            peak_backlog_hour = t

        # Hourly Financials
        hour_penalty = sum(s["backlog"] for s in stage_statuses.values() if s["status"] == "RED") * SLA_PENALTY_PER_CLAIM_HOUR
        cumulative_cost += hourly_fleet_cost
        cumulative_penalty += hour_penalty

        hourly_records.append({
            "hour": t,
            "label": f"T+{t:02d}h",
            "total_backlog": round(current_total_backlog, 1),
            "settled_claims": round(total_settled, 1),
            "hourly_settled": round(settle_processed, 1),
            "stage_statuses": stage_statuses,
            "queues": {s: round(queues[s], 1) for s in queues},
            "cumulative_cost": round(cumulative_cost, 2),
            "cumulative_penalty": round(cumulative_penalty, 2),
            "total_financial_impact": round(cumulative_cost + cumulative_penalty, 2)
        })

    # Summary KPIs
    total_claims_expected = demand_forecast.get("expected_total_claims", 1)
    mean_settlement_time = (sum(settled_cohort_times) / len(settled_cohort_times)) if settled_cohort_times else simulation_hours
    
    # SLA breach calculation: claims taking longer than SLA_SETTLEMENT_HOURS (72h) or stuck in red queues
    unsettled_remaining = sum(queues.values())
    sla_breach_count = sum(1 for tm in settled_cohort_times if tm > STAGE_SLA_THRESHOLDS["Settlement"]) + int(unsettled_remaining * 0.85)
    sla_breach_pct = round(min(100.0, (sla_breach_count / max(1, total_claims_expected)) * 100), 1)

    return {
        "event_id": demand_forecast.get("event_id"),
        "total_claims": total_claims_expected,
        "total_settled": round(total_settled, 1),
        "unsettled_remaining": round(unsettled_remaining, 1),
        "peak_backlog": round(peak_backlog, 1),
        "peak_backlog_hour": peak_backlog_hour,
        "mean_settlement_time_hours": round(mean_settlement_time, 1),
        "sla_breach_pct": sla_breach_pct,
        "sla_breach_count": sla_breach_count,
        "total_operational_cost": round(cumulative_cost, 2),
        "total_sla_penalties": round(cumulative_penalty, 2),
        "total_economic_impact": round(cumulative_cost + cumulative_penalty, 2),
        "stage_cumulative_processed": {s: round(v, 1) for s, v in stage_cumulative_processed.items()},
        "stage_breaches": stage_breaches,
        "hourly_timeline": hourly_records
    }
