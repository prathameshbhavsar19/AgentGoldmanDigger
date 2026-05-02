from fastapi import APIRouter
from .jobs import router as jobs_router
from .events_ws import router as events_router
from .follow_up import router as followup_router

api_router = APIRouter()
api_router.include_router(jobs_router)
api_router.include_router(events_router)
api_router.include_router(followup_router)
