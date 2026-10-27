import { IntervalRecord } from '../types';

export function exportIntervalsToCsv(intervals: IntervalRecord[], filename = 'windscope_intervals.csv') {
  if (!intervals || intervals.length === 0) return;

  const headers = [
    'Settlement Date',
    'Period',
    'Start Time (UTC)',
    'Actual (MW)',
    'Forecast (MW)',
    'Error (MW)',
    'Absolute Error (MW)',
    'Forecast Publish Time (UTC)',
    'Lead Time (Hours)',
    'Status',
  ];

  const rows = intervals.map((row) => [
    row.settlement_date,
    row.settlement_period,
    row.start_time,
    row.actual_generation_mw !== null ? row.actual_generation_mw : '',
    row.forecast_generation_mw !== null ? row.forecast_generation_mw : '',
    row.error_mw !== null ? row.error_mw : '',
    row.absolute_error_mw !== null ? row.absolute_error_mw : '',
    row.forecast_publish_time || '',
    row.lead_time_hours !== null ? row.lead_time_hours : '',
    row.status,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
