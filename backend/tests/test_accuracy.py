"""Unit tests for forecast accuracy metric calculations."""

import math
import pytest
from app.services.accuracy import calculate_metrics


def test_calculate_metrics_basic_values():
    """Verify MAE, RMSE, and Bias with known manual calculations.
    
    Pairs: (forecast, actual)
    (100, 90) -> error = +10, abs = 10, sq = 100
    (80, 100) -> error = -20, abs = 20, sq = 400
    (50, 50)  -> error = 0,   abs = 0,  sq = 0
    (70, 60)  -> error = +10, abs = 10, sq = 100
    
    Total N = 4
    Sum abs = 40 -> MAE = 10.0
    Sum sq = 600 -> RMSE = sqrt(150) = 12.2474... -> 12.25
    Sum error = 0 -> Bias = 0.0
    Mean actual = 300 / 4 = 75.0
    Mean forecast = 300 / 4 = 75.0
    """
    pairs = [
        (100.0, 90.0),
        (80.0, 100.0),
        (50.0, 50.0),
        (70.0, 60.0),
    ]
    metrics = calculate_metrics(pairs)

    assert metrics.valid_count == 4
    assert metrics.mae_mw == 10.0
    assert metrics.rmse_mw == 12.25
    assert metrics.bias_mw == 0.0
    assert metrics.mean_actual_mw == 75.0
    assert metrics.mean_forecast_mw == 75.0
    assert metrics.max_overforecast_mw == 10.0
    assert metrics.max_underforecast_mw == -20.0


def test_calculate_metrics_positive_bias():
    """Verify that consistent overforecasting yields a positive bias."""
    pairs = [
        (150.0, 100.0),  # +50
        (220.0, 200.0),  # +20
    ]
    metrics = calculate_metrics(pairs)

    assert metrics.valid_count == 2
    assert metrics.bias_mw == 35.0
    assert metrics.mae_mw == 35.0
    assert metrics.rmse_mw == 38.08


def test_calculate_metrics_negative_bias():
    """Verify that consistent underforecasting yields a negative bias."""
    pairs = [
        (80.0, 100.0),   # -20
        (150.0, 200.0),  # -50
    ]
    metrics = calculate_metrics(pairs)

    assert metrics.valid_count == 2
    assert metrics.bias_mw == -35.0
    assert metrics.mae_mw == 35.0


def test_calculate_metrics_empty_list():
    """Empty list returns valid_count=0 and None for metrics."""
    metrics = calculate_metrics([])
    assert metrics.valid_count == 0
    assert metrics.mae_mw is None
    assert metrics.rmse_mw is None
    assert metrics.bias_mw is None
    assert metrics.mean_actual_mw is None
    assert metrics.mean_forecast_mw is None


def test_calculate_metrics_single_item():
    """Single item has MAE == RMSE == abs(error)."""
    pairs = [(1250.0, 1000.0)]
    metrics = calculate_metrics(pairs)

    assert metrics.valid_count == 1
    assert metrics.mae_mw == 250.0
    assert metrics.rmse_mw == 250.0
    assert metrics.bias_mw == 250.0
    assert metrics.mean_actual_mw == 1000.0
    assert metrics.mean_forecast_mw == 1250.0
