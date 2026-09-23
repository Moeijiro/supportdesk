import pytest

@pytest.mark.asyncio
async def test_ticket_lifecycle_api(client):
    guild_id = "test-guild-99"

    # 1. Create ticket
    payload = {
        "customer_id": "cust_123",
        "customer_name": "Alice",
        "category": "Technical Issue",
        "subject": "WebSocket Connection Drops",
        "description": "Every 5 minutes our client drops connection with code 1006.",
        "priority": "High"
    }
    create_res = await client.post(f"/api/v1/tickets/{guild_id}", json=payload)
    assert create_res.status_code == 201
    ticket = create_res.json()
    ticket_id = ticket["id"]
    assert ticket["status"] == "Open"
    assert ticket["priority"] == "High"

    # 2. Claim ticket
    claim_res = await client.post(f"/api/v1/tickets/{guild_id}/{ticket_id}/claim", json={
        "agent_id": "agent_7",
        "agent_name": "Agent 007"
    })
    assert claim_res.status_code == 200
    assert claim_res.json()["assigned_agent_name"] == "Agent 007"
    assert claim_res.json()["status"] == "In Progress"

    # 3. Add private note
    note_res = await client.post(f"/api/v1/tickets/{guild_id}/{ticket_id}/notes", json={
        "staff_id": "agent_7",
        "staff_name": "Agent 007",
        "note_text": "Customer is on enterprise SLA tier."
    })
    assert note_res.status_code == 200
    assert note_res.json()["note_text"] == "Customer is on enterprise SLA tier."

    # 4. Resolve ticket
    res_status = await client.post(f"/api/v1/tickets/{guild_id}/{ticket_id}/status", json={"status": "Resolved"})
    assert res_status.status_code == 200
    assert res_status.json()["status"] == "Resolved"

    # 5. Rate ticket (allowed once resolved)
    rate_res = await client.post(f"/api/v1/tickets/{guild_id}/{ticket_id}/rate", json={
        "rating": 5,
        "comment": "Quick and painless resolution!"
    })
    assert rate_res.status_code == 200

@pytest.mark.asyncio
async def test_demo_seed_and_analytics(client):
    seed_res = await client.post("/api/v1/demo/seed")
    assert seed_res.status_code == 200

    analytics_res = await client.get("/api/v1/analytics/support-demo-999/overview")
    assert analytics_res.status_code == 200
    data = analytics_res.json()
    assert data["total_tickets_recorded"] >= 4
    assert data["open_tickets_count"] >= 1


@pytest.mark.asyncio
async def test_demo_seed_is_idempotent(client):
    first = await client.post("/api/v1/demo/seed")
    second = await client.post("/api/v1/demo/seed")
    assert first.status_code == 200 and first.json()["created"] is True
    assert second.status_code == 200 and second.json()["created"] is False

    tickets = (await client.get("/api/v1/tickets/support-demo-999")).json()
    numbers = [t["ticket_number"] for t in tickets]
    assert len(numbers) == len(set(numbers)) == 10


async def _open_ticket(client, guild_id="g-rules"):
    res = await client.post(f"/api/v1/tickets/{guild_id}", json={
        "customer_id": "c1", "customer_name": "Bea", "category": "Billing",
        "subject": "Refund please", "description": "I was charged twice.", "priority": "Normal",
    })
    assert res.status_code == 201
    return res.json()["id"]


@pytest.mark.asyncio
async def test_unknown_status_priority_and_category_are_rejected(client):
    ticket_id = await _open_ticket(client)
    assert (await client.post(f"/api/v1/tickets/g-rules/{ticket_id}/status", json={"status": "Done"})).status_code == 422
    assert (await client.post(f"/api/v1/tickets/g-rules/{ticket_id}/priority", json={"priority": "ASAP"})).status_code == 422
    bad = await client.post("/api/v1/tickets/g-rules", json={
        "customer_id": "c1", "customer_name": "Bea", "category": "Spam", "subject": "Hello", "description": "Hello there",
    })
    assert bad.status_code == 422


@pytest.mark.asyncio
async def test_closed_tickets_take_no_replies_and_reopening_resets_resolution(client):
    ticket_id = await _open_ticket(client)
    closed = await client.post(f"/api/v1/tickets/g-rules/{ticket_id}/status", json={"status": "Closed"})
    assert closed.json()["resolved_at"] is not None and closed.json()["closed_at"] is not None

    reply = await client.post(f"/api/v1/tickets/g-rules/{ticket_id}/messages", json={
        "author_id": "agent_1", "author_name": "Alex", "is_staff": True, "content": "Anything else?",
    })
    assert reply.status_code == 409

    reopened = await client.post(f"/api/v1/tickets/g-rules/{ticket_id}/status", json={"status": "In Progress"})
    assert reopened.json()["resolved_at"] is None and reopened.json()["closed_at"] is None


@pytest.mark.asyncio
async def test_only_resolved_tickets_can_be_rated(client):
    ticket_id = await _open_ticket(client)
    early = await client.post(f"/api/v1/tickets/g-rules/{ticket_id}/rate", json={"rating": 5})
    assert early.status_code == 409
    await client.post(f"/api/v1/tickets/g-rules/{ticket_id}/status", json={"status": "Resolved"})
    assert (await client.post(f"/api/v1/tickets/g-rules/{ticket_id}/rate", json={"rating": 5})).status_code == 200
