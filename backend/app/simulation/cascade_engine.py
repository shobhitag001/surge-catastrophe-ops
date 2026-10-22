"""
Layer 4: Bottleneck & Cascade Prediction Layer
Identifies primary and secondary cascading bottlenecks over a forward-looking timeline
(e.g., predicting that surveyor capacity will breach thresholds in 11 hours, triggering downstream repair and settlement delays).
"""

from typing import Dict, List, Any

def analyze_bottlenecks_and_cascades(
    simulation_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Parses hourly timeline to detect:
    - Time-to-Breach (TTB) for each stage
    - Primary critical bottleneck (first stage turning RED)
    - Secondary cascading bottlenecks (subsequent stages turning RED)
    - Cascade dependency chains (e.g., Survey -> Repair Authorization -> Settlement)
    """
    timeline = simulation_result.get("hourly_timeline", [])
    
    stage_breach_hours = {}
    stage_peak_backlogs = {}
    
    # Track when each stage first turns AMBER and RED
    stage_amber_first = {}
    stage_red_first = {}
    
    for record in timeline:
        t = record["hour"]
        statuses = record.get("stage_statuses", {})
        queues = record.get("queues", {})
        
        for stage, data in statuses.items():
            status = data.get("status")
            backlog = queues.get(stage, 0)
            
            if stage not in stage_peak_backlogs or backlog > stage_peak_backlogs[stage]:
                stage_peak_backlogs[stage] = backlog
                
            if status == "AMBER" and stage not in stage_amber_first:
                stage_amber_first[stage] = t
                
            if status == "RED" and stage not in stage_red_first:
                stage_red_first[stage] = t
                stage_breach_hours[stage] = t

    # Sort stages by their first RED breach hour
    sorted_red_stages = sorted(stage_red_first.items(), key=lambda x: x[1])
    
    primary_bottleneck = None
    cascading_bottlenecks = []
    
    if sorted_red_stages:
        prim_stage, prim_time = sorted_red_stages[0]
        primary_bottleneck = {
            "stage": prim_stage,
            "time_to_breach_hours": prim_time,
            "label": f"T+{prim_time:02d}h",
            "peak_backlog": stage_peak_backlogs.get(prim_stage, 0),
            "severity": "CRITICAL",
            "root_cause": (
                "Field Surveyor capacity limit (physical inspection bottleneck)"
                if prim_stage == "Survey" else
                "Desk adjuster triage saturation"
                if prim_stage == "Assessment" else
                f"Operational saturation at {prim_stage.replace('_', ' ')}"
            ),
            "description": f"Stage {prim_stage.replace('_', ' ')} reaches critical saturation at T+{prim_time}h, initiating downstream queue cascading."
        }
        
        for stage, tm in sorted_red_stages[1:]:
            delay_from_primary = tm - prim_time
            cascading_bottlenecks.append({
                "stage": stage,
                "time_to_breach_hours": tm,
                "label": f"T+{tm:02d}h",
                "delay_from_primary_hours": delay_from_primary,
                "peak_backlog": stage_peak_backlogs.get(stage, 0),
                "severity": "HIGH",
                "cascade_trigger": prim_stage,
                "description": f"Cascading delay: {stage.replace('_', ' ')} breaches at T+{tm}h (+{delay_from_primary}h after {prim_stage}) as backlogged claims hit downstream capacity."
            })

    # Cascade Network Nodes & Edges for Visualization
    cascade_graph = {
        "nodes": [
            {"id": "FNOL", "label": "1. FNOL Ingestion", "breach_hour": stage_red_first.get("FNOL", None)},
            {"id": "Validation", "label": "2. Policy Validation", "breach_hour": stage_red_first.get("Validation", None)},
            {"id": "Document_Processing", "label": "3. Document AI", "breach_hour": stage_red_first.get("Document_Processing", None)},
            {"id": "Assessment", "label": "4. Desk Assessment", "breach_hour": stage_red_first.get("Assessment", None)},
            {"id": "Survey", "label": "5. Field Survey", "breach_hour": stage_red_first.get("Survey", None)},
            {"id": "Repair_Authorization", "label": "6. Repair Authorization", "breach_hour": stage_red_first.get("Repair_Authorization", None)},
            {"id": "Approval", "label": "7. Financial Approval", "breach_hour": stage_red_first.get("Approval", None)},
            {"id": "Settlement", "label": "8. Final Settlement", "breach_hour": stage_red_first.get("Settlement", None)}
        ],
        "edges": [
            {"from": "FNOL", "to": "Validation", "type": "sequential"},
            {"from": "Validation", "to": "Document_Processing", "type": "sequential"},
            {"from": "Document_Processing", "to": "Assessment", "type": "sequential"},
            {"from": "Assessment", "to": "Survey", "type": "triage_split", "share": "45% physical"},
            {"from": "Assessment", "to": "Repair_Authorization", "type": "fast_track", "share": "55% virtual"},
            {"from": "Survey", "to": "Repair_Authorization", "type": "choke_cascade"},
            {"from": "Repair_Authorization", "to": "Approval", "type": "sequential"},
            {"from": "Approval", "to": "Settlement", "type": "sequential"}
        ]
    }

    # Predictive narrative insights
    narrative_insights = []
    if primary_bottleneck:
        narrative_insights.append(
            f"PRIMARY BOTTLENECK: {primary_bottleneck['stage'].replace('_', ' ')} capacity will breach in {primary_bottleneck['time_to_breach_hours']} hours."
        )
    if cascading_bottlenecks:
        stages_str = " -> ".join([b["stage"].replace("_", " ") for b in cascading_bottlenecks])
        narrative_insights.append(
            f"CASCADING PROPAGATION: Backlog pressure will cascade sequentially to {stages_str} within T+18h to T+42h."
        )
    if "Settlement" in stage_red_first:
        narrative_insights.append(
            f"SLA RISK ALERT: Final Claim Settlement will breach regulatory SLAs at T+{stage_red_first['Settlement']}h without operational capacity interventions."
        )

    return {
        "primary_bottleneck": primary_bottleneck,
        "cascading_bottlenecks": cascading_bottlenecks,
        "stage_breach_hours": stage_breach_hours,
        "stage_peak_backlogs": stage_peak_backlogs,
        "cascade_graph": cascade_graph,
        "narrative_insights": narrative_insights
    }
