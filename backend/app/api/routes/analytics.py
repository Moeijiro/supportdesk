from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict

from app.db.session import get_db
from app.models import Ticket
from app.schemas.analytics import OverviewStatsOut, CategoryBreakdownOut
from app.services.sla import calculate_ticket_sla_metrics

router = APIRouter()

@router.get("/{guild_id}/overview", response_model=OverviewStatsOut)
async def get_overview(guild_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Ticket).where(Ticket.guild_id == guild_id)
    res = await db.execute(stmt)
    tickets = res.scalars().all()
    metrics = calculate_ticket_sla_metrics(tickets)
    return OverviewStatsOut(**metrics)

@router.get("/{guild_id}/categories", response_model=List[CategoryBreakdownOut])
async def get_category_breakdown(guild_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Ticket).where(Ticket.guild_id == guild_id)
    res = await db.execute(stmt)
    tickets = res.scalars().all()

    counts: Dict[str, int] = {}
    for t in tickets:
        counts[t.category] = counts.get(t.category, 0) + 1

    total = len(tickets) or 1
    return [
        CategoryBreakdownOut(category=cat, count=c, percentage=round((c / total) * 100, 1))
        for cat, c in counts.items()
    ]
