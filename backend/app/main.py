"""
SURGE: Predictive Catastrophe Operations & Capacity Intelligence Engine
FastAPI Main Application Entrypoint.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.seed import seed_database
from app.routers import catastrophes, simulation, optimization, metrics

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed database if needed
    print(f"Starting {settings.APP_NAME} in {settings.ENVIRONMENT} mode...")
    try:
        seed_database()
    except Exception as e:
        print(f"Warning: Database seeding encountered: {e}")
    yield
    print("Shutting down SURGE backend...")

app = FastAPI(
    title=settings.APP_NAME,
    description="Predictive Catastrophe Operations & Capacity Intelligence engine for P&C insurers.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local dev and containerized setups
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(catastrophes.router)
app.include_router(simulation.router)
app.include_router(optimization.router)
app.include_router(metrics.router)

@app.get("/")
def root():
    return {
        "engine": "SURGE Predictive Catastrophe Operations Intelligence",
        "version": "1.0.0",
        "status": "OPERATIONAL",
        "endpoints": {
            "catastrophes": "/api/catastrophes",
            "baseline_simulation": "/api/simulation/baseline/{event_id}",
            "what_if_simulation": "/api/simulation/run",
            "optimization": "/api/optimization/solve",
            "resources": "/api/metrics/resources",
            "docs": "/docs"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "HEALTHY", "database": "CONNECTED"}
