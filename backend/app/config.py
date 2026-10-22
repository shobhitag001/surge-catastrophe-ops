"""
Application configuration for SURGE backend.
"""

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "SURGE - Catastrophe Operations Intelligence"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Database: Defaults to local SQLite if POSTGRES_URL not set
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'surge.db')}"
    )
    
    # Redis configuration with graceful fallback
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    USE_REDIS: bool = os.getenv("USE_REDIS", "false").lower() == "true"
    
    # Simulation defaults
    DEFAULT_TIMELINE_HOURS: int = 72
    SLA_FNOL_HOURS: float = 4.0
    SLA_VALIDATION_HOURS: float = 8.0
    SLA_DOCS_HOURS: float = 12.0
    SLA_ASSESSMENT_HOURS: float = 24.0
    SLA_SURVEY_HOURS: float = 36.0
    SLA_REPAIR_HOURS: float = 48.0
    SLA_APPROVAL_HOURS: float = 60.0
    SLA_SETTLEMENT_HOURS: float = 72.0
    
    # Default currency symbol and exchange rates for multi-currency UI
    DEFAULT_CURRENCY: str = "INR"  # "INR" or "USD"
    INR_TO_USD: float = 0.012

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
