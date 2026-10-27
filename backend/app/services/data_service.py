"""High-level orchestration service for data retrieval, matching, and aggregation."""

from datetime import datetime, timezone
from app.clients.elexon import elexon_client
from app.core.config import settings
from app.schemas.models import (
    ComparisonMeta,
    ComparisonResponse,
    DailySummaryItem,
    DailySummaryResponse,
    PaginatedIntervalsResponse,
)
from app.services.accuracy import calculate_metrics
from app.services.forecast_selection import match_intervals
from app.utils.market_time import (
    format_iso_utc,
    generate_expected_intervals,
    validate_date_range,
)


class DataService:
    """Orchestrates comparison datasets and metric aggregations."""

    async def get_comparison(
        self,
        start_date: str = settings.DEFAULT_START_DATE,
        end_date: str = settings.DEFAULT_END_DATE,
        cutoff_preset: str = settings.DEFAULT_CUTOFF_PRESET,
        cutoff_hours: float = settings.DEFAULT_CUTOFF_HOURS,
    ) -> ComparisonResponse:
        """Fetch, match, and calculate forecast accuracy metrics for the specified parameters."""
        # 1. Validate dates within January 2026
        start_d, end_d = validate_date_range(start_date, end_date)

        # 2. Generate expected 48 settlement intervals per complete day
        expected = generate_expected_intervals(start_d, end_d)

        # 3. Retrieve actuals and forecasts from Elexon (or cache)
        actuals, act_cached = await elexon_client.fetch_fuelhh_actuals(start_date, end_date)
        forecasts, fc_cached = await elexon_client.fetch_windfor_forecasts(start_date, end_date)

        # 4. Perform forecast selection using the specified decision cutoff
        intervals = match_intervals(
            expected_intervals=expected,
            actual_records=actuals,
            forecast_records=forecasts,
            cutoff_preset=cutoff_preset,
            cutoff_hours=cutoff_hours,
        )

        # 5. Extract matched pairs for accuracy calculations
        matched_pairs = [
            (rec.forecast_generation_mw, rec.actual_generation_mw)
            for rec in intervals
            if rec.status == "matched"
            and rec.forecast_generation_mw is not None
            and rec.actual_generation_mw is not None
        ]

        # 6. Calculate accuracy metrics
        metrics = calculate_metrics(matched_pairs)

        # 7. Calculate status breakdown counts
        total_expected = len(expected)
        matched_count = sum(1 for r in intervals if r.status == "matched")
        missing_act_count = sum(1 for r in intervals if r.status == "missing_actual")
        missing_fc_count = sum(1 for r in intervals if r.status == "missing_forecast")

        meta = ComparisonMeta(
            app_name=settings.APP_NAME,
            start_date=start_date,
            end_date=end_date,
            cutoff_preset=cutoff_preset,
            cutoff_hours=cutoff_hours,
            fetched_at=format_iso_utc(datetime.now(timezone.utc)),
            total_expected_intervals=total_expected,
            matched_intervals=matched_count,
            missing_actuals=missing_act_count,
            missing_forecasts=missing_fc_count,
            is_cached=act_cached and fc_cached,
        )

        return ComparisonResponse(
            meta=meta,
            metrics=metrics,
            intervals=intervals,
        )

    async def get_intervals(
        self,
        start_date: str = settings.DEFAULT_START_DATE,
        end_date: str = settings.DEFAULT_END_DATE,
        cutoff_preset: str = settings.DEFAULT_CUTOFF_PRESET,
        cutoff_hours: float = settings.DEFAULT_CUTOFF_HOURS,
        page: int = 1,
        page_size: int = 24,
        sort_field: str = "start_time",
        sort_asc: bool = True,
    ) -> PaginatedIntervalsResponse:
        """Fetch matched intervals and return a paginated and sorted subset."""
        comparison = await self.get_comparison(
            start_date=start_date,
            end_date=end_date,
            cutoff_preset=cutoff_preset,
            cutoff_hours=cutoff_hours,
        )

        records = list(comparison.intervals)

        # Sorting logic
        def get_sort_key(r):
            if sort_field == "start_time":
                return (0, r.start_time or "")
            elif sort_field == "actual":
                val = r.actual_generation_mw
                return (1 if val is None else 0, val if val is not None else 0.0)
            elif sort_field == "forecast":
                val = r.forecast_generation_mw
                return (1 if val is None else 0, val if val is not None else 0.0)
            elif sort_field == "error":
                val = r.error_mw
                return (1 if val is None else 0, val if val is not None else 0.0)
            elif sort_field == "abs_error":
                val = r.absolute_error_mw
                return (1 if val is None else 0, val if val is not None else 0.0)
            return (0, r.start_time or "")

        records.sort(key=get_sort_key, reverse=not sort_asc)

        total = len(records)
        safe_page_size = max(1, page_size)
        total_pages = max(1, (total + safe_page_size - 1) // safe_page_size)
        safe_page = min(max(1, page), total_pages)
        start_idx = (safe_page - 1) * safe_page_size
        end_idx = start_idx + safe_page_size
        sliced = records[start_idx:end_idx]

        return PaginatedIntervalsResponse(
            total=total,
            page=safe_page,
            page_size=safe_page_size,
            total_pages=total_pages,
            intervals=sliced,
        )

    async def get_daily_summary(
        self,
        start_date: str = settings.DEFAULT_START_DATE,
        end_date: str = settings.DEFAULT_END_DATE,
        cutoff_preset: str = settings.DEFAULT_CUTOFF_PRESET,
        cutoff_hours: float = settings.DEFAULT_CUTOFF_HOURS,
    ) -> DailySummaryResponse:
        """Calculate day-by-day accuracy metrics for trend analysis across January 2026."""
        comparison = await self.get_comparison(
            start_date=start_date,
            end_date=end_date,
            cutoff_preset=cutoff_preset,
            cutoff_hours=cutoff_hours,
        )

        # Group intervals by settlement_date
        by_date: dict[str, list] = {}
        for rec in comparison.intervals:
            d = rec.settlement_date
            if d not in by_date:
                by_date[d] = []
            by_date[d].append(rec)

        daily_items: list[DailySummaryItem] = []
        for d, recs in sorted(by_date.items()):
            matched = [
                (r.forecast_generation_mw, r.actual_generation_mw)
                for r in recs
                if r.status == "matched"
                and r.forecast_generation_mw is not None
                and r.actual_generation_mw is not None
            ]
            m = calculate_metrics(matched)
            daily_items.append(
                DailySummaryItem(
                    date=d,
                    total_intervals=len(recs),
                    valid_count=m.valid_count,
                    mae_mw=m.mae_mw,
                    rmse_mw=m.rmse_mw,
                    bias_mw=m.bias_mw,
                    mean_actual_mw=m.mean_actual_mw,
                    mean_forecast_mw=m.mean_forecast_mw,
                )
            )

        return DailySummaryResponse(
            meta=comparison.meta,
            days=daily_items,
        )


data_service = DataService()
