import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(Integer, nullable=False, index=True)
    guild_id = Column(String(32), index=True, nullable=False)
    channel_id = Column(String(32), nullable=True, index=True)
    customer_id = Column(String(32), index=True, nullable=False)
    customer_name = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False)  # Billing, Technical Issue, Purchase Question, Account Help, Other
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(32), default="Open", index=True)  # Open, Waiting for Staff, Waiting for Customer, In Progress, Resolved, Closed
    priority = Column(String(32), default="Normal")  # Low, Normal, High, Urgent
    assigned_agent_id = Column(String(32), nullable=True, index=True)
    assigned_agent_name = Column(String(128), nullable=True)
    tags_json = Column(Text, default="[]")
    
    first_response_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    
    rating = Column(Integer, nullable=True)  # 1 to 5
    rating_comment = Column(Text, nullable=True)
    transcript_html = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    messages = relationship("TicketMessage", back_populates="ticket", cascade="all, delete-orphan", order_by="TicketMessage.timestamp")
    notes = relationship("InternalNote", back_populates="ticket", cascade="all, delete-orphan", order_by="InternalNote.created_at")

    __table_args__ = (
        Index("ix_ticket_guild_number", "guild_id", "ticket_number", unique=True),
    )


class TicketMessage(Base):
    __tablename__ = "ticket_messages"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False, index=True)
    author_id = Column(String(32), nullable=False)
    author_name = Column(String(128), nullable=False)
    is_staff = Column(Boolean, default=False)
    content = Column(Text, nullable=False)
    attachments_json = Column(Text, default="[]")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    ticket = relationship("Ticket", back_populates="messages")


class InternalNote(Base):
    __tablename__ = "internal_notes"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False, index=True)
    staff_id = Column(String(32), nullable=False)
    staff_name = Column(String(128), nullable=False)
    note_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    ticket = relationship("Ticket", back_populates="notes")


class TicketAuditLog(Base):
    __tablename__ = "ticket_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, nullable=False, index=True)
    guild_id = Column(String(32), index=True, nullable=False)
    actor_id = Column(String(32), nullable=False)
    actor_name = Column(String(128), nullable=False)
    action = Column(String(64), nullable=False)  # ticket_created, ticket_claimed, ticket_transferred, priority_changed, status_changed, note_added, ticket_closed, rating_received
    details = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
