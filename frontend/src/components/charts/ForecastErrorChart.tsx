import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { IntervalRecord } from '../../types';
import { formatDateTime, formatSignedMW, formatTimeOnly } from '../../utils/formatters';

interface ForecastErrorChartProps {
  intervals: IntervalRecord[];
  viewMode?: 'daily' | 'intervals';
}

export const ForecastErrorChart: React.FC<ForecastErrorChartProps> = ({
  intervals,
  viewMode = 'daily',
}) => {
  const isSingleDay =
    intervals.length > 0 &&
    intervals[0].settlement_date === intervals[intervals.length - 1].settlement_date;

  const chartData = React.useMemo(() => {
    if (isSingleDay || viewMode === 'intervals') {
      return intervals.map((item) => ({
        time: item.start_time,
        dateStr: item.settlement_date,
        period: item.settlement_period,
        error: item.error_mw,
        actual: item.actual_generation_mw,
        forecast: item.forecast_generation_mw,
        isDaily: false,
      }));
    }

    // Daily Summary aggregation: 1 smooth point per day across the range
    const byDate: Record<string, { actuals: number[]; forecasts: number[]; errors: number[] }> = {};
    for (const item of intervals) {
      if (!byDate[item.settlement_date]) {
        byDate[item.settlement_date] = { actuals: [], forecasts: [], errors: [] };
      }
      if (item.actual_generation_mw !== null) byDate[item.settlement_date].actuals.push(item.actual_generation_mw);
      if (item.forecast_generation_mw !== null) byDate[item.settlement_date].forecasts.push(item.forecast_generation_mw);
      if (item.error_mw !== null) byDate[item.settlement_date].errors.push(item.error_mw);
    }

    return Object.entries(byDate).map(([dateStr, group]) => {
      const avgActual = group.actuals.length ? Math.round(group.actuals.reduce((a, b) => a + b, 0) / group.actuals.length) : null;
      const avgForecast = group.forecasts.length ? Math.round(group.forecasts.reduce((a, b) => a + b, 0) / group.forecasts.length) : null;
      const avgError = group.errors.length ? Math.round(group.errors.reduce((a, b) => a + b, 0) / group.errors.length) : null;

      return {
        time: `${dateStr}T12:00:00Z`,
        dateStr,
        period: group.errors.length,
        actual: avgActual,
        forecast: avgForecast,
        error: avgError,
        isDaily: true,
      };
    });
  }, [intervals, isSingleDay, viewMode]);

  // Calculate 0 offset so positive error fills amber and negative error fills crimson
  const gradientOffset = () => {
    const dataMax = Math.max(...chartData.map((i) => i.error ?? 0), 0);
    const dataMin = Math.min(...chartData.map((i) => i.error ?? 0), 0);
    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;
    return dataMax / (dataMax - dataMin);
  };
  const off = gradientOffset();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      const err = data?.error ?? 0;
      return (
        <div className="bg-white text-main p-3 rounded-lg shadow-lg text-xs border border-subtle max-w-xs font-sans">
          <div className="font-semibold text-main border-b border-subtle pb-1 mb-2 flex justify-between">
            <span>
              {data?.isDaily
                ? new Date(label).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : formatDateTime(label)}
            </span>
            <span className="text-secondary font-mono">
              {data?.isDaily ? `${data?.period} periods` : `Period ${data?.period}`}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center text-main">
              <span className="flex items-center text-secondary">
                <span
                  className="w-2.5 h-2.5 rounded-full mr-1.5 shrink-0"
                  style={{ backgroundColor: err >= 0 ? '#D97706' : '#DC2626' }}
                />
                {data?.isDaily ? 'Daily Mean Error:' : 'Forecast Error:'}
              </span>
              <span
                className="font-mono font-semibold"
                style={{ color: err > 0 ? '#D97706' : err < 0 ? '#DC2626' : '#667085' }}
              >
                {formatSignedMW(err)}
              </span>
            </div>
            <div className="text-[11px] text-secondary pt-1 border-t border-subtle">
              {err > 0
                ? 'Overforecast: Delivered less wind than expected.'
                : err < 0
                ? 'Underforecast: Delivered more wind than expected.'
                : 'Exact match.'}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-subtle p-3.5 sm:p-5 shadow-sm mb-6 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-main">
            Forecast Error Over Time
          </h3>
          <p className="text-xs text-secondary">
            {viewMode === 'daily' && !isSingleDay
              ? 'Daily mean signed error (Forecast − Actual) across January 2026.'
              : 'Signed error (Forecast − Actual) in MW with zero reference line.'}
          </p>
        </div>

        {/* Legend: Clear distinct SVG indicators matching the top chart's style */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs">
          <div className="flex items-center space-x-2 shrink-0">
              <svg className="w-5 h-2 shrink-0" viewBox="0 0 20 8">
                <line x1="0" y1="4" x2="20" y2="4" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span className="text-[#182230] font-medium">Overforecast (+MW)</span>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <svg className="w-5 h-2 shrink-0" viewBox="0 0 20 8">
                <line x1="0" y1="4" x2="20" y2="4" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span className="text-[#182230] font-medium">Underforecast (−MW)</span>
            </div>
          </div>
        </div>

      {/* Horizontally swipeable chart container on mobile without visible scrollbar */}
      <div className="overflow-x-auto no-scrollbar w-full touch-pan-x">
        <div className="h-80 w-full min-w-[560px] md:min-w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="errorAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D97706" stopOpacity={0.2} />
                  <stop offset={off} stopColor="#D97706" stopOpacity={0.02} />
                  <stop offset={off} stopColor="#DC2626" stopOpacity={0.02} />
                  <stop offset="100%" stopColor="#DC2626" stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="errorStrokeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D97706" stopOpacity={1} />
                  <stop offset={off} stopColor="#D97706" stopOpacity={1} />
                  <stop offset={off} stopColor="#DC2626" stopOpacity={1} />
                  <stop offset="100%" stopColor="#DC2626" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis
                dataKey="time"
                tickFormatter={(t) => {
                  if (isSingleDay) {
                    return formatTimeOnly(t);
                  }
                  const d = new Date(t);
                  return `${d.getUTCDate()} Jan`;
                }}
                minTickGap={isSingleDay ? 25 : 40}
                tick={{ fontSize: 11, fill: '#667085' }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis
                width={75}
                tickFormatter={(v) => `${v > 0 ? '+' : ''}${(v / 1000).toFixed(1)}k\u00A0MW`}
                tick={{ fontSize: 11, fill: '#667085' }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#9CA3AF" strokeWidth={1} strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="error"
                name="Forecast Error"
                stroke="url(#errorStrokeGradient)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#errorAreaGradient)"
                baseValue={0}
                dot={false}
                activeDot={{ r: 4, stroke: '#FFFFFF', strokeWidth: 2, fill: '#D97706' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
