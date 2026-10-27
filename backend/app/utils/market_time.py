"""Market time utilities for UK electricity half-hour settlement periods."""

from datetime import date, datetime, time, timedelta, timezone
from typing import Generator


JANUARY_2026_START = date(2026, 1, 1)
JANUARY_2026_END = date(2026, 1, 31)


def parse_iso_utc(timestamp_str: str) -> datetime:
    """Parse an ISO 8601 timestamp string into a timezone-aware UTC datetime.
    
    Handles strings ending with 'Z' as well as explicit '+00:00' offsets.
    """
    clean_str = timestamp_str.strip()
    if clean_str.endswith("Z"):
        clean_str = clean_str[:-1] + "+00:00"
    dt = datetime.fromisoformat(clean_str)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def format_iso_utc(dt: datetime) -> str:
    """Format a datetime to standard UTC ISO 8601 string with trailing 'Z'."""
    utc_dt = dt.astimezone(timezone.utc)
    return utc_dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def validate_date_range(start_date_str: str, end_date_str: str) -> tuple[date, date]:
    """Validate that dates are valid YYYY-MM-DD and strictly within January 2026.
    
    Raises:
        ValueError: If dates are invalid or outside January 2026.
    """
    try:
        start_d = date.fromisoformat(start_date_str)
        end_d = date.fromisoformat(end_date_str)
    except ValueError as e:
        raise ValueError(f"Invalid date format. Expected YYYY-MM-DD: {e}") from e

    if start_d > end_d:
        raise ValueError(f"start_date ({start_date_str}) cannot be after end_date ({end_date_str})")

    if start_d < JANUARY_2026_START or end_d > JANUARY_2026_END:
        raise ValueError(
            f"Dates must be within January 2026 (2026-01-01 to 2026-01-31). "
            f"Received: {start_date_str} to {end_date_str}"
        )

    return start_d, end_d


def generate_expected_intervals(start_d: date, end_d: date) -> list[dict]:
    """Generate all expected half-hourly settlement intervals for a date range in January 2026.
    
    Returns a list of dicts with:
    - start_time: ISO UTC string
    - settlement_date: YYYY-MM-DD
    - settlement_period: 1-48
    """
    intervals = []
    curr = start_d
    while curr <= end_d:
        date_str = curr.isoformat()
        for period in range(1, 49):
            total_minutes = (period - 1) * 30
            hours = total_minutes // 60
            minutes = total_minutes % 60
            start_dt = datetime(curr.year, curr.month, curr.day, hours, minutes, 0, tzinfo=timezone.utc)
            intervals.append({
                "start_time": format_iso_utc(start_dt),
                "settlement_date": date_str,
                "settlement_period": period,
                "start_dt": start_dt,
            })
        curr += timedelta(days=1)
    return intervals


def calculate_decision_cutoff(
    delivery_start_dt: datetime,
    cutoff_preset: str = "gate_closure",
    cutoff_hours: float = 1.0,
) -> datetime:
    """Calculate the decision cutoff timestamp for a given delivery start time.
    
    Presets:
    - 'gate_closure': Exactly 1 hour prior to delivery interval start.
    - 'day_ahead_12': Day-Ahead auction cutoff (12:00 UTC on the preceding calendar day).
    - 'custom': Configurable hours ahead of delivery interval start.
    """
    if cutoff_preset == "gate_closure":
        return delivery_start_dt - timedelta(hours=1.0)
    elif cutoff_preset == "day_ahead_12":
        # Preceding calendar day at 12:00 UTC
        target_date = delivery_start_dt.date() - timedelta(days=1)
        return datetime(target_date.year, target_date.month, target_date.day, 12, 0, 0, tzinfo=timezone.utc)
    else:
        # Default or custom hours ahead
        hours = max(0.0, float(cutoff_hours))
        return delivery_start_dt - timedelta(hours=hours)
