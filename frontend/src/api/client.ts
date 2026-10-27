import {
  ComparisonResponse,
  DailySummaryResponse,
  HealthResponse,
  PaginatedIntervalsResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function fetchIntervals(
  startDate: string,
  endDate: string,
  cutoffPreset: string,
  cutoffHours: number,
  page: number = 1,
  pageSize: number = 24,
  sortField: string = 'start_time',
  sortAsc: boolean = true
): Promise<PaginatedIntervalsResponse> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    cutoff_preset: cutoffPreset,
    cutoff_hours: cutoffHours.toString(),
    page: page.toString(),
    page_size: pageSize.toString(),
    sort_field: sortField,
    sort_asc: sortAsc.toString(),
  });

  const response = await fetch(`${API_BASE_URL}/api/intervals?${params.toString()}`);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorBody.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function fetchComparison(
  startDate: string,
  endDate: string,
  cutoffPreset: string,
  cutoffHours: number
): Promise<ComparisonResponse> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    cutoff_preset: cutoffPreset,
    cutoff_hours: cutoffHours.toString(),
  });

  const response = await fetch(`${API_BASE_URL}/api/comparison?${params.toString()}`);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorBody.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function fetchDailySummary(
  startDate: string,
  endDate: string,
  cutoffPreset: string,
  cutoffHours: number
): Promise<DailySummaryResponse> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    cutoff_preset: cutoffPreset,
    cutoff_hours: cutoffHours.toString(),
  });

  const response = await fetch(`${API_BASE_URL}/api/accuracy/daily?${params.toString()}`);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorBody.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function checkBackendHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }
  return response.json();
}
