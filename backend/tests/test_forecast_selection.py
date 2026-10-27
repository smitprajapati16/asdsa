"""Unit tests for forecast selection and decision cutoff logic."""

from datetime import datetime, timezone
import pytest
from app.services.forecast_selection import match_intervals


def test_forecast_selection_strictly_enforces_cutoff():
    """Forecasts published AFTER the cutoff must be ignored, and the most recent eligible selected."""
    # Delivery interval: 2026-01-02 12:00 UTC
    expected = [{
        "start_time": "2026-01-02T12:00:00Z",
        "settlement_date": "2026-01-02",
        "settlement_period": 25,
        "start_dt": datetime(2026, 1, 2, 12, 0, 0, tzinfo=timezone.utc),
    }]

    # Actual generation: 5000 MW
    actuals = [{
        "startTime": "2026-01-02T12:00:00Z",
        "generation": 5000,
    }]

    # With Gate Closure (1h prior), cutoff is 2026-01-02 11:00 UTC.
    # Candidate forecasts:
    # 1. Pub: 09:00 UTC (Eligible, older) -> Gen: 4200
    # 2. Pub: 10:30 UTC (Eligible, most recent prior to cutoff) -> Gen: 4800
    # 3. Pub: 11:15 UTC (Ineligible, published AFTER 11:00 cutoff) -> Gen: 5100
    forecasts = [
        {"startTime": "2026-01-02T12:00:00Z", "publishTime": "2026-01-02T09:00:00Z", "generation": 4200},
        {"startTime": "2026-01-02T12:00:00Z", "publishTime": "2026-01-02T10:30:00Z", "generation": 4800},
        {"startTime": "2026-01-02T12:00:00Z", "publishTime": "2026-01-02T11:15:00Z", "generation": 5100},
    ]

    results = match_intervals(
        expected_intervals=expected,
        actual_records=actuals,
        forecast_records=forecasts,
        cutoff_preset="gate_closure",
        cutoff_hours=1.0,
    )

    assert len(results) == 1
    rec = results[0]
    assert rec.status == "matched"
    # Should pick 10:30 UTC forecast (4800 MW), NOT 11:15 UTC forecast (5100 MW)
    assert rec.forecast_generation_mw == 4800.0
    assert rec.forecast_publish_time == "2026-01-02T10:30:00Z"
    assert rec.actual_generation_mw == 5000.0
    assert rec.error_mw == -200.0
    assert rec.absolute_error_mw == 200.0
    assert rec.lead_time_hours == 1.5


def test_forecast_selection_day_ahead_preset():
    """Verify Day-Ahead 12:00 D-1 preset selects forecast prior to noon on previous day."""
    # Delivery interval: 2026-01-05 14:00 UTC
    expected = [{
        "start_time": "2026-01-05T14:00:00Z",
        "settlement_date": "2026-01-05",
        "settlement_period": 29,
        "start_dt": datetime(2026, 1, 5, 14, 0, 0, tzinfo=timezone.utc),
    }]

    actuals = [{
        "startTime": "2026-01-05T14:00:00Z",
        "generation": 8000,
    }]

    # Cutoff for Day-Ahead D-1 is 2026-01-04 12:00 UTC.
    forecasts = [
        # Eligible: published Jan 4 at 10:00 UTC
        {"startTime": "2026-01-05T14:00:00Z", "publishTime": "2026-01-04T10:00:00Z", "generation": 7500},
        # Ineligible for Day-Ahead 12:00: published Jan 4 at 16:00 UTC
        {"startTime": "2026-01-05T14:00:00Z", "publishTime": "2026-01-04T16:00:00Z", "generation": 7900},
    ]

    results = match_intervals(
        expected_intervals=expected,
        actual_records=actuals,
        forecast_records=forecasts,
        cutoff_preset="day_ahead_12",
    )

    assert len(results) == 1
    rec = results[0]
    assert rec.forecast_generation_mw == 7500.0
    assert rec.forecast_publish_time == "2026-01-04T10:00:00Z"


def test_forecast_selection_missing_forecast():
    """If no forecast exists before cutoff, interval is marked missing_forecast."""
    expected = [{
        "start_time": "2026-01-02T12:00:00Z",
        "settlement_date": "2026-01-02",
        "settlement_period": 25,
        "start_dt": datetime(2026, 1, 2, 12, 0, 0, tzinfo=timezone.utc),
    }]

    actuals = [{
        "startTime": "2026-01-02T12:00:00Z",
        "generation": 5000,
    }]

    # Forecast published after 11:00 cutoff only
    forecasts = [
        {"startTime": "2026-01-02T12:00:00Z", "publishTime": "2026-01-02T11:30:00Z", "generation": 5100},
    ]

    results = match_intervals(
        expected_intervals=expected,
        actual_records=actuals,
        forecast_records=forecasts,
        cutoff_preset="gate_closure",
    )

    rec = results[0]
    assert rec.status == "missing_forecast"
    assert rec.actual_generation_mw == 5000.0
    assert rec.forecast_generation_mw is None
    assert rec.error_mw is None


def test_forecast_selection_missing_actual():
    """If forecast exists but actual is missing, interval is marked missing_actual."""
    expected = [{
        "start_time": "2026-01-02T12:00:00Z",
        "settlement_date": "2026-01-02",
        "settlement_period": 25,
        "start_dt": datetime(2026, 1, 2, 12, 0, 0, tzinfo=timezone.utc),
    }]

    actuals = []  # No actuals

    forecasts = [
        {"startTime": "2026-01-02T12:00:00Z", "publishTime": "2026-01-02T10:00:00Z", "generation": 4800},
    ]

    results = match_intervals(
        expected_intervals=expected,
        actual_records=actuals,
        forecast_records=forecasts,
        cutoff_preset="gate_closure",
    )

    rec = results[0]
    assert rec.status == "missing_actual"
    assert rec.forecast_generation_mw == 4800.0
    assert rec.actual_generation_mw is None
    assert rec.error_mw is None


def test_forecast_selection_hourly_granularity_fallback():
    """Verify that an hourly forecast for 00:00:00Z matches both Period 1 (00:00) and Period 2 (00:30)."""
    expected = [
        {
            "start_time": "2026-01-01T00:00:00Z",
            "settlement_date": "2026-01-01",
            "settlement_period": 1,
            "start_dt": datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
        },
        {
            "start_time": "2026-01-01T00:30:00Z",
            "settlement_date": "2026-01-01",
            "settlement_period": 2,
            "start_dt": datetime(2026, 1, 1, 0, 30, 0, tzinfo=timezone.utc),
        },
    ]

    actuals = [
        {"startTime": "2026-01-01T00:00:00Z", "generation": 10000},
        {"startTime": "2026-01-01T00:30:00Z", "generation": 10200},
    ]

    # Only one forecast exists, published at 2025-12-31 22:00 UTC with startTime 2026-01-01 00:00:00Z
    forecasts = [
        {"startTime": "2026-01-01T00:00:00Z", "publishTime": "2025-12-31T22:00:00Z", "generation": 10500},
    ]

    results = match_intervals(
        expected_intervals=expected,
        actual_records=actuals,
        forecast_records=forecasts,
        cutoff_preset="gate_closure",
    )

    assert len(results) == 2
    # Both Period 1 and Period 2 should be matched with the 10500 MW forecast
    assert results[0].status == "matched"
    assert results[0].forecast_generation_mw == 10500.0
    assert results[0].error_mw == 500.0

    assert results[1].status == "matched"
    assert results[1].forecast_generation_mw == 10500.0
    assert results[1].error_mw == 300.0

