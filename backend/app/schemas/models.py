"""Data models and Pydantic schemas for WindScope."""

from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field


class IntervalRecord(BaseModel):
    """Represents a single half-hour settlement interval comparison."""

    start_time: str = Field(..., description="Interval delivery start timestamp in ISO 8601 UTC")
    settlement_date: str = Field(..., description="Settlement calendar date (YYYY-MM-DD)")
    settlement_period: int = Field(..., ge=1, le=48, description="Settlement period of the day (1-48)")
    actual_generation_mw: Optional[float] = Field(None, description="Actual wind generation delivered in MW")
    forecast_generation_mw: Optional[float] = Field(None, description="Selected wind forecast in MW")
    forecast_publish_time: Optional[str] = Field(None, description="Timestamp when the selected forecast was published")
    lead_time_hours: Optional[float] = Field(None, description="Lead time in hours between publishTime and startTime")
    error_mw: Optional[float] = Field(None, description="Forecast error in MW (Forecast - Actual)")
    absolute_error_mw: Optional[float] = Field(None, description="Absolute error in MW (|Forecast - Actual|)")
    status: Literal["matched", "missing_forecast", "missing_actual"] = Field(
        ..., description="Data match status for this interval"
    )


class AccuracyMetrics(BaseModel):
    """Summary forecast accuracy KPI metrics across evaluated delivery intervals."""

    mae_mw: Optional[float] = Field(None, description="Mean Absolute Error in MW (lower is better)")
    rmse_mw: Optional[float] = Field(None, description="Root Mean Squared Error in MW (penalizes large misses)")
    bias_mw: Optional[float] = Field(
        None, description="Mean signed error in MW (>0 overestimates, <0 underestimates)"
    )
    mean_actual_mw: Optional[float] = Field(None, description="Average actual generation in MW")
    mean_forecast_mw: Optional[float] = Field(None, description="Average forecast generation in MW")
    max_overforecast_mw: Optional[float] = Field(None, description="Maximum single overforecast in MW")
    max_underforecast_mw: Optional[float] = Field(None, description="Maximum single underforecast in MW")
    valid_count: int = Field(0, description="Total number of valid matched intervals evaluated")


class ComparisonMeta(BaseModel):
    """Metadata regarding data retrieval, date scope, and decision cutoff parameters."""

    app_name: str
    start_date: str
    end_date: str
    cutoff_preset: str
    cutoff_hours: float
    fetched_at: str
    total_expected_intervals: int
    matched_intervals: int
    missing_actuals: int
    missing_forecasts: int
    is_cached: bool = False


class ComparisonResponse(BaseModel):
    """Primary API response returning interval records and summary accuracy metrics."""

    meta: ComparisonMeta
    metrics: AccuracyMetrics
    intervals: list[IntervalRecord]


class PaginatedIntervalsResponse(BaseModel):
    """Paginated interval records for historical table."""

    total: int = Field(..., description="Total interval records matching the date range")
    page: int = Field(..., description="Current page number (1-indexed)")
    page_size: int = Field(..., description="Number of records per page")
    total_pages: int = Field(..., description="Total available pages")
    intervals: list[IntervalRecord] = Field(..., description="List of interval records for this page")



class DailySummaryItem(BaseModel):
    """Daily aggregated accuracy metrics for trend analysis."""

    date: str
    total_intervals: int
    valid_count: int
    mae_mw: Optional[float] = None
    rmse_mw: Optional[float] = None
    bias_mw: Optional[float] = None
    mean_actual_mw: Optional[float] = None
    mean_forecast_mw: Optional[float] = None


class DailySummaryResponse(BaseModel):
    """Response containing daily accuracy breakdowns."""

    meta: ComparisonMeta
    days: list[DailySummaryItem]


class HealthResponse(BaseModel):
    """Backend service health check response."""

    status: str
    version: str
    elexon_reachable: bool
    timestamp: str
