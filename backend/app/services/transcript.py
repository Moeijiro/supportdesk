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
  body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f9f9fc; color: #1f1d2b; margin: 0; padding: 32px 16px; }}
  .container {{ max-width: 800px; margin: 0 auto; background: #fff; border-radius: 14px; border: 1px solid #e6e4ee; overflow: hidden; }}
  .header {{ padding: 24px; border-bottom: 1px solid #e6e4ee; }}
  .header h2 {{ margin: 0; font-size: 20px; letter-spacing: -0.01em; }}
  .number {{ color: #6b46d8; font-family: ui-monospace, monospace; font-size: 13px; }}
  .meta-grid {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 16px; margin-top: 16px; font-size: 13px; color: #6b6880; }}
  .meta-grid strong {{ color: #1f1d2b; font-weight: 500; }}
  .description {{ padding: 20px 24px; border-bottom: 1px solid #e6e4ee; font-size: 14px; line-height: 1.6; }}
  .messages {{ padding: 24px; display: flex; flex-direction: column; gap: 12px; }}
  .message {{ padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.5; border: 1px solid #e6e4ee; max-width: 85%; }}
  .staff-msg {{ background: #f1edfc; border-color: #d9cff7; align-self: flex-end; }}
  .user-msg {{ background: #fff; align-self: flex-start; }}
  .msg-header {{ display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 12px; }}
  .timestamp {{ color: #6b6880; font-size: 11px; margin-left: auto; }}
  .badge {{ font-size: 10px; font-weight: 600; padding: 1px 5px; border-radius: 4px; }}
  .staff {{ background: #6b46d8; color: #fff; }}
  .user {{ background: #eeedf3; color: #6b6880; }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="number">Ticket #{ticket.ticket_number}</div>
    <h2>{escaped_subject}</h2>
    <div class="meta-grid">
      <div>Customer: <strong>{escaped_customer}</strong> ({html.escape(ticket.customer_id)})</div>
      <div>Category: <strong>{escaped_category}</strong></div>
      <div>Agent: <strong>{escaped_agent}</strong></div>
      <div>Status: <strong>{html.escape(ticket.status)}</strong> · Priority: <strong>{html.escape(ticket.priority)}</strong></div>
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
