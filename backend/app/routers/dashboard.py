"""
DermaScreen — Dashboard Router
Endpoint for aggregated statistics.
"""

from fastapi import APIRouter, Depends
from app.schemas.models import DashboardStats
from app.services import supabase_service
from app.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(user: dict = Depends(get_current_user)):
    """Get aggregated scan statistics for the dashboard."""
    stats = supabase_service.get_dashboard_stats(user["id"])

    return DashboardStats(
        total_scans=stats["total_scans"],
        last_scan_date=stats["last_scan_date"],
        avg_confidence=stats["avg_confidence"],
        high_risk_alerts=stats["high_risk_alerts"],
        risk_distribution=stats["risk_distribution"],
    )
