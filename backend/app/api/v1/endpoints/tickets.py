import datetime
import json
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List, Optional

from app.db.session import get_db
from app.db.models import Ticket, TicketMessage, InternalNote, TicketAuditLog
from app.schemas.ticket import (
    TicketCreate, TicketOut, TicketDetailOut, TicketPriorityUpdate,
    TicketStatusUpdate, TicketClaimRequest, InternalNoteCreate, InternalNoteOut,
    TicketMessageCreate, TicketMessageOut, TicketRatingCreate
)
from app.services.transcript import generate_html_transcript, generate_text_transcript

router = APIRouter()

@router.get("/{guild_id}", response_model=List[TicketOut])
async def list_tickets(
    guild_id: str,
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Ticket).where(Ticket.guild_id == guild_id)
    if status and status != "All":
        stmt = stmt.where(Ticket.status == status)
    if category and category != "All":
        stmt = stmt.where(Ticket.category == category)
    if priority and priority != "All":
        stmt = stmt.where(Ticket.priority == priority)

    stmt = stmt.order_by(Ticket.created_at.desc())
    res = await db.execute(stmt)
    tickets = res.scalars().all()

    if search:
        q = search.lower()
        tickets = [
            t for t in tickets
            if q in str(t.ticket_number)
            or q in t.customer_name.lower()
            or q in t.subject.lower()
            or q in t.customer_id.lower()
        ]

    return tickets

@router.post("/{guild_id}", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
async def create_ticket(guild_id: str, payload: TicketCreate, db: AsyncSession = Depends(get_db)):
    # Calculate next ticket number
    stmt_num = select(func.max(Ticket.ticket_number)).where(Ticket.guild_id == guild_id)
    res_num = await db.execute(stmt_num)
    curr_max = res_num.scalar() or 1000

    now = datetime.datetime.utcnow()
    ticket = Ticket(
        ticket_number=curr_max + 1,
        guild_id=guild_id,
        customer_id=payload.customer_id,
        customer_name=payload.customer_name,
        category=payload.category,
        subject=payload.subject,
        description=payload.description,
        priority=payload.priority,
        status="Open",
        created_at=now
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    # Initial system message
    db.add(TicketMessage(
        ticket_id=ticket.id,
        author_id=payload.customer_id,
        author_name=payload.customer_name,
        is_staff=False,
        content=payload.description,
        timestamp=now
    ))
    db.add(TicketAuditLog(
        ticket_id=ticket.id,
        guild_id=guild_id,
        actor_id=payload.customer_id,
        actor_name=payload.customer_name,
        action="ticket_created",
        details=f"Created ticket #{ticket.ticket_number} under category '{ticket.category}'"
    ))
    await db.commit()
    return ticket

@router.get("/{guild_id}/{ticket_id}", response_model=TicketDetailOut)
async def get_ticket_detail(guild_id: str, ticket_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(Ticket).where(and_(Ticket.guild_id == guild_id, Ticket.id == ticket_id))
    res = await db.execute(stmt)
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    stmt_msgs = select(TicketMessage).where(TicketMessage.ticket_id == ticket.id).order_by(TicketMessage.timestamp.asc())
    res_msgs = await db.execute(stmt_msgs)
    msgs = res_msgs.scalars().all()

    stmt_notes = select(InternalNote).where(InternalNote.ticket_id == ticket.id).order_by(InternalNote.created_at.asc())
    res_notes = await db.execute(stmt_notes)
    notes = res_notes.scalars().all()

    return TicketDetailOut(
        id=ticket.id,
        ticket_number=ticket.ticket_number,
        guild_id=ticket.guild_id,
        customer_id=ticket.customer_id,
        customer_name=ticket.customer_name,
        category=ticket.category,
        subject=ticket.subject,
        description=ticket.description,
        status=ticket.status,
        priority=ticket.priority,
        assigned_agent_id=ticket.assigned_agent_id,
        assigned_agent_name=ticket.assigned_agent_name,
        created_at=ticket.created_at,
        first_response_at=ticket.first_response_at,
        resolved_at=ticket.resolved_at,
        closed_at=ticket.closed_at,
        rating=ticket.rating,
        rating_comment=ticket.rating_comment,
        messages=[TicketMessageOut.model_validate(m) for m in msgs],
        notes=[InternalNoteOut.model_validate(n) for n in notes],
        has_transcript=bool(ticket.transcript_html)
    )

@router.post("/{guild_id}/{ticket_id}/claim", response_model=TicketOut)
async def claim_ticket(guild_id: str, ticket_id: int, payload: TicketClaimRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(Ticket).where(and_(Ticket.guild_id == guild_id, Ticket.id == ticket_id))
    res = await db.execute(stmt)
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    ticket.assigned_agent_id = payload.agent_id
    ticket.assigned_agent_name = payload.agent_name
    if ticket.status == "Open":
        ticket.status = "In Progress"

    db.add(TicketAuditLog(
        ticket_id=ticket.id,
        guild_id=guild_id,
        actor_id=payload.agent_id,
        actor_name=payload.agent_name,
        action="ticket_claimed",
        details=f"Assigned ticket to agent '{payload.agent_name}'"
    ))
    await db.commit()
    await db.refresh(ticket)
    return ticket

@router.post("/{guild_id}/{ticket_id}/status", response_model=TicketOut)
async def update_status(guild_id: str, ticket_id: int, payload: TicketStatusUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Ticket).where(and_(Ticket.guild_id == guild_id, Ticket.id == ticket_id))
    res = await db.execute(stmt)
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    ticket.status = payload.status
    now = datetime.datetime.utcnow()
    if payload.status == "Resolved" and not ticket.resolved_at:
        ticket.resolved_at = now
    elif payload.status == "Closed":
        if not ticket.closed_at:
            ticket.closed_at = now
        # Generate transcript
        stmt_m = select(TicketMessage).where(TicketMessage.ticket_id == ticket.id).order_by(TicketMessage.timestamp.asc())
        res_m = await db.execute(stmt_m)
        msgs = res_m.scalars().all()
        ticket.transcript_html = generate_html_transcript(ticket, msgs)

    db.add(TicketAuditLog(
        ticket_id=ticket.id,
        guild_id=guild_id,
        actor_id="staff",
        actor_name="Staff Member",
        action="status_changed",
        details=f"Status set to '{payload.status}'"
    ))
    await db.commit()
    await db.refresh(ticket)
    return ticket

@router.post("/{guild_id}/{ticket_id}/priority", response_model=TicketOut)
async def update_priority(guild_id: str, ticket_id: int, payload: TicketPriorityUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Ticket).where(and_(Ticket.guild_id == guild_id, Ticket.id == ticket_id))
    res = await db.execute(stmt)
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    ticket.priority = payload.priority
    db.add(TicketAuditLog(
        ticket_id=ticket.id,
        guild_id=guild_id,
        actor_id="staff",
        actor_name="Staff Member",
        action="priority_changed",
        details=f"Priority updated to '{payload.priority}'"
    ))
    await db.commit()
    await db.refresh(ticket)
    return ticket

@router.post("/{guild_id}/{ticket_id}/messages", response_model=TicketMessageOut)
async def add_message(guild_id: str, ticket_id: int, payload: TicketMessageCreate, db: AsyncSession = Depends(get_db)):
    stmt = select(Ticket).where(and_(Ticket.guild_id == guild_id, Ticket.id == ticket_id))
    res = await db.execute(stmt)
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    now = datetime.datetime.utcnow()
    # If first staff response, record SLA timestamp
    if payload.is_staff and not ticket.first_response_at:
        ticket.first_response_at = now
        ticket.status = "Waiting for Customer"
    elif not payload.is_staff and ticket.status == "Waiting for Customer":
        ticket.status = "Waiting for Staff"

    msg = TicketMessage(
        ticket_id=ticket.id,
        author_id=payload.author_id,
        author_name=payload.author_name,
        is_staff=payload.is_staff,
        content=payload.content,
        timestamp=now
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg

@router.post("/{guild_id}/{ticket_id}/notes", response_model=InternalNoteOut)
async def add_internal_note(guild_id: str, ticket_id: int, payload: InternalNoteCreate, db: AsyncSession = Depends(get_db)):
    stmt = select(Ticket).where(and_(Ticket.guild_id == guild_id, Ticket.id == ticket_id))
    res = await db.execute(stmt)
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    note = InternalNote(
        ticket_id=ticket.id,
        staff_id=payload.staff_id,
        staff_name=payload.staff_name,
        note_text=payload.note_text
    )
    db.add(note)
    db.add(TicketAuditLog(
        ticket_id=ticket.id,
        guild_id=guild_id,
        actor_id=payload.staff_id,
        actor_name=payload.staff_name,
        action="note_added",
        details="Added confidential staff internal note."
    ))
    await db.commit()
    await db.refresh(note)
    return note

@router.get("/{guild_id}/{ticket_id}/transcript")
async def download_transcript(guild_id: str, ticket_id: int, format: str = "html", db: AsyncSession = Depends(get_db)):
    stmt = select(Ticket).where(and_(Ticket.guild_id == guild_id, Ticket.id == ticket_id))
    res = await db.execute(stmt)
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    stmt_m = select(TicketMessage).where(TicketMessage.ticket_id == ticket.id).order_by(TicketMessage.timestamp.asc())
    res_m = await db.execute(stmt_m)
    msgs = res_m.scalars().all()

    if format == "text":
        content = generate_text_transcript(ticket, msgs)
        return Response(content=content, media_type="text/plain", headers={
            "Content-Disposition": f"attachment; filename=transcript_{ticket.ticket_number}.txt"
        })
    else:
        content = ticket.transcript_html or generate_html_transcript(ticket, msgs)
        return Response(content=content, media_type="text/html", headers={
            "Content-Disposition": f"inline; filename=transcript_{ticket.ticket_number}.html"
        })

@router.post("/{guild_id}/{ticket_id}/rate")
async def rate_ticket(guild_id: str, ticket_id: int, payload: TicketRatingCreate, db: AsyncSession = Depends(get_db)):
    stmt = select(Ticket).where(and_(Ticket.guild_id == guild_id, Ticket.id == ticket_id))
    res = await db.execute(stmt)
    ticket = res.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    ticket.rating = payload.rating
    ticket.rating_comment = payload.comment
    db.add(TicketAuditLog(
        ticket_id=ticket.id,
        guild_id=guild_id,
        actor_id=ticket.customer_id,
        actor_name=ticket.customer_name,
        action="rating_received",
        details=f"Customer submitted {payload.rating}-star review."
    ))
    await db.commit()
    return {"message": "Rating recorded successfully.", "rating": payload.rating}
