"""Demo data for the Acme Cloud support server.

Seeding is idempotent: the first call creates the server, canned responses and a
week of tickets; later calls change nothing. (Seeding twice used to insert the
same ticket numbers again and fail on the unique (guild, number) index.)
"""

import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import CannedResponse, GuildConfig, InternalNote, Ticket, TicketMessage
from app.db.session import get_db
from app.services.transcript import generate_html_transcript

router = APIRouter()

DEMO_GUILD_ID = "support-demo-999"
AGENTS = {"agent_1": "Alex Morgan", "agent_2": "Elena Park", "agent_3": "Sam Okafor"}

CANNED = [
    ("Greeting", "Hi! Thanks for reaching out to Acme Cloud support — an agent is looking at your ticket now.", "General"),
    ("Order verification", "Could you confirm your order number and the email address used at checkout?", "Billing"),
    ("Log collection", "Please export the debug log from Settings → Diagnostics and attach it here so we can look at the stack trace.", "Technical"),
]

# number, customer id, customer, category, subject, description, status, priority, agent,
# opened (minutes ago), first response (min after open), resolved (min after open), rating, comment, conversation, note
TICKETS = [
    (1001, "c_311", "Sarah_Dev", "Technical Issue", "API gateway returns 502 on /v1/auth",
     "Our staging cluster started returning 502 Bad Gateway on /v1/auth this morning. Production looks fine.",
     "In Progress", "Urgent", "agent_1", 125, 14, None, None, None,
     [("staff", "I've taken this and I'm checking the upstream timeouts on your staging cluster now."),
      ("customer", "Thanks — it's intermittent, roughly one in five requests."),
      ("staff", "Found it: the keep-alive timeout on the proxy is shorter than the auth service's. Rolling a fix to staging.")],
     "Proxy keepalive 5s vs auth service 30s on cluster B. Same config exists in eu-west — check before closing."),
    (1002, "c_207", "Marcus_Corp", "Billing", "Invoice charges 20% VAT for an EU business",
     "The September invoice has 20% VAT, but we're an EU company with a VAT ID — it should be reverse charge.",
     "Waiting for Customer", "Normal", "agent_2", 300, 11, None, None, None,
     [("staff", "Sorry about that. Could you send the VAT ID so I can reissue the invoice with reverse charge?")],
     "Customer's VAT ID wasn't validated at signup — VIES was down that day."),
    (1003, "c_118", "Elena_K", "Account Help", "Add a hardware security key to the root account",
     "I'd like to link a YubiKey to our organisation's root account. Is that supported?",
     "Resolved", "Low", "agent_1", 1440, 9, 240, 5, "Quick and clear, thanks!",
     [("staff", "Yes — Settings → Security → Add security key. You'll need to confirm with your current 2FA first."),
      ("customer", "Done, it works. Thank you!")], None),
    (1004, "c_402", "DevOps_Dan", "Purchase Question", "Volume pricing for 50+ seats",
     "Do you offer discounts for annual plans above 50 developer seats?",
     "Open", "Normal", None, 25, None, None, None, None, [], None),
    (1005, "c_415", "pixel_nora", "Technical Issue", "Webhooks stopped arriving after domain change",
     "We moved our app to a new domain yesterday and no webhooks have arrived since.",
     "Waiting for Staff", "High", "agent_3", 95, 18, None, None, None,
     [("staff", "Did you update the endpoint URL under Settings → Webhooks, or only the DNS?"),
      ("customer", "Both, and the test delivery says 'certificate verify failed'.")],
     "Their new certificate is missing the intermediate chain — ask them to reissue with the full chain."),
    (1006, "c_133", "jonas.b", "Billing", "Charged twice for the September renewal",
     "My card shows two charges of $49 on 1 September.",
     "Resolved", "High", "agent_2", 4320, 6, 95, 4, "Refund arrived next day.",
     [("staff", "I can see a duplicate authorisation. I've refunded the second charge — it takes 3–5 working days."),
      ("customer", "Thanks, I'll keep an eye out.")], None),
    (1007, "c_501", "mira_builds", "Account Help", "Can't sign in after changing my email",
     "I changed my login email and now the password reset link never arrives.",
     "Open", "High", None, 8, None, None, None, None, [], None),
    (1008, "c_288", "TheoGrant", "Other", "Feature request: CSV export of audit logs",
     "Our compliance team needs the audit log as CSV every month.",
     "Closed", "Low", "agent_3", 7200, 42, 180, 5, None,
     [("staff", "Good news — CSV export shipped last week. It's under Audit log → Export.")], None),
    (1009, "c_377", "kai.ops", "Technical Issue", "Deploys stuck at 'Building' for 20 minutes",
     "Every deploy since 10:00 hangs at the build step. No logs are shown.",
     "Resolved", "Urgent", "agent_1", 2880, 4, 55, 5, "Great response time.",
     [("staff", "We had a stuck build runner in us-east. It's been replaced — could you retry?"),
      ("customer", "Retried, it went through in 2 minutes. Thanks!")], None),
    (1010, "c_244", "lena.writes", "Purchase Question", "Do you offer non-profit pricing?",
     "We're a registered charity — is there a discount?",
     "Waiting for Customer", "Low", "agent_2", 1500, 35, None, None, None,
     [("staff", "We do: 50% off Team plans. Could you send your charity registration number?")], None),
]


@router.post("/seed")
async def seed_demo_support_data(db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(GuildConfig).where(GuildConfig.guild_id == DEMO_GUILD_ID))
    if existing.scalar_one_or_none() is not None:
        return {"message": "Demo data is already loaded.", "created": False}

    db.add(GuildConfig(guild_id=DEMO_GUILD_ID, guild_name="Acme Cloud", support_channel_id="channel-support-hub",
                       staff_role_id="role-support-staff", is_enabled=True))
    for title, text, category in CANNED:
        db.add(CannedResponse(guild_id=DEMO_GUILD_ID, title=title, content=text, category=category, usage_count=5))

    now = datetime.datetime.utcnow()
    for (number, customer_id, customer, category, subject, description, status, priority, agent_id,
         opened_ago, first_after, resolved_after, rating, comment, conversation, note) in TICKETS:
        opened = now - datetime.timedelta(minutes=opened_ago)
        first = opened + datetime.timedelta(minutes=first_after) if first_after is not None else None
        resolved = opened + datetime.timedelta(minutes=resolved_after) if resolved_after is not None else None
        agent_name = AGENTS.get(agent_id) if agent_id else None
        ticket = Ticket(
            ticket_number=number, guild_id=DEMO_GUILD_ID, customer_id=customer_id, customer_name=customer,
            category=category, subject=subject, description=description, status=status, priority=priority,
            assigned_agent_id=agent_id, assigned_agent_name=agent_name, created_at=opened,
            first_response_at=first, resolved_at=resolved,
            closed_at=resolved + datetime.timedelta(hours=1) if resolved and status == "Closed" else None,
            rating=rating, rating_comment=comment,
        )
        db.add(ticket)
        await db.flush()

        messages = [TicketMessage(ticket_id=ticket.id, author_id=customer_id, author_name=customer, is_staff=False,
                                  content=description, timestamp=opened)]
        # Spread the replies between the first response and now (or the resolution).
        end = resolved or now
        start = first or opened
        for index, (who, text) in enumerate(conversation):
            at = start + (end - start) * (index / max(1, len(conversation)))
            staff = who == "staff"
            messages.append(TicketMessage(ticket_id=ticket.id, author_id=agent_id if staff else customer_id,
                                          author_name=agent_name if staff else customer, is_staff=staff,
                                          content=text, timestamp=at))
        db.add_all(messages)
        if note and agent_id:
            db.add(InternalNote(ticket_id=ticket.id, staff_id=agent_id, staff_name=agent_name, note_text=note,
                                created_at=start + datetime.timedelta(minutes=2)))
        if status in ("Resolved", "Closed"):
            ticket.transcript_html = generate_html_transcript(ticket, messages)

    await db.commit()
    return {"message": f"Loaded {len(TICKETS)} demo tickets for Acme Cloud.", "created": True}
