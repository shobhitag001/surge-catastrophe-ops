# SURGE: Predictive Catastrophe Operations & Capacity Intelligence Engine

> **A 5-Layer Digital Twin & Optimization Engine for P&C Insurers during Extreme Catastrophe Events**

---

## 1. Executive Summary & Objective

During severe catastrophic events (e.g., Category 4/5 Cyclones, 500-year Urban Deluges), Property & Casualty (P&C) insurers experience exponential surges in claim frequency—often exceeding baseline operational intake capacity by **1,200% to 3,500%** within 24 hours of landfall.

Conventional catastrophe operations rely on static spreadsheets and retroactive response teams, leading to severe cascading bottlenecks: field surveyor shortages delay repair estimates, creating downstream workshop logjams, overwhelming customer call centers, and causing catastrophic breaches of regulatory claim settlement SLAs.

**SURGE** is an end-to-end predictive capacity intelligence engine that:
1. Translates meteorological storm parameters and policy exposure portfolios into dynamic hourly operational demand curves.
2. Models the end-to-end 8-stage claims lifecycle sequentially in a high-fidelity **Discrete-Event Simulation (DES)** digital twin.
3. Automatically predicts **primary bottlenecks** and **cascading delay waves** over a forward-looking 72-hour timeline.
4. Provides an interactive **What-If simulation studio** to test tactical headcount interventions with real-time delta feedback.
5. Employs a mathematical **Optimization Engine (Google OR-Tools)** to solve budget-constrained multi-objective allocations across field surveyors, desk adjusters, repair partner workshops, cloud OCR AI tiers, and emergency call hotlines.
6. Delivers **Explainable AI (XAI)** decision intelligence, detailing *why* a specific deployment mix was recommended.

---

## 2. 5-Layer Intelligence Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│               LAYER 5: WHAT-IF SIMULATION & OR-TOOLS OPTIMIZER         │
│   Mixed-Integer Programming (SCIP/CBC) • Budget Constraints • XAI      │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ Feedbacks & Resource Iterations
┌───────────────────────────────────┴────────────────────────────────────┐
│               LAYER 4: BOTTLENECK & CASCADE PREDICTION LAYER           │
│   Time-to-Breach (TTB) • Cascade Graph • Primary & Secondary Traps     │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ Hourly Queue & State Signals
┌───────────────────────────────────┴────────────────────────────────────┐
│               LAYER 3: DISCRETE-EVENT SIMULATION (DES) LAYER           │
│   Sequential 8-Stage Queueing Pipeline • Stochastic Dwell • SLAs       │
│   [FNOL] ➔ [Validation] ➔ [Doc AI] ➔ [Assessment] ➔ [Survey] ➔ ...    │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ Supply vs Demand Matrix
┌───────────────────────────────────┴────────────────────────────────────┐
│               LAYER 2: CAPACITY FORECASTING LAYER                      │
│   Adjusters • Independent Surveyors • Garages • Cloud OCR • Hotlines   │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ Operational Workload Arrival Curves
┌───────────────────────────────────┴────────────────────────────────────┐
│               LAYER 1: EXPOSURE & DEMAND FORECASTING LAYER             │
│   Peril Hazard (Wind, Rain, Surge) • Policy Exposure (TIV, Products)   │
└────────────────────────────────────────────────────────────────────────┘
```

### Layer Details:
1. **Layer 1: Exposure & Demand Forecasting**:
   - Ingests catastrophe parameters (Wind speed km/h, Rainfall mm, Storm surge m, Radius) and policy portfolio exposure (Total Insured Value, building structural vulnerability, coverage types).
   - Generates non-linear Weibull/Rayleigh hourly arrival distributions over $T+0$ to $T+72$ hours for claims, customer calls, damage photo uploads, field inspection requests, and workshop tickets.
2. **Layer 2: Capacity Forecasting**:
   - Maps baseline human and technical resource headcounts to hourly throughput capacity across stages.
   - Detects initial static supply-demand deficits before simulation execution.
3. **Layer 3: Digital Twin / Discrete-Event Simulation (DES)**:
   - Models claims navigating sequentially through 8 discrete stages:
     `FNOL` $\rightarrow$ `Validation` $\rightarrow$ `Document Processing` $\rightarrow$ `Assessment` $\rightarrow$ `Survey` $\rightarrow$ `Repair Authorization` $\rightarrow$ `Approval` $\rightarrow$ `Settlement`.
   - Tracks queue backlogs, resource contention, onboarding ramp-up lead times, and SLA breach counters at each hourly step.
4. **Layer 4: Bottleneck & Cascade Prediction**:
   - Computes Time-to-Breach (TTB) for each tier.
   - Discovers when a choke at Stage 5 (Field Survey) starves Stage 6 initially, then unleashes a tsunami surge wave once surveyor cohorts finish, overwhelming repair workshops at $T+24$h.
5. **Layer 5: What-If & OR-Tools Optimization Engine**:
   - Formulates a budget-constrained multi-objective integer optimization problem solved via **Google OR-Tools SCIP MILP**.
   - Solves for the optimal deployment mix under four corporate objectives:
     - **Speed Optimized**: Minimizes mean cycle hours to final payment.
     - **Cost Optimized**: Minimizes operational fleet cost + regulatory delay penalties.
     - **SLA Optimized**: Minimizes percentage of claims breaching regulatory deadlines.
     - **Customer Optimized**: Prioritizes rapid contact velocity and triage.
   - Synthesizes executive explainability narratives detailing marginal utility and ROI.

---

## 3. Tech Stack

- **Frontend**:
  - React 19 + TypeScript
  - Tailwind CSS v4 + `@tailwindcss/vite`
  - Recharts (Interactive Stacked Backlog & Velocity Curves)
  - Lucide Icons (Enterprise Control Tower aesthetic)
- **Backend**:
  - FastAPI (Python 3.12, asynchronous endpoints)
  - SQLAlchemy 2.0 (PostgreSQL support with local SQLite auto-fallback)
  - SimPy & vectorized queue simulation logic
  - Google OR-Tools (`ortools.linear_solver.pywraplp` SCIP MILP)
  - SciPy & NumPy (probabilistic Weibull distributions)
  - Pydantic v2 & Pydantic-Settings
- **Data & Storage**:
  - PostgreSQL 16 (persistent relational state)
  - Redis 7 (simulation state caching)
  - Synthetic Data Generator (2,800+ policies, 1,140+ claims, 14 resource fleets, 4 catastrophe events)
- **DevOps**:
  - Multi-stage Dockerfiles (`backend/Dockerfile`, `frontend/Dockerfile`)
  - `docker-compose.yml` for unified multi-container deployment

---

## 4. Repository Structure

```
surge-catastrophe-ops/
├── docker-compose.yml              # Multi-container orchestration (Postgres, Redis, API, UI)
├── run_demo.ps1                    # 1-click Windows PowerShell demo launcher
├── README.md                       # Comprehensive system documentation
├── data/                           # Synthetic data generation & seed CSVs
│   ├── generator.py                # Deterministic synthetic data generator
│   ├── policies.csv                # 2,800 insured property, commercial & auto policies
│   ├── catastrophes.csv            # 4 catastrophe scenarios (Cyclones Tauktae, Biparjoy, etc.)
│   ├── claims.csv                  # 1,141 seeded reference claims
│   └── resources.csv               # 14 operational resource pools & unit costs
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py                 # FastAPI application, CORS, and lifespans
│       ├── config.py               # Pydantic environment configuration
│       ├── db/
│       │   ├── session.py          # Database engine with auto-fallback
│       │   ├── models.py           # SQLAlchemy schemas (Policies, Claims, Runs)
│       │   └── seed.py             # Automatic database population
│       ├── simulation/
│       │   ├── demand_engine.py    # Layer 1: Exposure & Weibull demand curves
│       │   ├── capacity_engine.py  # Layer 2: Resource mapping & deficit detection
│       │   ├── des_model.py        # Layer 3: Discrete-Event Simulation engine
│       │   ├── cascade_engine.py   # Layer 4: Bottleneck & cascade delay propagation
│       │   └── state_cache.py      # Redis / in-memory LRU simulation cache
│       ├── optimization/
│       │   ├── optimizer.py        # Layer 5: Google OR-Tools SCIP MILP solver
│       │   └── explainability.py   # Executive Explainable AI (XAI) engine
│       └── routers/
│           ├── catastrophes.py     # Catastrophe catalogs & exposure endpoints
│           ├── simulation.py       # Baseline and What-If DES simulation routes
│           ├── optimization.py     # Budget-constrained optimization endpoint
│           └── metrics.py          # Summary KPIs and resource catalog
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── App.tsx                 # Master Control Tower application view
        ├── types/                  # TypeScript interface definitions
        ├── services/api.ts         # Asynchronous HTTP API client
        └── components/
            ├── Header.tsx          # Top bar: Catastrophe selector & alert badge
            ├── TimelineView.tsx    # T+0 to T+72h hourly countdown heatmap
            ├── BacklogChart.tsx    # Recharts stacked area queue backlog chart
            ├── SettlementThroughputChart.tsx # Settlement velocity curve (Baseline vs Active)
            ├── CascadeGraph.tsx    # Claims lifecycle topological node graph
            ├── WhatIfSimulator.tsx # Interactive resource sliders & presets
            ├── OptimizerPanel.tsx  # OR-Tools budget inputs & objective selector
            ├── DeltaComparisonBar.tsx # KPI delta cards & ROI indicators
            ├── ExplainabilityCard.tsx # Narrative breakdown of recommended mix
            ├── StageDeepDive.tsx   # 8-stage operational health & SLA matrix
            └── ExposureMap.tsx     # Geographic exposure & portfolio assets
```

---

## 5. Mathematical Formulations

### 5.1 Hourly Catastrophe Demand Arrival (Weibull Inflow)
The cumulative probability of claim reporting after landfall time $t$ is modeled via a Weibull cumulative distribution:
$$F(t; k, \lambda) = 1 - e^{-(t/\lambda)^k}$$
Where $k = 1.9$ (shape parameter creating the rapid post-storm peak) and $\lambda = 14.5$ hours (scale parameter).
The hourly ingested claims $D_{\text{FNOL}}(t)$ are:
$$D_{\text{FNOL}}(t) = N_{\text{claims}} \cdot \left[ F(t+1) - F(t) \right]$$

### 5.2 Discrete-Event Queue Transition Dynamics
For any stage $s \in \{1, \dots, 8\}$ at hour $t$:
$$Q_s(t+1) = \max\left(0, Q_s(t) + I_s(t) - C_s(t)\right)$$
Where:
- $Q_s(t)$ is the backlog waiting in stage $s$.
- $I_s(t)$ is the inflow of claims arriving from upstream stage $s-1$.
- $C_s(t)$ is the effective processing capacity of stage $s$ (incorporating resource surge ramp-up lead times).

### 5.3 Google OR-Tools Integer Linear Programming (MILP)
Given a catastrophe operational budget $B$, the optimization engine solves:
$$\max_{\mathbf{x}} \sum_{i \in \text{Resources}} w_i \cdot x_i$$
Subject to:
$$\sum_{i} x_i \cdot \text{Cost}_i \cdot T_{\text{surge}} \le B$$
$$0 \le x_i \le \text{MaxSurge}_i \quad \forall i \in \{\text{adj}, \text{srv}, \text{vnd}, \text{cld}, \text{call}\}$$
$$x_{\text{adj}} \ge 0.25 \cdot x_{\text{srv}} \quad \text{(Workflow balance constraint)}$$
$$x_{\text{vnd}} \le 1.2 \cdot x_{\text{srv}} + 5 \quad \text{(Workshop absorption constraint)}$$

---

## 6. How to Run

### Option A: Local Fast-Start (No Docker required)
Both backend and frontend can be run directly on the host machine using Python and Node.js.

1. **Start the FastAPI Backend**:
   ```powershell
   cd backend
   $env:PYTHONPATH = (Get-Location).Path
   py -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *The database automatically creates `surge.db` and seeds all policies, claims, resources, and catastrophes on startup.*

2. **Start the React Control Tower Frontend**:
   ```powershell
   cd frontend
   npm run dev
   ```

3. Open your browser:
   - **SURGE Control Tower UI**: `http://localhost:5173`
   - **Interactive FastAPI Swagger Docs**: `http://localhost:8000/docs`

Or simply run the automated PowerShell script:
```powershell
.\run_demo.ps1
```

---

### Option B: Docker Compose (Production Multi-Container)
To launch PostgreSQL, Redis, FastAPI, and React in isolated Docker containers:

```bash
docker compose up --build
```

- **Frontend Dashboard**: `http://localhost:3000`
- **FastAPI Backend**: `http://localhost:8000`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`

---

## 7. Key REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/catastrophes/` | Catalog of active catastrophe events & exposure metrics |
| `GET` | `/api/catastrophes/{id}` | Detailed hazard parameters & policy exposure breakdown |
| `GET` | `/api/catastrophes/{id}/policies` | Sample exposed policy records for geospatial mapping |
| `GET` | `/api/simulation/baseline/{id}` | Runs 72h baseline DES and detects primary & cascading bottlenecks |
| `POST` | `/api/simulation/run` | Runs What-If simulation with custom resource headcount adjustments |
| `POST` | `/api/optimization/solve` | Solves budget-constrained allocation via Google OR-Tools & outputs XAI |
| `GET` | `/api/metrics/resources` | Catalog of available resource pools, rates, and unit costs |
| `GET` | `/api/metrics/summary` | Real-time control tower executive health summary |
