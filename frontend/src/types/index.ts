export type IntervalStatus = 'matched' | 'missing_forecast' | 'missing_actual';

export type CutoffPreset = 'gate_closure' | 'day_ahead_12' | 'custom';

export interface IntervalRecord {
  start_time: string;
  settlement_date: string;
  settlement_period: number;
  actual_generation_mw: number | null;
  forecast_generation_mw: number | null;
  forecast_publish_time: string | null;
  lead_time_hours: number | null;
  error_mw: number | null;
  absolute_error_mw: number | null;
  status: IntervalStatus;
}

export interface AccuracyMetrics {
  mae_mw: number | null;
  rmse_mw: number | null;
  bias_mw: number | null;
  mean_actual_mw: number | null;
  mean_forecast_mw: number | null;
  max_overforecast_mw: number | null;
  max_underforecast_mw: number | null;
  valid_count: number;
}

export interface ComparisonMeta {
  app_name: string;
  start_date: string;
  end_date: string;
  cutoff_preset: CutoffPreset;
  cutoff_hours: number;
  fetched_at: string;
  total_expected_intervals: number;
  matched_intervals: number;
  missing_actuals: number;
  missing_forecasts: number;
  is_cached: boolean;
}

export interface ComparisonResponse {
  meta: ComparisonMeta;
  metrics: AccuracyMetrics;
  intervals: IntervalRecord[];
}

export interface PaginatedIntervalsResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  intervals: IntervalRecord[];
}

export interface DailySummaryItem {
  date: string;
  total_intervals: number;
  valid_count: number;
  mae_mw: number | null;
  rmse_mw: number | null;
  bias_mw: number | null;
  mean_actual_mw: number | null;
  mean_forecast_mw: number | null;
}

export interface DailySummaryResponse {
  meta: ComparisonMeta;
  days: DailySummaryItem[];
}

export interface HealthResponse {
  status: string;
  version: string;
  elexon_reachable: boolean;
  timestamp: string;
}
