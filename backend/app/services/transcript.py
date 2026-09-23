import html
from typing import List
from app.db.models import Ticket, TicketMessage

def generate_text_transcript(ticket: Ticket, messages: List[TicketMessage]) -> str:
    lines = [
        "=" * 60,
        f"SUPPORTDESK TICKET TRANSCRIPT #{ticket.ticket_number}",
        f"Subject: {ticket.subject}",
        f"Category: {ticket.category} | Priority: {ticket.priority}",
        f"Customer: {ticket.customer_name} ({ticket.customer_id})",
        f"Assigned Agent: {ticket.assigned_agent_name or 'Unassigned'}",
        f"Status: {ticket.status}",
        f"Created At: {ticket.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}",
        "=" * 60,
        "",
        "--- INITIAL REQUEST DESCRIPTION ---",
        ticket.description,
        "",
        "--- CONVERSATION LOG ---",
    ]

    for m in messages:
        role = "[STAFF]" if m.is_staff else "[CUSTOMER]"
        time_str = m.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        lines.append(f"[{time_str}] {role} {m.author_name}: {m.content}")

    lines.append("")
    lines.append("=" * 60)
    lines.append("END OF TRANSCRIPT")
    return "\n".join(lines)

def generate_html_transcript(ticket: Ticket, messages: List[TicketMessage]) -> str:
    escaped_subject = html.escape(ticket.subject)
    escaped_category = html.escape(ticket.category)
    escaped_desc = html.escape(ticket.description)
    escaped_customer = html.escape(ticket.customer_name)
    escaped_agent = html.escape(ticket.assigned_agent_name or "Unassigned")

    msg_html_list = []
    for m in messages:
        author_esc = html.escape(m.author_name)
        content_esc = html.escape(m.content).replace("\n", "<br>")
        badge = '<span class="badge staff">STAFF</span>' if m.is_staff else '<span class="badge user">USER</span>'
        msg_html_list.append(f"""
        <div class="message {'staff-msg' if m.is_staff else 'user-msg'}">
            <div class="msg-header">
                <strong>{author_esc}</strong> {badge}
                <span class="timestamp">{m.timestamp.strftime('%Y-%m-%d %H:%M:%S')}</span>
            </div>
            <div class="msg-body">{content_esc}</div>
        </div>
        """)

    all_messages_html = "\n".join(msg_html_list)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Ticket #{ticket.ticket_number} - {escaped_subject}</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0F172A; color: #F8FAFC; margin: 0; padding: 24px; }}
  .container {{ max-width: 800px; margin: 0 auto; background: #1E293B; border-radius: 12px; border: 1px solid #334155; overflow: hidden; }}
  .header {{ padding: 24px; background: #0F172A; border-bottom: 1px solid #334155; }}
  .meta-grid {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 16px; font-size: 13px; color: #94A3B8; }}
  .description {{ padding: 20px 24px; background: #1E293B; border-bottom: 1px solid #334155; font-size: 14px; line-height: 1.6; }}
  .messages {{ padding: 24px; display: flex; flex-direction: column; gap: 16px; }}
  .message {{ padding: 14px 18px; border-radius: 8px; font-size: 14px; line-height: 1.5; }}
  .staff-msg {{ background: #1E3A8A; border-left: 4px solid #3B82F6; }}
  .user-msg {{ background: #334155; border-left: 4px solid #64748B; }}
  .msg-header {{ display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 13px; }}
  .timestamp {{ color: #94A3B8; font-size: 11px; margin-left: auto; }}
  .badge {{ font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; }}
  .staff {{ background: #2563EB; color: #FFF; }}
  .user {{ background: #475569; color: #FFF; }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h2 style="margin: 0; color: #38BDF8;">Ticket #{ticket.ticket_number}: {escaped_subject}</h2>
    <div class="meta-grid">
      <div><strong>Customer:</strong> {escaped_customer} ({ticket.customer_id})</div>
      <div><strong>Category:</strong> {escaped_category}</div>
      <div><strong>Assigned Agent:</strong> {escaped_agent}</div>
      <div><strong>Status:</strong> {ticket.status} | <strong>Priority:</strong> {ticket.priority}</div>
    </div>
  </div>
  <div class="description">
    <strong>Initial Request:</strong><br>{escaped_desc}
  </div>
  <div class="messages">
    {all_messages_html}
  </div>
</div>
</body>
</html>"""
