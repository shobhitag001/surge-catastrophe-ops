"""
Layer 1: Exposure & Demand Forecasting Layer
Translates catastrophe parameters and policy exposure data into hourly operational demand curves:
- Ingestion / FNOL volume
- Field surveyor requests
- Repair tickets
- Document uploads
- Customer call inquiries
"""

import math
from typing import Dict, List, Any
import numpy as np

def forecast_event_demand(
    catastrophe: Dict[str, Any],
    policies: List[Dict[str, Any]],
    simulation_hours: int = 72
) -> Dict[str, Any]:
    """
    Computes exposure metrics and forecasts time-bucketed (hourly) demand curves across T+0 to T+simulation_hours.
    """
    total_exposed_policies = len(policies)
    total_insured_value = sum(p.get("insured_value", 0.0) for p in policies)
    
    # Hazard intensity multiplier
    # e.g. Category 4/5 cyclone or extreme flood
    wind_kmh = catastrophe.get("wind_speed_kmh", 120.0)
    rain_mm = catastrophe.get("rainfall_mm", 150.0)
    surge_m = catastrophe.get("storm_surge_m", 1.5)
    
    # Combined hazard severity factor [0.8, 2.0]
    hazard_severity = (
        (wind_kmh / 120.0) * 0.45 +
        (rain_mm / 200.0) * 0.35 +
        (surge_m / 2.0) * 0.20
    )
    
    base_rate = catastrophe.get("expected_claim_rate", 0.35)
    effective_claim_rate = min(0.85, max(0.10, base_rate * hazard_severity))
    
    expected_total_claims = int(round(total_exposed_policies * effective_claim_rate))
    if expected_total_claims == 0 and total_exposed_policies > 0:
        expected_total_claims = min(100, total_exposed_policies)
        
    # Product distribution in exposure
    prod_counts = {}
    for p in policies:
        prod = p.get("product", "General")
        prod_counts[prod] = prod_counts.get(prod, 0) + 1
        
    # Severity distribution estimation
    # As hazard severity rises, High and Catastrophic proportions increase
    catastrophic_share = min(0.30, 0.08 * hazard_severity)
    high_share = min(0.40, 0.22 * hazard_severity)
    med_share = 0.42
    low_share = max(0.08, 1.0 - (catastrophic_share + high_share + med_share))
    
    severity_breakdown = {
        "Low": int(expected_total_claims * low_share),
        "Medium": int(expected_total_claims * med_share),
        "High": int(expected_total_claims * high_share),
        "Catastrophic": int(expected_total_claims * catastrophic_share)
    }
    
    # Claims requiring physical on-site field surveys
    # ~100% of Catastrophic, 85% of High, 25% of Medium, 5% of Low
    survey_demand_count = int(
        severity_breakdown["Catastrophic"] * 1.00 +
        severity_breakdown["High"] * 0.85 +
        severity_breakdown["Medium"] * 0.25 +
        severity_breakdown["Low"] * 0.05
    )
    
    # Expected repair tickets (~88% of validated claims)
    repair_demand_count = int(expected_total_claims * 0.88)
    
    # Estimated gross loss (average loss percentage ~ 25% to 45% of insured value of affected policies)
    mean_policy_val = (total_insured_value / total_exposed_policies) if total_exposed_policies else 1000000
    estimated_gross_loss = int(expected_total_claims * mean_policy_val * (0.22 * hazard_severity))

    # --- Generate Hourly Demand Distribution across T+0 to T+simulation_hours ---
    # Catastrophe claims follow a Weibull / Rayleigh skewed arrival process:
    # A few immediate reports in first 2-4 hours, massive spike peaking between T+8 and T+18 as landfall passes,
    # then long exponential tail as evacuees return.
    
    hourly_arrivals = []
    # Weibull parameters: shape k=1.8, scale lambda=14.0 hours
    k = 1.9
    lam = 14.5
    
    # Precompute probability mass per hour
    pmf = []
    for h in range(simulation_hours):
        t1 = h
        t2 = h + 1
        # CDF = 1 - exp(-(t/lam)^k)
        cdf1 = 1.0 - math.exp(-((t1 / lam) ** k)) if t1 > 0 else 0.0
        cdf2 = 1.0 - math.exp(-((t2 / lam) ** k))
        p = max(0.0, cdf2 - cdf1)
        pmf.append(p)
        
    pmf_sum = sum(pmf)
    normalized_pmf = [p / pmf_sum for p in pmf]
    
    hourly_demand = []
    cum_claims = 0
    cum_calls = 0
    cum_docs = 0
    
    for h in range(simulation_hours):
        hour_claims = int(round(expected_total_claims * normalized_pmf[h]))
        # Calls surge early before claims are even filed (ratio ~ 2.4 calls per claim early, declining later)
        call_ratio = max(1.2, 3.2 - (h / 24.0))
        hour_calls = int(round(hour_claims * call_ratio))
        
        # Document uploads trail claims by ~2-4 hours (avg 3.5 docs per claim)
        doc_mult = 3.2
        hour_docs = int(round(hour_claims * doc_mult))
        
        # Field survey requests needed for this cohort
        hour_surveys = int(round(hour_claims * (survey_demand_count / max(1, expected_total_claims))))
        hour_repairs = int(round(hour_claims * 0.88))
        
        cum_claims += hour_claims
        cum_calls += hour_calls
        cum_docs += hour_docs
        
        hourly_demand.append({
            "hour": h,
            "label": f"T+{h:02d}h",
            "claims_ingested": hour_claims,
            "cumulative_claims": cum_claims,
            "customer_calls": hour_calls,
            "documents_uploaded": hour_docs,
            "survey_requests": hour_surveys,
            "repair_tickets": hour_repairs
        })
        
    return {
        "event_id": catastrophe.get("event_id"),
        "total_exposed_policies": total_exposed_policies,
        "total_insured_value": total_insured_value,
        "estimated_gross_loss": estimated_gross_loss,
        "effective_claim_rate": round(effective_claim_rate * 100, 1),
        "expected_total_claims": expected_total_claims,
        "expected_survey_requests": survey_demand_count,
        "expected_repair_tickets": repair_demand_count,
        "expected_customer_calls": cum_calls,
        "expected_document_uploads": cum_docs,
        "severity_breakdown": severity_breakdown,
        "product_exposure": prod_counts,
        "hazard_severity_factor": round(hazard_severity, 2),
        "hourly_demand": hourly_demand
    }
