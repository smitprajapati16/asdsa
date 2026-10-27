"""API Route definitions for WindScope."""

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.clients.elexon import ElexonAPIError, elexon_client
from app.core.config import settings
from app.schemas.models import (
    ComparisonResponse,
    DailySummaryResponse,
    HealthResponse,
    PaginatedIntervalsResponse,
)
from app.services.data_service import data_service
from app.utils.market_time import format_iso_utc, validate_date_range

router = APIRouter(prefix="/api", tags=["WindScope Analytics"])


@router.get("/health", response_model=HealthResponse, summary="Service Health & Connectivity")
async def health_check():
    """Verify backend health and active connectivity to Elexon BMRS API."""
    elexon_ok = await elexon_client.check_health()
    return HealthResponse(
        status="healthy" if elexon_ok else "degraded",
        version=settings.APP_VERSION,
        elexon_reachable=elexon_ok,
        timestamp=format_iso_utc(datetime.now(timezone.utc)),
    )


@router.get(
    "/comparison",
    response_model=ComparisonResponse,
    summary="Matched Wind Forecast vs Actuals with Decision Cutoff",
)
async def get_comparison(
    start_date: str = Query(
        settings.DEFAULT_START_DATE,
        description="Start date in January 2026 (YYYY-MM-DD)",
        pattern=r"^2026-01-\d{2}$",
    ),
    end_date: str = Query(
        settings.DEFAULT_END_DATE,
        description="End date in January 2026 (YYYY-MM-DD)",
        pattern=r"^2026-01-\d{2}$",
    ),
    cutoff_preset: str = Query(
        settings.DEFAULT_CUTOFF_PRESET,
        description="Purchasing decision cutoff preset ('gate_closure', 'day_ahead_12', or 'custom')",
    ),
    cutoff_hours: float = Query(
        settings.DEFAULT_CUTOFF_HOURS,
        ge=0.0,
        le=72.0,
        description="Decision cutoff hours ahead of delivery interval start (if preset is 'custom')",
    ),
):
    """Retrieve matched half-hourly actual wind generation and decision-cutoff-selected forecasts."""
    try:
        validate_date_range(start_date, end_date)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    try:
        return await data_service.get_comparison(
            start_date=start_date,
            end_date=end_date,
            cutoff_preset=cutoff_preset,
            cutoff_hours=cutoff_hours,
        )
    except ElexonAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Upstream Elexon BMRS API error: {exc}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while processing wind forecast data: {exc}",
        )


@router.get(
    "/intervals",
    response_model=PaginatedIntervalsResponse,
    summary="Paginated Settlement Interval Records for Historical Table",
)
async def get_intervals(
    start_date: str = Query(
        settings.DEFAULT_START_DATE,
        description="Start date in January 2026 (YYYY-MM-DD)",
        pattern=r"^2026-01-\d{2}$",
    ),
    end_date: str = Query(
        settings.DEFAULT_END_DATE,
        description="End date in January 2026 (YYYY-MM-DD)",
        pattern=r"^2026-01-\d{2}$",
    ),
    cutoff_preset: str = Query(
        settings.DEFAULT_CUTOFF_PRESET,
        description="Purchasing decision cutoff preset",
    ),
    cutoff_hours: float = Query(
        settings.DEFAULT_CUTOFF_HOURS,
        ge=0.0,
        le=72.0,
        description="Decision cutoff hours ahead of delivery interval start",
    ),
    page: int = Query(
        1,
        ge=1,
        description="Current page number (1-indexed)",
    ),
    page_size: int = Query(
        24,
        ge=1,
        le=200,
        description="Number of records per page",
    ),
    sort_field: str = Query(
        "start_time",
        description="Field to sort by (start_time, actual, forecast, error, abs_error)",
    ),
    sort_asc: bool = Query(
        True,
        description="Sort ascending if true, descending if false",
    ),
):
    """Retrieve a single paginated slice of settlement intervals with sorting."""
    try:
        validate_date_range(start_date, end_date)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    try:
        return await data_service.get_intervals(
            start_date=start_date,
            end_date=end_date,
            cutoff_preset=cutoff_preset,
            cutoff_hours=cutoff_hours,
            page=page,
            page_size=page_size,
            sort_field=sort_field,
            sort_asc=sort_asc,
        )
    except ElexonAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Upstream Elexon BMRS API error: {exc}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while fetching paginated interval records: {exc}",
        )


@router.get(
    "/accuracy/daily",
    response_model=DailySummaryResponse,
    summary="Daily Forecast Accuracy Aggregations",
)
async def get_daily_summary(
    start_date: str = Query(
        settings.DEFAULT_START_DATE,
        description="Start date in January 2026 (YYYY-MM-DD)",
    ),
    end_date: str = Query(
        settings.DEFAULT_END_DATE,
        description="End date in January 2026 (YYYY-MM-DD)",
    ),
    cutoff_preset: str = Query(
        settings.DEFAULT_CUTOFF_PRESET,
        description="Purchasing decision cutoff preset",
    ),
    cutoff_hours: float = Query(
        settings.DEFAULT_CUTOFF_HOURS,
        ge=0.0,
        le=72.0,
    ),
):
    """Get day-by-day MAE, RMSE, Bias, and generation volume trends."""
    try:
        validate_date_range(start_date, end_date)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    try:
        return await data_service.get_daily_summary(
            start_date=start_date,
            end_date=end_date,
            cutoff_preset=cutoff_preset,
            cutoff_hours=cutoff_hours,
        )
    except ElexonAPIError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Upstream Elexon BMRS API error: {exc}",
        )
