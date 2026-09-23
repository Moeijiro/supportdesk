from fastapi import APIRouter
from app.api.v1.endpoints import tickets, canned, analytics, demo

api_router = APIRouter()

api_router.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
api_router.include_router(canned.router, prefix="/canned", tags=["canned"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(demo.router, prefix="/demo", tags=["demo"])
