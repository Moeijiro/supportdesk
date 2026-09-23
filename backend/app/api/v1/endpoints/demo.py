import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models import GuildConfig, Ticket, TicketMessage, InternalNote, CannedResponse
from app.services.transcript import generate_html_transcript

router = APIRouter()

DEMO_GUILD_ID = "support-demo-999"

@router.post("/seed")
async def seed_demo_support_data(db: AsyncSession = Depends(get_db)):
    # 1. Guild config
    stmt_g = select(GuildConfig).where(GuildConfig.guild_id == DEMO_GUILD_ID)
    res_g = await db.execute(stmt_g)
    if not res_g.scalar_one_or_none():
        db.add(GuildConfig(
            guild_id=DEMO_GUILD_ID,
            guild_name="Acme Cloud Technologies",
            support_channel_id="channel-support-hub",
            staff_role_id="role-support-staff",
            is_enabled=True
        ))

    # 2. Canned responses
    canned_samples = [
        ("Greeting", "Hello! Thank you for reaching out to Acme Cloud Support. An agent is reviewing your inquiry.", "General"),
        ("Order Verification", "Could you please confirm your order number and the email address used during purchase?", "Billing"),
        ("Log Collection", "Please export your server debug log and upload it here so we can analyze the error stack trace.", "Technical")
    ]
    for title, text, cat in canned_samples:
        db.add(CannedResponse(guild_id=DEMO_GUILD_ID, title=title, content=text, category=cat, usage_count=5))

    # 3. Tickets
    now = datetime.datetime.utcnow()
    demo_tickets = [
        (
            1001, "c_1", "Sarah_Dev", "Technical Issue", "API Gateway 502 Bad Gateway",
            "Our staging cluster started throwing 502 errors when hitting /v1/auth since this morning.",
            "In Progress", "Urgent", "agent_1", "Alex (Lead Engineer)",
            now - datetime.timedelta(hours=2), now - datetime.timedelta(hours=1, minutes=45), None, None, None
        ),
        (
            1002, "c_2", "Marcus_Corp", "Billing", "Invoice VAT mismatch on Pro Tier",
            "The invoice issued for September reflects a 20% VAT rate instead of the reverse charge applicable to our EU entity.",
            "Waiting for Customer", "Normal", "agent_2", "Elena (Billing Ops)",
            now - datetime.timedelta(hours=5), now - datetime.timedelta(hours=4, minutes=50), None, None, None
        ),
        (
            1003, "c_3", "Elena_K", "Account Help", "Enable 2FA Hardware Security Key",
            "I would like to link a YubiKey to our organizational root account.",
            "Resolved", "Low", "agent_1", "Alex (Lead Engineer)",
            now - datetime.timedelta(days=1), now - datetime.timedelta(hours=23), now - datetime.timedelta(hours=20), 5, "Super quick resolution, thanks!"
        ),
        (
            1004, "c_4", "DevOps_Dan", "Purchase Question", "Volume licensing inquiry for 50+ seats",
            "Do you offer tiered discounts for annual commitments above 50 enterprise developers?",
            "Open", "Normal", None, None,
            now - datetime.timedelta(minutes=25), None, None, None, None
        ),
    ]

    for num, cid, cname, cat, subj, desc, status, priority, aid, aname, cr_at, fr_at, res_at, rating, r_comment in demo_tickets:
        ticket = Ticket(
            ticket_number=num,
            guild_id=DEMO_GUILD_ID,
            customer_id=cid,
            customer_name=cname,
            category=cat,
            subject=subj,
            description=desc,
            status=status,
            priority=priority,
            assigned_agent_id=aid,
            assigned_agent_name=aname,
            created_at=cr_at,
            first_response_at=fr_at,
            resolved_at=res_at,
            rating=rating,
            rating_comment=r_comment
        )
        db.add(ticket)
        await db.commit()
        await db.refresh(ticket)

        # Messages
        db.add(TicketMessage(
            ticket_id=ticket.id,
            author_id=cid,
            author_name=cname,
            is_staff=False,
            content=desc,
            timestamp=cr_at
        ))
        if fr_at and aid and aname:
            db.add(TicketMessage(
                ticket_id=ticket.id,
                author_id=aid,
                author_name=aname,
                is_staff=True,
                content="Hello! I've taken ownership of your ticket and am actively looking into this now.",
                timestamp=fr_at
            ))

        if status == "Resolved":
            ticket.transcript_html = generate_html_transcript(ticket, [
                TicketMessage(author_name=cname, content=desc, is_staff=False, timestamp=cr_at),
                TicketMessage(author_name=aname, content="Issue resolved!", is_staff=True, timestamp=res_at)
            ])
            await db.commit()

        # Add private staff note on ticket 1001
        if num == 1001:
            db.add(InternalNote(
                ticket_id=ticket.id,
                staff_id="agent_1",
                staff_name="Alex (Lead Engineer)",
                note_text="Investigating Nginx upstream proxy keepalive timeout configs on cluster B.",
                created_at=now - datetime.timedelta(hours=1)
            ))

    await db.commit()
    return {"message": "SupportDesk demo seeded successfully for support-demo-999"}
