"""
Database seeding utility: populates SQLite or PostgreSQL from data/*.csv.
"""

import os
import pandas as pd
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.session import engine, Base, SessionLocal
from app.db.models import Policy, Catastrophe, Claim, Resource

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data"))

def seed_database():
    print(f"Checking database tables and seeding from: {DATA_DIR}")
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # 1. Catastrophes
        if db.query(Catastrophe).count() == 0:
            csv_path = os.path.join(DATA_DIR, "catastrophes.csv")
            if os.path.exists(csv_path):
                df = pd.read_csv(csv_path)
                for _, row in df.iterrows():
                    cat = Catastrophe(
                        event_id=row["event_id"],
                        name=row["name"],
                        type=row["type"],
                        intensity=row["intensity"],
                        region=row["region"],
                        affected_area_sqkm=float(row["affected_area_sqkm"]),
                        start_time=datetime.fromisoformat(row["start_time"]),
                        wind_speed_kmh=float(row["wind_speed_kmh"]),
                        rainfall_mm=float(row["rainfall_mm"]),
                        storm_surge_m=float(row["storm_surge_m"]),
                        expected_claim_rate=float(row["expected_claim_rate"]),
                        description=str(row["description"])
                    )
                    db.add(cat)
                db.commit()
                print(f"Seeded {len(df)} catastrophes.")

        # 2. Resources
        if db.query(Resource).count() == 0:
            csv_path = os.path.join(DATA_DIR, "resources.csv")
            if os.path.exists(csv_path):
                df = pd.read_csv(csv_path)
                for _, row in df.iterrows():
                    res = Resource(
                        resource_id=row["resource_id"],
                        type=row["type"],
                        role=row["role"],
                        region=row["region"],
                        unit_cost_per_day=float(row["unit_cost_per_day"]),
                        hourly_cost=float(row["hourly_cost"]),
                        baseline_capacity_per_hour=float(row["baseline_capacity_per_hour"]),
                        available_headcount=int(row["available_headcount"]),
                        max_surge_headcount=int(row["max_surge_headcount"]),
                        surge_onboarding_lead_hours=float(row["surge_onboarding_lead_hours"])
                    )
                    db.add(res)
                db.commit()
                print(f"Seeded {len(df)} resources.")

        # 3. Policies
        if db.query(Policy).count() == 0:
            csv_path = os.path.join(DATA_DIR, "policies.csv")
            if os.path.exists(csv_path):
                df = pd.read_csv(csv_path)
                policies = []
                for _, row in df.iterrows():
                    policies.append(Policy(
                        policy_id=row["policy_id"],
                        customer_id=row["customer_id"],
                        product=row["product"],
                        region=row["region"],
                        district=row.get("district", None),
                        latitude=float(row["latitude"]),
                        longitude=float(row["longitude"]),
                        coverage=row["coverage"],
                        insured_value=float(row["insured_value"]),
                        deductible=float(row["deductible"]),
                        structural_vulnerability=float(row.get("structural_vulnerability", 0.5))
                    ))
                db.bulk_save_objects(policies)
                db.commit()
                print(f"Seeded {len(policies)} policies.")

        # 4. Claims
        if db.query(Claim).count() == 0:
            csv_path = os.path.join(DATA_DIR, "claims.csv")
            if os.path.exists(csv_path):
                df = pd.read_csv(csv_path)
                claims = []
                for _, row in df.iterrows():
                    claims.append(Claim(
                        claim_id=row["claim_id"],
                        policy_id=row["policy_id"],
                        event_id=row["event_id"],
                        claim_type=row["claim_type"],
                        severity=row["severity"],
                        status=row["status"],
                        loss_date=datetime.fromisoformat(row["loss_date"]),
                        location=row.get("location", None),
                        latitude=float(row["latitude"]) if pd.notnull(row.get("latitude")) else None,
                        longitude=float(row["longitude"]) if pd.notnull(row.get("longitude")) else None,
                        estimated_loss=float(row["estimated_loss"]),
                        product=row.get("product", None),
                        requires_field_survey=bool(row.get("requires_field_survey", False))
                    ))
                db.bulk_save_objects(claims)
                db.commit()
                print(f"Seeded {len(claims)} claims.")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
