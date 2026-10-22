"""
SQLAlchemy ORM models for SURGE:
Policies, Catastrophes, Claims, Resources, SimulationRuns, OptimizationRuns.
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON, Boolean
from app.db.session import Base

class Policy(Base):
    __tablename__ = "policies"
    
    policy_id = Column(String(50), primary_key=True, index=True)
    customer_id = Column(String(50), index=True)
    product = Column(String(100), nullable=False)
    region = Column(String(150), nullable=False, index=True)
    district = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    coverage = Column(String(100), nullable=False)
    insured_value = Column(Float, nullable=False)
    deductible = Column(Float, nullable=False)
    structural_vulnerability = Column(Float, default=0.5)

class Catastrophe(Base):
    __tablename__ = "catastrophes"
    
    event_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    type = Column(String(50), nullable=False)  # Cyclone, Flood, Earthquake
    intensity = Column(String(100), nullable=False)
    region = Column(String(150), nullable=False, index=True)
    affected_area_sqkm = Column(Float, nullable=False)
    start_time = Column(DateTime, nullable=False)
    wind_speed_kmh = Column(Float, default=0.0)
    rainfall_mm = Column(Float, default=0.0)
    storm_surge_m = Column(Float, default=0.0)
    expected_claim_rate = Column(Float, default=0.35)
    description = Column(Text, nullable=True)

class Claim(Base):
    __tablename__ = "claims"
    
    claim_id = Column(String(50), primary_key=True, index=True)
    policy_id = Column(String(50), index=True)
    event_id = Column(String(50), index=True)
    claim_type = Column(String(100), nullable=False)
    severity = Column(String(50), nullable=False)  # Low, Medium, High, Catastrophic
    status = Column(String(50), default="Reported")
    loss_date = Column(DateTime, nullable=False)
    location = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    estimated_loss = Column(Float, nullable=False)
    product = Column(String(100), nullable=True)
    requires_field_survey = Column(Boolean, default=False)

class Resource(Base):
    __tablename__ = "resources"
    
    resource_id = Column(String(50), primary_key=True, index=True)
    type = Column(String(50), nullable=False)  # adjuster, surveyor, vendor, cloud_worker, call_agent
    role = Column(String(150), nullable=False)
    region = Column(String(150), nullable=False, index=True)
    unit_cost_per_day = Column(Float, nullable=False)
    hourly_cost = Column(Float, nullable=False)
    baseline_capacity_per_hour = Column(Float, nullable=False)
    available_headcount = Column(Integer, default=1)
    max_surge_headcount = Column(Integer, default=100)
    surge_onboarding_lead_hours = Column(Float, default=4.0)

class SimulationRun(Base):
    __tablename__ = "simulation_runs"
    
    id = Column(String(50), primary_key=True, index=True)
    event_id = Column(String(50), index=True)
    run_type = Column(String(50), default="baseline")  # baseline vs what_if
    interventions = Column(JSON, nullable=True)
    summary_metrics = Column(JSON, nullable=False)
    hourly_timeline = Column(JSON, nullable=False)
    bottlenecks = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class OptimizationRun(Base):
    __tablename__ = "optimization_runs"
    
    id = Column(String(50), primary_key=True, index=True)
    event_id = Column(String(50), index=True)
    budget = Column(Float, nullable=False)
    objective = Column(String(50), nullable=False)
    recommended_resources = Column(JSON, nullable=False)
    baseline_metrics = Column(JSON, nullable=False)
    optimized_metrics = Column(JSON, nullable=False)
    delta_metrics = Column(JSON, nullable=False)
    explainability = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
