import datetime
from typing import Optional, Dict, Any, List
from app.db.models import Ticket

def calculate_ticket_sla_metrics(tickets: List[Ticket]) -> Dict[str, Any]:
    first_response_times = []
    resolution_times = []

    open_count = 0
    unassigned_count = 0
    waiting_for_staff_count = 0
    resolved_today_count = 0

    now = datetime.datetime.utcnow()
    today_start = datetime.datetime(now.year, now.month, now.day)

    for t in tickets:
        if t.status in ["Open", "Waiting for Staff", "In Progress"]:
            open_count += 1
            if not t.assigned_agent_id:
                unassigned_count += 1
            if t.status == "Waiting for Staff" or t.status == "Open":
                waiting_for_staff_count += 1

        if t.first_response_at and t.created_at:
            delta_mins = (t.first_response_at - t.created_at).total_seconds() / 60.0
            if delta_mins >= 0:
                first_response_times.append(delta_mins)

        if t.resolved_at and t.created_at:
            delta_hours = (t.resolved_at - t.created_at).total_seconds() / 3600.0
            if delta_hours >= 0:
                resolution_times.append(delta_hours)
            if t.resolved_at >= today_start:
                resolved_today_count += 1

    avg_first_response = round(sum(first_response_times) / len(first_response_times), 1) if first_response_times else 0.0
    avg_resolution = round(sum(resolution_times) / len(resolution_times), 1) if resolution_times else 0.0

    return {
        "open_tickets_count": open_count,
        "unassigned_count": unassigned_count,
        "waiting_for_staff_count": waiting_for_staff_count,
        "resolved_today_count": resolved_today_count,
        "average_first_response_minutes": avg_first_response,
        "average_resolution_hours": avg_resolution,
        "total_tickets_recorded": len(tickets)
    }
