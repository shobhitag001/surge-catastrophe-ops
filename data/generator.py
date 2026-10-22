"""
SURGE Catastrophe Operations & Capacity Intelligence
Synthetic Data Generator for Policies, Catastrophes, Claims, and Resources.
"""

import os
import random
import datetime
import pandas as pd
import numpy as np

# Set deterministic seed for reproducibility
random.seed(42)
np.random.seed(42)

DATA_DIR = os.path.dirname(os.path.abspath(__file__))

def generate_catastrophes():
    catastrophes = [
        {
            "event_id": "CAT-2026-01",
            "name": "Cyclone Tauktae (Severe Super-Cyclone)",
            "type": "Cyclone",
            "intensity": "Category 4 (185 km/h)",
            "region": "Coastal Maharashtra & Mumbai",
            "affected_area_sqkm": 14200,
            "start_time": "2026-10-22T04:00:00",
            "wind_speed_kmh": 185.0,
            "rainfall_mm": 320.0,
            "storm_surge_m": 3.8,
            "expected_claim_rate": 0.38,
            "description": "Very severe cyclonic storm making landfall near Mumbai and Raigad coast with destructive wind gusts and storm surges."
        },
        {
            "event_id": "CAT-2026-02",
            "name": "Cyclone Biparjoy (Extremely Severe)",
            "type": "Cyclone",
            "intensity": "Category 3 (150 km/h)",
            "region": "Saurashtra & Kutch, Gujarat",
            "affected_area_sqkm": 18500,
            "start_time": "2026-10-22T06:00:00",
            "wind_speed_kmh": 150.0,
            "rainfall_mm": 240.0,
            "storm_surge_m": 2.5,
            "expected_claim_rate": 0.29,
            "description": "High windstorm impacting commercial ports, industrial zones, and coastal residential settlements in Kutch."
        },
        {
            "event_id": "CAT-2026-03",
            "name": "Chennai Urban Inundation Deluge",
            "type": "Flood",
            "intensity": "Catastrophic Rain (480 mm / 24h)",
            "region": "Greater Chennai & Coromandel Coast",
            "affected_area_sqkm": 3200,
            "start_time": "2026-10-22T00:00:00",
            "wind_speed_kmh": 70.0,
            "rainfall_mm": 480.0,
            "storm_surge_m": 1.2,
            "expected_claim_rate": 0.44,
            "description": "Severe atmospheric depression resulting in catastrophic flooding across urban residential and commercial IT corridors."
        },
        {
            "event_id": "CAT-2026-04",
            "name": "Odisha Coastal Super Cyclone",
            "type": "Cyclone",
            "intensity": "Category 5 (220 km/h)",
            "region": "Puri, Jagatsinghpur & Kendrapara",
            "affected_area_sqkm": 16000,
            "start_time": "2026-10-22T08:00:00",
            "wind_speed_kmh": 220.0,
            "rainfall_mm": 390.0,
            "storm_surge_m": 4.5,
            "expected_claim_rate": 0.52,
            "description": "Ultra-severe landfall causing extensive structural destruction to coastal homes, fishing infrastructure, and power grids."
        }
    ]
    df = pd.DataFrame(catastrophes)
    df.to_csv(os.path.join(DATA_DIR, "catastrophes.csv"), index=False)
    print(f"Generated {len(df)} catastrophes -> catastrophes.csv")
    return df

def generate_policies(num_policies=3000):
    products = [
        {"product": "Residential Property (Home)", "prob": 0.42, "val_range": (1500000, 15000000), "ded_pct": 0.02},
        {"product": "Commercial Property & Industrial", "prob": 0.20, "val_range": (10000000, 150000000), "ded_pct": 0.05},
        {"product": "Auto & Commercial Fleet", "prob": 0.26, "val_range": (400000, 3500000), "ded_pct": 0.03},
        {"product": "SME Business & Retail Interruption", "prob": 0.12, "val_range": (2000000, 30000000), "ded_pct": 0.04}
    ]
    
    region_clusters = {
        "Coastal Maharashtra & Mumbai": {
            "center": (18.96, 72.82),
            "spread": 0.45,
            "districts": ["Mumbai South", "Mumbai Suburbs", "Thane", "Raigad Coastal", "Navi Mumbai", "Palghar"]
        },
        "Saurashtra & Kutch, Gujarat": {
            "center": (23.24, 69.66),
            "spread": 0.65,
            "districts": ["Bhuj", "Kandla Port", "Gandhidham", "Mandvi Coastal", "Mundra", "Jamnagar"]
        },
        "Greater Chennai & Coromandel Coast": {
            "center": (13.08, 80.27),
            "spread": 0.35,
            "districts": ["Velachery", "OMR IT Corridor", "Adyar Basin", "Tambaram", "Ennore Coastal", "Ambattur"]
        },
        "Puri, Jagatsinghpur & Kendrapara": {
            "center": (19.81, 85.83),
            "spread": 0.50,
            "districts": ["Puri Beach", "Konark Coastal", "Paradip Port", "Jagatsinghpur", "Kendrapara Delta"]
        }
    }
    
    policies = []
    prod_choices = [p["product"] for p in products]
    prod_probs = [p["prob"] for p in products]
    
    regions = list(region_clusters.keys())
    
    for i in range(1, num_policies + 1):
        policy_id = f"POL-{i:05d}"
        customer_id = f"CUST-{(i % 850) + 1:04d}"
        
        region = random.choice(regions)
        cluster = region_clusters[region]
        lat = cluster["center"][0] + np.random.normal(0, cluster["spread"] * 0.4)
        lon = cluster["center"][1] + np.random.normal(0, cluster["spread"] * 0.4)
        district = random.choice(cluster["districts"])
        
        prod_idx = np.random.choice(len(products), p=prod_probs)
        p_info = products[prod_idx]
        product_name = p_info["product"]
        
        insured_value = int(random.uniform(p_info["val_range"][0], p_info["val_range"][1]))
        deductible = int(insured_value * p_info["ded_pct"])
        
        coverage_type = random.choice(["Comprehensive All-Risk", "Standard Cat-Peril", "Structural & Contents Premium"])
        structural_vulnerability = round(random.uniform(0.15, 0.95), 2)  # 1.0 = highly vulnerable (e.g. tin roof/low elevation)
        
        policies.append({
            "policy_id": policy_id,
            "customer_id": customer_id,
            "product": product_name,
            "region": region,
            "district": district,
            "latitude": round(lat, 5),
            "longitude": round(lon, 5),
            "coverage": coverage_type,
            "insured_value": insured_value,
            "deductible": deductible,
            "structural_vulnerability": structural_vulnerability
        })
        
    df = pd.DataFrame(policies)
    df.to_csv(os.path.join(DATA_DIR, "policies.csv"), index=False)
    print(f"Generated {len(df)} policies -> policies.csv")
    return df

def generate_resources():
    # Model baseline resource pool for insurance operations across regions
    resources = [
        # Desk Claims Adjusters (Validation & Assessment)
        {
            "resource_id": "RES-ADJ-BASE-01",
            "type": "adjuster",
            "role": "Desk Claims Adjuster (Level 1 & 2)",
            "region": "Coastal Maharashtra & Mumbai",
            "unit_cost_per_day": 6500,  # in INR
            "hourly_cost": 812.5,
            "baseline_capacity_per_hour": 1.4,  # claims per adjuster/hour
            "available_headcount": 35,
            "max_surge_headcount": 120,
            "surge_onboarding_lead_hours": 4
        },
        {
            "resource_id": "RES-ADJ-BASE-02",
            "type": "adjuster",
            "role": "Desk Claims Adjuster (Level 1 & 2)",
            "region": "Saurashtra & Kutch, Gujarat",
            "unit_cost_per_day": 5500,
            "hourly_cost": 687.5,
            "baseline_capacity_per_hour": 1.4,
            "available_headcount": 25,
            "max_surge_headcount": 80,
            "surge_onboarding_lead_hours": 4
        },
        {
            "resource_id": "RES-ADJ-BASE-03",
            "type": "adjuster",
            "role": "Desk Claims Adjuster (Level 1 & 2)",
            "region": "Greater Chennai & Coromandel Coast",
            "unit_cost_per_day": 6000,
            "hourly_cost": 750.0,
            "baseline_capacity_per_hour": 1.4,
            "available_headcount": 30,
            "max_surge_headcount": 100,
            "surge_onboarding_lead_hours": 4
        },
        {
            "resource_id": "RES-ADJ-BASE-04",
            "type": "adjuster",
            "role": "Desk Claims Adjuster (Level 1 & 2)",
            "region": "Puri, Jagatsinghpur & Kendrapara",
            "unit_cost_per_day": 5000,
            "hourly_cost": 625.0,
            "baseline_capacity_per_hour": 1.4,
            "available_headcount": 20,
            "max_surge_headcount": 75,
            "surge_onboarding_lead_hours": 4
        },
        
        # Field Surveyors & Loss Assessors (Physical & Drone Inspections)
        {
            "resource_id": "RES-SRV-BASE-01",
            "type": "surveyor",
            "role": "Licensed Independent Field Surveyor",
            "region": "Coastal Maharashtra & Mumbai",
            "unit_cost_per_day": 12000,
            "hourly_cost": 1500.0,
            "baseline_capacity_per_hour": 0.35,  # ~3 to 4 physical inspections per 10-hour day
            "available_headcount": 22,
            "max_surge_headcount": 90,
            "surge_onboarding_lead_hours": 8
        },
        {
            "resource_id": "RES-SRV-BASE-02",
            "type": "surveyor",
            "role": "Licensed Independent Field Surveyor",
            "region": "Saurashtra & Kutch, Gujarat",
            "unit_cost_per_day": 10500,
            "hourly_cost": 1312.5,
            "baseline_capacity_per_hour": 0.32,
            "available_headcount": 16,
            "max_surge_headcount": 65,
            "surge_onboarding_lead_hours": 8
        },
        {
            "resource_id": "RES-SRV-BASE-03",
            "type": "surveyor",
            "role": "Licensed Independent Field Surveyor",
            "region": "Greater Chennai & Coromandel Coast",
            "unit_cost_per_day": 11500,
            "hourly_cost": 1437.5,
            "baseline_capacity_per_hour": 0.35,
            "available_headcount": 20,
            "max_surge_headcount": 80,
            "surge_onboarding_lead_hours": 8
        },
        {
            "resource_id": "RES-SRV-BASE-04",
            "type": "surveyor",
            "role": "Licensed Independent Field Surveyor",
            "region": "Puri, Jagatsinghpur & Kendrapara",
            "unit_cost_per_day": 9500,
            "hourly_cost": 1187.5,
            "baseline_capacity_per_hour": 0.30,
            "available_headcount": 14,
            "max_surge_headcount": 60,
            "surge_onboarding_lead_hours": 8
        },

        # Repair Network Partner Vendors (Garages, Structural Restorers, Contractors)
        {
            "resource_id": "RES-VND-BASE-01",
            "type": "vendor",
            "role": "Tier-1 Repair Partner Network",
            "region": "Coastal Maharashtra & Mumbai",
            "unit_cost_per_day": 25000,  # retainer / slot capacity per vendor workshop per day
            "hourly_cost": 3125.0,
            "baseline_capacity_per_hour": 0.75,
            "available_headcount": 15,   # partner network shops
            "max_surge_headcount": 45,
            "surge_onboarding_lead_hours": 12
        },
        {
            "resource_id": "RES-VND-BASE-02",
            "type": "vendor",
            "role": "Tier-1 Repair Partner Network",
            "region": "Saurashtra & Kutch, Gujarat",
            "unit_cost_per_day": 22000,
            "hourly_cost": 2750.0,
            "baseline_capacity_per_hour": 0.70,
            "available_headcount": 10,
            "max_surge_headcount": 35,
            "surge_onboarding_lead_hours": 12
        },
        {
            "resource_id": "RES-VND-BASE-03",
            "type": "vendor",
            "role": "Tier-1 Repair Partner Network",
            "region": "Greater Chennai & Coromandel Coast",
            "unit_cost_per_day": 24000,
            "hourly_cost": 3000.0,
            "baseline_capacity_per_hour": 0.75,
            "available_headcount": 12,
            "max_surge_headcount": 40,
            "surge_onboarding_lead_hours": 12
        },
        {
            "resource_id": "RES-VND-BASE-04",
            "type": "vendor",
            "role": "Tier-1 Repair Partner Network",
            "region": "Puri, Jagatsinghpur & Kendrapara",
            "unit_cost_per_day": 20000,
            "hourly_cost": 2500.0,
            "baseline_capacity_per_hour": 0.65,
            "available_headcount": 8,
            "max_surge_headcount": 30,
            "surge_onboarding_lead_hours": 12
        },

        # Cloud Document AI & OCR Ingestion Microservices
        {
            "resource_id": "RES-DOC-AI-01",
            "type": "cloud_worker",
            "role": "Automated Document OCR & Fraud Screen AI",
            "region": "Global/Cloud",
            "unit_cost_per_day": 18000,  # API capacity tier per day
            "hourly_cost": 2250.0,
            "baseline_capacity_per_hour": 80.0,  # batch doc processing per tier
            "available_headcount": 2,    # provisioned microservice clusters
            "max_surge_headcount": 10,
            "surge_onboarding_lead_hours": 0.5
        },

        # Emergency Call Center & FNOL Support Agents
        {
            "resource_id": "RES-CALL-01",
            "type": "call_agent",
            "role": "Disaster Inbound Hotlines / Telephonic FNOL",
            "region": "National Call Hub",
            "unit_cost_per_day": 4000,
            "hourly_cost": 500.0,
            "baseline_capacity_per_hour": 4.5,  # calls & FNOL intakes per agent/hour
            "available_headcount": 40,
            "max_surge_headcount": 150,
            "surge_onboarding_lead_hours": 2
        }
    ]
    
    df = pd.DataFrame(resources)
    df.to_csv(os.path.join(DATA_DIR, "resources.csv"), index=False)
    print(f"Generated {len(df)} resources -> resources.csv")
    return df

def generate_claims(policies_df, catastrophes_df):
    claims = []
    claim_counter = 1
    
    severities = ["Low", "Medium", "High", "Catastrophic"]
    sev_weights = [0.25, 0.40, 0.25, 0.10]
    
    # Generate realistic historical/reference claims based on catastrophe parameters
    for _, cat in catastrophes_df.iterrows():
        cat_region = cat["region"]
        matching_policies = policies_df[policies_df["region"] == cat_region]
        
        # Sample subset of affected policies based on expected_claim_rate
        claim_rate = cat["expected_claim_rate"]
        affected_count = int(len(matching_policies) * claim_rate)
        sampled_policies = matching_policies.sample(n=min(affected_count, len(matching_policies)), random_state=42)
        
        cat_start = datetime.datetime.fromisoformat(cat["start_time"])
        
        for _, pol in sampled_policies.iterrows():
            sev = np.random.choice(severities, p=sev_weights)
            
            # Loss multipliers based on severity & structural vulnerability
            mult = {
                "Low": random.uniform(0.04, 0.12),
                "Medium": random.uniform(0.13, 0.35),
                "High": random.uniform(0.36, 0.70),
                "Catastrophic": random.uniform(0.71, 0.98)
            }[sev]
            
            # Adjust loss by structural vulnerability
            vuln_adj = 0.8 + (pol["structural_vulnerability"] * 0.4)
            estimated_loss = int(pol["insured_value"] * mult * vuln_adj)
            
            # Staggered loss report time relative to catastrophe start
            hours_after = random.weibullvariate(1.5, 12.0)
            hours_after = min(hours_after, 72.0)
            loss_date = (cat_start + datetime.timedelta(hours=hours_after)).isoformat()
            
            claim_type_map = {
                "Residential Property (Home)": random.choice(["Roof Tear-off & Water Ingress", "Flooded Ground Floor", "Structural Wall Crack"]),
                "Commercial Property & Industrial": random.choice(["Warehouse Flood & Stock Rupture", "Shed Collapsed / Machineries Soaked", "Façade & Glazing Blown Out"]),
                "Auto & Commercial Fleet": random.choice(["Submerged Engine Hydro-lock", "Crushed by Falling Tree/Pole", "Debris Windshield & Panel Impact"]),
                "SME Business & Retail Interruption": random.choice(["Inventory Water Damage", "Utility Shutdown Interruption", "Signboard & Shopfront Destruction"])
            }
            
            claims.append({
                "claim_id": f"CLM-{claim_counter:06d}",
                "policy_id": pol["policy_id"],
                "event_id": cat["event_id"],
                "claim_type": claim_type_map.get(pol["product"], "General Catastrophe Impact"),
                "severity": sev,
                "status": "Reported",
                "loss_date": loss_date,
                "location": pol["district"],
                "latitude": pol["latitude"],
                "longitude": pol["longitude"],
                "estimated_loss": estimated_loss,
                "product": pol["product"],
                "requires_field_survey": 1 if sev in ["High", "Catastrophic"] or pol["product"] == "Commercial Property & Industrial" else 0
            })
            claim_counter += 1
            
    df = pd.DataFrame(claims)
    df.to_csv(os.path.join(DATA_DIR, "claims.csv"), index=False)
    print(f"Generated {len(df)} claims -> claims.csv")
    return df

def run():
    print("SURGE Data Generator Starting...")
    cats = generate_catastrophes()
    pols = generate_policies(num_policies=2800)
    res = generate_resources()
    clms = generate_claims(pols, cats)
    print("All synthetic data files created successfully in:", DATA_DIR)

if __name__ == "__main__":
    run()
