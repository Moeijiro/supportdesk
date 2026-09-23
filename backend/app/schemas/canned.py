from pydantic import BaseModel, Field
from typing import Optional

class CannedResponseCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=128)
    content: str = Field(..., min_length=5)
    category: Optional[str] = None

class CannedResponseOut(BaseModel):
    id: int
    guild_id: str
    title: str
    content: str
    category: Optional[str]
    usage_count: int

    class Config:
        from_attributes = True
