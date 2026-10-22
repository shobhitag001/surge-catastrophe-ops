"""
Layer 5: What-If Simulation & Optimization Engine
Uses Google OR-Tools (Mixed-Integer Linear Programming) and Scipy
for budget-constrained multi-objective resource allocation.
"""

from typing import Dict, List, Any
import numpy as np

try:
    from ortools.linear_solver import pywraplp
    ORTOOLS_AVAILABLE = True
except ImportError:
    ORTOOLS_AVAILABLE = False

from app.simulation.capacity_engine import calculate_stage_capacities
from app.simulation.des_model import run_discrete_event_simulation

def solve_resource_allocation(
    demand_forecast: Dict[str, Any],
    resources: List[Dict[str, Any]],
    budget: float = 5000000.0,  # e.g. 50 Lakhs INR (or equivalent USD)
    objective: str = "sla",     # "sla", "speed", "cost", "customer"
    simulation_duration_days: int = 3
) -> Dict[str, Any]:
    """
    Solves for the optimal additional resource mix given a fixed budget.
    
    Decision variables:
    x_adj:  additional desk adjusters
    x_srv:  additional field surveyors
    x_vnd:  additional repair network vendor slots
    x_cld:  additional cloud OCR/AI worker tiers
    x_call: additional call center intake agents
    
    Subject to:
    Cost(x) <= Budget
    0 <= x_i <= Max_Surge_i
    """
    # 3-day (72-hour) deployment cost per resource unit
    cost_adj = 6500.0 * simulation_duration_days   # ~₹19,500
    cost_srv = 12000.0 * simulation_duration_days  # ~₹36,000
    cost_vnd = 25000.0 * simulation_duration_days  # ~₹75,000
    cost_cld = 18000.0 * simulation_duration_days  # ~₹54,000
    cost_call = 4000.0 * simulation_duration_days  # ~₹12,000

    # Bounds on additional capacity available in market
    max_adj = 60
    max_srv = 50
    max_vnd = 25
    max_cld = 6
    max_call = 70

    # Baseline performance
    baseline_capacity = calculate_stage_capacities(resources, interventions={})
    baseline_sim = run_discrete_event_simulation(demand_forecast, baseline_capacity)

    # Weights for the objective function based on the selected objective
    # Coefficients represent marginal utility / bottleneck relief per unit deployed
    # Field Surveyors have the highest bottleneck relief in property/catastrophe claims
    if objective == "sla":
        # Minimize SLA breaches -> heavy priority on Surveyors and Repair Vendors
        w_srv = 95.0
        w_vnd = 70.0
        w_adj = 35.0
        w_cld = 18.0
        w_call = 12.0
    elif objective == "speed":
        # Minimize cycle time -> balanced acceleration across survey, repairs, and assessment
        w_srv = 90.0
        w_vnd = 80.0
        w_adj = 50.0
        w_cld = 25.0
        w_call = 15.0
    elif objective == "cost":
        # Minimize overall total cost (maximize efficiency per rupee spent)
        w_srv = 75.0
        w_vnd = 50.0
        w_adj = 45.0
        w_cld = 30.0
        w_call = 20.0
    elif objective == "customer":
        # Maximize customer satisfaction -> heavy on call agents, survey speed, and repair start
        w_srv = 85.0
        w_vnd = 65.0
        w_call = 60.0
        w_adj = 40.0
        w_cld = 20.0
    else:
        w_srv = 85.0
        w_vnd = 65.0
        w_adj = 40.0
        w_cld = 20.0
        w_call = 15.0

    optimal_interventions = {"adjusters": 0, "surveyors": 0, "vendors": 0, "cloud_workers": 0, "call_agents": 0}

    # Solve using Google OR-Tools SCIP solver
    solved_with = "OR-Tools (SCIP MILP)"
    if ORTOOLS_AVAILABLE:
        solver = pywraplp.Solver.CreateSolver("SCIP")
        if not solver:
            solver = pywraplp.Solver.CreateSolver("CBC")
            
        if solver:
            # Integer Decision Variables
            x_adj = solver.IntVar(0, max_adj, "adjusters")
            x_srv = solver.IntVar(0, max_srv, "surveyors")
            x_vnd = solver.IntVar(0, max_vnd, "vendors")
            x_cld = solver.IntVar(0, max_cld, "cloud_workers")
            x_call = solver.IntVar(0, max_call, "call_agents")

            # Budget Constraint
            solver.Add(
                x_adj * cost_adj +
                x_srv * cost_srv +
                x_vnd * cost_vnd +
                x_cld * cost_cld +
                x_call * cost_call <= budget
            )

            # Stage Balancing Constraints:
            # (Ensures realistic insurance workflow synergy: Surveyors need adjusters to review reports)
            solver.Add(x_adj >= 0.25 * x_srv)
            solver.Add(x_vnd <= 1.2 * x_srv + 5)

            # Objective: Maximize relief utility
            solver.Maximize(
                w_srv * x_srv +
                w_vnd * x_vnd +
                w_adj * x_adj +
                w_cld * x_cld +
                w_call * x_call
            )

            status = solver.Solve()
            if status in [pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE]:
                optimal_interventions = {
                    "adjusters": int(round(x_adj.solution_value())),
                    "surveyors": int(round(x_srv.solution_value())),
                    "vendors": int(round(x_vnd.solution_value())),
                    "cloud_workers": int(round(x_cld.solution_value())),
                    "call_agents": int(round(x_call.solution_value()))
                }
            else:
                solved_with = "Greedy Knapsack Fallback"
                optimal_interventions = _solve_knapsack_heuristic(budget, cost_adj, cost_srv, cost_vnd, cost_cld, cost_call, w_adj, w_srv, w_vnd, w_cld, w_call)
        else:
            solved_with = "Greedy Knapsack Fallback"
            optimal_interventions = _solve_knapsack_heuristic(budget, cost_adj, cost_srv, cost_vnd, cost_cld, cost_call, w_adj, w_srv, w_vnd, w_cld, w_call)
    else:
        solved_with = "Greedy Knapsack Fallback"
        optimal_interventions = _solve_knapsack_heuristic(budget, cost_adj, cost_srv, cost_vnd, cost_cld, cost_call, w_adj, w_srv, w_vnd, w_cld, w_call)

    # Calculate actual cost of the optimal allocation
    actual_spent = (
        optimal_interventions["adjusters"] * cost_adj +
        optimal_interventions["surveyors"] * cost_srv +
        optimal_interventions["vendors"] * cost_vnd +
        optimal_interventions["cloud_workers"] * cost_cld +
        optimal_interventions["call_agents"] * cost_call
    )

    # Run discrete-event simulation with the optimized interventions
    optimized_capacity = calculate_stage_capacities(resources, interventions=optimal_interventions)
    optimized_sim = run_discrete_event_simulation(demand_forecast, optimized_capacity)

    # Calculate Delta Improvements
    backlog_reduction_pct = round(
        ((baseline_sim["peak_backlog"] - optimized_sim["peak_backlog"]) / max(1.0, baseline_sim["peak_backlog"])) * 100, 1
    )
    settlement_acceleration_hrs = round(
        baseline_sim["mean_settlement_time_hours"] - optimized_sim["mean_settlement_time_hours"], 1
    )
    sla_breach_reduction_pct = round(
        baseline_sim["sla_breach_pct"] - optimized_sim["sla_breach_pct"], 1
    )
    penalties_saved = round(
        baseline_sim["total_sla_penalties"] - optimized_sim["total_sla_penalties"], 2
    )
    net_economic_savings = round(
        penalties_saved - actual_spent, 2
    )

    return {
        "solver": solved_with,
        "objective": objective,
        "budget_allocated": budget,
        "budget_utilized": round(actual_spent, 2),
        "budget_utilization_pct": round((actual_spent / max(1.0, budget)) * 100, 1),
        "recommended_resources": optimal_interventions,
        "baseline_metrics": {
            "peak_backlog": baseline_sim["peak_backlog"],
            "peak_backlog_hour": baseline_sim["peak_backlog_hour"],
            "mean_settlement_time_hours": baseline_sim["mean_settlement_time_hours"],
            "sla_breach_pct": baseline_sim["sla_breach_pct"],
            "total_operational_cost": baseline_sim["total_operational_cost"],
            "total_sla_penalties": baseline_sim["total_sla_penalties"],
            "total_economic_impact": baseline_sim["total_economic_impact"]
        },
        "optimized_metrics": {
            "peak_backlog": optimized_sim["peak_backlog"],
            "peak_backlog_hour": optimized_sim["peak_backlog_hour"],
            "mean_settlement_time_hours": optimized_sim["mean_settlement_time_hours"],
            "sla_breach_pct": optimized_sim["sla_breach_pct"],
            "total_operational_cost": optimized_sim["total_operational_cost"],
            "total_sla_penalties": optimized_sim["total_sla_penalties"],
            "total_economic_impact": optimized_sim["total_economic_impact"]
        },
        "delta_metrics": {
            "backlog_reduction_pct": backlog_reduction_pct,
            "settlement_acceleration_hours": settlement_acceleration_hrs,
            "sla_breach_reduction_pct": sla_breach_reduction_pct,
            "sla_penalties_saved": penalties_saved,
            "net_economic_savings": net_economic_savings,
            "roi_ratio": round(max(0.1, penalties_saved / max(1.0, actual_spent)), 2)
        },
        "hourly_timeline_optimized": optimized_sim["hourly_timeline"]
    }

def _solve_knapsack_heuristic(budget, c_adj, c_srv, c_vnd, c_cld, c_call, w_adj, w_srv, w_vnd, w_cld, w_call):
    """Fallback greedy efficiency allocation if solver is unavailable."""
    items = [
        ("surveyors", c_srv, w_srv, 45),
        ("vendors", c_vnd, w_vnd, 20),
        ("adjusters", c_adj, w_adj, 40),
        ("cloud_workers", c_cld, w_cld, 4),
        ("call_agents", c_call, w_call, 50)
    ]
    # Sort by utility per rupee
    items.sort(key=lambda x: x[2] / x[1], reverse=True)
    
    alloc = {"adjusters": 0, "surveyors": 0, "vendors": 0, "cloud_workers": 0, "call_agents": 0}
    remaining = budget
    
    for name, cost, _, max_c in items:
        count = min(max_c, int(remaining // cost))
        alloc[name] = count
        remaining -= count * cost
        
    return alloc
