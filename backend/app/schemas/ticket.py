from pydantic import BaseModel, Field
from typing import Optional, List
import datetime

class TicketCreate(BaseModel):
    customer_id: str
    customer_name: str
    category: str = Field(..., description="Billing, Technical Issue, Purchase Question, Account Help, Other")
    subject: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5)
    priority: str = Field("Normal", description="Low, Normal, High, Urgent")

class TicketPriorityUpdate(BaseModel):
    priority: str = Field(..., description="Low, Normal, High, Urgent")

class TicketStatusUpdate(BaseModel):
    status: str = Field(..., description="Open, Waiting for Staff, Waiting for Customer, In Progress, Resolved, Closed")

class TicketClaimRequest(BaseModel):
    agent_id: str
    agent_name: str

class InternalNoteCreate(BaseModel):
    staff_id: str
    staff_name: str
    note_text: str = Field(..., min_length=1)

class InternalNoteOut(BaseModel):
    id: int
    ticket_id: int
    staff_id: str
    staff_name: str
    note_text: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class TicketMessageCreate(BaseModel):
    author_id: str
    author_name: str
    is_staff: bool = False
    content: str = Field(..., min_length=1)

class TicketMessageOut(BaseModel):
    id: int
    ticket_id: int
    author_id: str
    author_name: str
    is_staff: bool
    content: str
    timestamp: datetime.datetime

    class Config:
        from_attributes = True

class TicketRatingCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=500)

class TicketOut(BaseModel):
    id: int
    ticket_number: int
    guild_id: str
    customer_id: str
    customer_name: str
    category: str
    subject: str
    status: str
    priority: str
    assigned_agent_id: Optional[str]
    assigned_agent_name: Optional[str]
    created_at: datetime.datetime
    first_response_at: Optional[datetime.datetime]
    resolved_at: Optional[datetime.datetime]
    closed_at: Optional[datetime.datetime]
    rating: Optional[int]

    class Config:
        from_attributes = True

class TicketDetailOut(TicketOut):
    description: str
    rating_comment: Optional[str]
    messages: List[TicketMessageOut] = []
    notes: List[InternalNoteOut] = []
    has_transcript: bool = False
