import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
from app.db.base import Base


class GuildConfig(Base):
    __tablename__ = "guild_configs"

    guild_id = Column(String(32), primary_key=True, index=True)
    guild_name = Column(String(255), nullable=False)
    support_channel_id = Column(String(32), nullable=True)
    staff_role_id = Column(String(32), nullable=True)
    transcript_log_channel_id = Column(String(32), nullable=True)
    is_enabled = Column(Boolean, default=True)


class CannedResponse(Base):
    __tablename__ = "canned_responses"

    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(String(32), index=True, nullable=False)
    title = Column(String(128), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(64), nullable=True)
    usage_count = Column(Integer, default=0)
