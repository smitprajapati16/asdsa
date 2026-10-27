"""Forecast accuracy calculation service.

Computes Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and Forecast Bias
with strict validation, zero-division guards, and clear unit definitions (MW).
"""

import math
from typing import Sequence
from app.schemas.models import AccuracyMetrics


def calculate_metrics(
    pairs: Sequence[tuple[float, float]],
) -> AccuracyMetrics:
    """Calculate MAE, RMSE, Bias, and summary statistics from matched (forecast, actual) pairs.
    
    Args:
        pairs: Sequence of (forecast_generation_mw, actual_generation_mw) pairs.
               Pairs with None values must be filtered out prior to passing.

    Returns:
        AccuracyMetrics schema with rounded results, or empty metrics if pairs is empty.
    """
    valid_pairs = [(float(f), float(a)) for f, a in pairs if f is not None and a is not None]
    n = len(valid_pairs)

    if n == 0:
        return AccuracyMetrics(
            mae_mw=None,
            rmse_mw=None,
            bias_mw=None,
            mean_actual_mw=None,
            mean_forecast_mw=None,
            max_overforecast_mw=None,
            max_underforecast_mw=None,
            valid_count=0,
        )

    errors = [f - a for f, a in valid_pairs]
    abs_errors = [abs(e) for e in errors]
    sq_errors = [e * e for e in errors]

    actuals = [a for _, a in valid_pairs]
    forecasts = [f for f, _ in valid_pairs]

    mae = sum(abs_errors) / n
    rmse = math.sqrt(sum(sq_errors) / n)
    bias = sum(errors) / n
    mean_actual = sum(actuals) / n
    mean_forecast = sum(forecasts) / n
    max_over = max(errors)
    max_under = min(errors)

    return AccuracyMetrics(
        mae_mw=round(mae, 2),
        rmse_mw=round(rmse, 2),
        bias_mw=round(bias, 2),
        mean_actual_mw=round(mean_actual, 2),
        mean_forecast_mw=round(mean_forecast, 2),
        max_overforecast_mw=round(max_over, 2),
        max_underforecast_mw=round(max_under, 2),
        valid_count=n,
    )
