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

    # 5. Rate ticket
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
