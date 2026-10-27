"""Forecast selection and matching service.

Enforces the critical decision cutoff rule:
Only forecasts published at or before the configured decision cutoff are eligible.
Among eligible forecasts for an interval, the most recent (latest publishTime) is chosen.
"""

from datetime import datetime, timezone
from typing import Optional
from app.schemas.models import IntervalRecord
from app.utils.market_time import (
    calculate_decision_cutoff,
    format_iso_utc,
    parse_iso_utc,
)


def match_intervals(
    expected_intervals: list[dict],
    actual_records: list[dict],
    forecast_records: list[dict],
    cutoff_preset: str = "gate_closure",
    cutoff_hours: float = 1.0,
) -> list[IntervalRecord]:
    """Match delivery intervals with actual generation and cutoff-eligible forecasts.
    
    Args:
        expected_intervals: Complete list of expected intervals (48 per day in range)
        actual_records: Raw FUELHH wind actuals
        forecast_records: Raw WINDFOR forecasts
        cutoff_preset: 'gate_closure', 'day_ahead_12', or 'custom'
        cutoff_hours: Hours ahead if preset is 'custom'

    Returns:
        List of IntervalRecord objects with calculated error metrics and status.
    """
    # 1. Map actuals by standardized startTime UTC string
    actuals_by_start: dict[str, float] = {}
    for act in actual_records:
        st_raw = act.get("startTime")
        if not st_raw:
            continue
        try:
            st_iso = format_iso_utc(parse_iso_utc(st_raw))
            gen = act.get("generation")
            if gen is not None:
                actuals_by_start[st_iso] = float(gen)
        except Exception:
            continue

    # 2. Group candidate forecasts by standardized startTime UTC string
    forecasts_by_start: dict[str, list[dict]] = {}
    for fc in forecast_records:
        st_raw = fc.get("startTime")
        pub_raw = fc.get("publishTime")
        if not st_raw or not pub_raw:
            continue
        try:
            st_iso = format_iso_utc(parse_iso_utc(st_raw))
            pub_dt = parse_iso_utc(pub_raw)
            gen = fc.get("generation")
            if gen is not None:
                if st_iso not in forecasts_by_start:
                    forecasts_by_start[st_iso] = []
                forecasts_by_start[st_iso].append({
                    "generation": float(gen),
                    "publish_time_iso": format_iso_utc(pub_dt),
                    "publish_dt": pub_dt,
                })
        except Exception:
            continue

    # 3. Match each expected delivery interval
    matched_results: list[IntervalRecord] = []

    for item in expected_intervals:
        st_iso = item["start_time"]
        start_dt: datetime = item["start_dt"]
        settlement_date: str = item["settlement_date"]
        settlement_period: int = item["settlement_period"]

        # Calculate cutoff for this interval
        cutoff_dt = calculate_decision_cutoff(
            delivery_start_dt=start_dt,
            cutoff_preset=cutoff_preset,
            cutoff_hours=cutoff_hours,
        )

        actual_gen = actuals_by_start.get(st_iso)
        
        # Look up candidate forecasts for this delivery interval.
        # Note on Elexon BMRS WINDFOR dataset: Forecasts are published on an hourly granularity
        # (:00:00Z) representing expected wind generation for the clock hour, which covers both
        # constituent half-hour settlement periods (e.g. Period 1 at 00:00 and Period 2 at 00:30).
        # We first check for exact interval match, then fall back to the hour-start forecast.
        candidate_fcs = forecasts_by_start.get(st_iso)
        if not candidate_fcs:
            hour_start_iso = format_iso_utc(start_dt.replace(minute=0, second=0))
            candidate_fcs = forecasts_by_start.get(hour_start_iso, [])

        # Filter forecasts published at or before cutoff
        eligible_fcs = [
            fc for fc in candidate_fcs
            if fc["publish_dt"] <= cutoff_dt
        ]

        # Select most recent eligible forecast (latest publish_dt)
        selected_fc: Optional[dict] = None
        if eligible_fcs:
            selected_fc = max(eligible_fcs, key=lambda x: x["publish_dt"])

        # Determine interval status and compute errors
        if actual_gen is not None and selected_fc is not None:
            fc_gen = selected_fc["generation"]
            pub_iso = selected_fc["publish_time_iso"]
            pub_dt = selected_fc["publish_dt"]
            lead_time = round((start_dt - pub_dt).total_seconds() / 3600.0, 2)
            error_val = round(fc_gen - actual_gen, 2)
            abs_error_val = round(abs(error_val), 2)
            status = "matched"
        elif actual_gen is None and selected_fc is not None:
            fc_gen = selected_fc["generation"]
            pub_iso = selected_fc["publish_time_iso"]
            pub_dt = selected_fc["publish_dt"]
            lead_time = round((start_dt - pub_dt).total_seconds() / 3600.0, 2)
            error_val = None
            abs_error_val = None
            status = "missing_actual"
        elif actual_gen is not None and selected_fc is None:
            fc_gen = None
            pub_iso = None
            lead_time = None
            error_val = None
            abs_error_val = None
            status = "missing_forecast"
        else:
            fc_gen = None
            pub_iso = None
            lead_time = None
            error_val = None
            abs_error_val = None
            status = "missing_actual"

        matched_results.append(
            IntervalRecord(
                start_time=st_iso,
                settlement_date=settlement_date,
                settlement_period=settlement_period,
                actual_generation_mw=actual_gen,
                forecast_generation_mw=fc_gen,
                forecast_publish_time=pub_iso,
                lead_time_hours=lead_time,
                error_mw=error_val,
                absolute_error_mw=abs_error_val,
                status=status,
            )
        )

    return matched_results
