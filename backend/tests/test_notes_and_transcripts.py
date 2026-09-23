import pytest
import datetime
from sqlalchemy import select
from app.db.models import Ticket, TicketMessage, InternalNote
from app.services.transcript import generate_text_transcript, generate_html_transcript
from app.services.sla import calculate_ticket_sla_metrics
from tests.conftest import TestingSessionLocal

@pytest.mark.asyncio
async def test_transcript_generation():
    ticket = Ticket(
        ticket_number=101,
        guild_id="g1",
        customer_id="cust_1",
        customer_name="John Doe",
        category="Billing",
        subject="Invoice Query",
        description="I have a question about my invoice.",
        status="Closed",
        priority="Normal",
        created_at=datetime.datetime(2026, 9, 20, 10, 0, 0)
    )
    msgs = [
        TicketMessage(
            author_id="cust_1",
            author_name="John Doe",
            is_staff=False,
            content="Hello support team!",
            timestamp=datetime.datetime(2026, 9, 20, 10, 1, 0)
        ),
        TicketMessage(
            author_id="staff_1",
            author_name="Agent Smith",
            is_staff=True,
            content="Hello John, checking this now.",
            timestamp=datetime.datetime(2026, 9, 20, 10, 5, 0)
        )
    ]

    txt = generate_text_transcript(ticket, msgs)
    assert "SUPPORTDESK TICKET TRANSCRIPT #101" in txt
    assert "[STAFF] Agent Smith: Hello John, checking this now." in txt

    html_out = generate_html_transcript(ticket, msgs)
    assert "<title>Ticket #101 - Invoice Query</title>" in html_out
    assert "Agent Smith" in html_out
    assert "STAFF" in html_out

def test_sla_calculation():
    now = datetime.datetime.utcnow()
    t1 = Ticket(
        status="In Progress",
        created_at=now - datetime.timedelta(minutes=30),
        first_response_at=now - datetime.timedelta(minutes=20),
        resolved_at=None
    )
    t2 = Ticket(
        status="Resolved",
        created_at=now - datetime.timedelta(hours=2),
        first_response_at=now - datetime.timedelta(hours=1, minutes=50),
        resolved_at=now - datetime.timedelta(minutes=10)
    )

    metrics = calculate_ticket_sla_metrics([t1, t2])
    assert metrics["open_tickets_count"] == 1
    assert metrics["average_first_response_minutes"] == 10.0
    assert metrics["average_resolution_hours"] > 1.5
