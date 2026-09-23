from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db.session import get_db
from app.models import CannedResponse
from app.schemas.canned import CannedResponseCreate, CannedResponseOut

router = APIRouter()

@router.get("/{guild_id}", response_model=List[CannedResponseOut])
async def list_canned_responses(guild_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(CannedResponse).where(CannedResponse.guild_id == guild_id)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/{guild_id}", response_model=CannedResponseOut, status_code=status.HTTP_201_CREATED)
async def create_canned_response(guild_id: str, payload: CannedResponseCreate, db: AsyncSession = Depends(get_db)):
    canned = CannedResponse(
        guild_id=guild_id,
        title=payload.title,
        content=payload.content,
        category=payload.category,
        usage_count=0
    )
    db.add(canned)
    await db.commit()
    await db.refresh(canned)
    return canned
