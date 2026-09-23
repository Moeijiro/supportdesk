from pydantic import BaseModel
from typing import List, Dict, Any

class OverviewStatsOut(BaseModel):
    open_tickets_count: int
    unassigned_count: int
    waiting_for_staff_count: int
    resolved_today_count: int
    average_first_response_minutes: float
    average_resolution_hours: float
    total_tickets_recorded: int

class CategoryBreakdownOut(BaseModel):
    category: str
    count: int
    percentage: float
