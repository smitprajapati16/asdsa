"""Unit tests for market time parsing, settlement intervals, and date validation."""

from datetime import date, datetime, timezone
import pytest
from app.utils.market_time import (
    calculate_decision_cutoff,
    format_iso_utc,
    generate_expected_intervals,
    parse_iso_utc,
    validate_date_range,
)


def test_parse_iso_utc():
    """Verify ISO parsing handles 'Z' and timezone offsets correctly."""
    dt1 = parse_iso_utc("2026-01-01T12:00:00Z")
    assert dt1.tzinfo == timezone.utc
    assert dt1.hour == 12

    dt2 = parse_iso_utc("2026-01-01T14:30:00+00:00")
    assert dt2.tzinfo == timezone.utc
    assert dt2.hour == 14
    assert dt2.minute == 30


def test_validate_date_range_valid_january():
    """Valid January 2026 ranges pass validation."""
    s, e = validate_date_range("2026-01-01", "2026-01-31")
    assert s == date(2026, 1, 1)
    assert e == date(2026, 1, 31)

    s2, e2 = validate_date_range("2026-01-15", "2026-01-15")
    assert s2 == date(2026, 1, 15)
    assert e2 == date(2026, 1, 15)


def test_validate_date_range_rejects_out_of_bounds():
    """Dates outside January 2026 are rejected with ValueError."""
    with pytest.raises(ValueError, match="January 2026"):
        validate_date_range("2025-12-31", "2026-01-05")

    with pytest.raises(ValueError, match="January 2026"):
        validate_date_range("2026-01-20", "2026-02-01")

    with pytest.raises(ValueError, match="cannot be after"):
        validate_date_range("2026-01-10", "2026-01-05")


def test_generate_expected_intervals_48_per_day():
    """A single day must generate exactly 48 half-hour settlement intervals."""
    intervals = generate_expected_intervals(date(2026, 1, 1), date(2026, 1, 1))
    assert len(intervals) == 48

    first = intervals[0]
    assert first["settlement_period"] == 1
    assert first["start_time"] == "2026-01-01T00:00:00Z"

    last = intervals[47]
    assert last["settlement_period"] == 48
    assert last["start_time"] == "2026-01-01T23:30:00Z"


def test_calculate_decision_cutoff_presets():
    """Verify cutoff timestamps for Gate Closure, Day-Ahead, and custom."""
    delivery_start = datetime(2026, 1, 10, 15, 0, 0, tzinfo=timezone.utc)

    # Gate Closure: 1 hour prior -> 14:00 UTC
    gc = calculate_decision_cutoff(delivery_start, cutoff_preset="gate_closure")
    assert gc == datetime(2026, 1, 10, 14, 0, 0, tzinfo=timezone.utc)

    # Day-Ahead 12:00: D-1 at 12:00 -> Jan 9 at 12:00 UTC
    da = calculate_decision_cutoff(delivery_start, cutoff_preset="day_ahead_12")
    assert da == datetime(2026, 1, 9, 12, 0, 0, tzinfo=timezone.utc)

    # Custom 4 hours ahead -> 11:00 UTC
    custom = calculate_decision_cutoff(delivery_start, cutoff_preset="custom", cutoff_hours=4.0)
    assert custom == datetime(2026, 1, 10, 11, 0, 0, tzinfo=timezone.utc)
