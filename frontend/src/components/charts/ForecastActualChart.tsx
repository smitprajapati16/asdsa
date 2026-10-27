import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { IntervalRecord } from '../../types';
import { formatDateTime, formatDecMW, formatSignedMW, formatTimeOnly } from '../../utils/formatters';

interface ForecastActualChartProps {
  intervals: IntervalRecord[];
  viewMode?: 'daily' | 'intervals';
}

export const ForecastActualChart: React.FC<ForecastActualChartProps> = ({
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
        actual: item.actual_generation_mw,
        forecast: item.forecast_generation_mw,
        error: item.error_mw,
        publishTime: item.forecast_publish_time,
        leadTime: item.lead_time_hours,
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
        period: group.actuals.length,
        actual: avgActual,
        forecast: avgForecast,
        error: avgError,
        publishTime: null,
        leadTime: null,
        isDaily: true,
      };
    });
  }, [intervals, isSingleDay, viewMode]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-white text-main p-3 rounded-lg shadow-lg text-xs border border-subtle max-w-xs font-sans">
          <div className="font-semibold text-main border-b border-subtle pb-1.5 mb-2 flex justify-between">
            <span>
              {data?.isDaily
                ? new Date(label).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : formatDateTime(label)}
            </span>
            <span className="text-secondary font-mono">
              {data?.isDaily ? `${data?.period} periods` : `Period ${data?.period}`}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-main">
              <span className="flex items-center text-secondary">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] mr-1.5 shrink-0" />
                Actual Delivered:
              </span>
              <span className="font-mono font-medium">{formatDecMW(data?.actual)}</span>
            </div>

            <div className="flex justify-between items-center text-main">
              <span className="flex items-center text-secondary">
                <span className="w-2.5 h-2.5 rounded-full bg-[#15803D] mr-1.5 shrink-0" />
                Eligible Forecast:
              </span>
              <span className="font-mono font-semibold text-[#15803D]">{formatDecMW(data?.forecast)}</span>
            </div>

            <div className="flex justify-between items-center border-t border-subtle pt-1 text-secondary">
              <span>{data?.isDaily ? 'Mean Error (F − A):' : 'Error (F − A):'}</span>
              <span className={`font-mono font-medium ${
                (data?.error ?? 0) > 0 ? 'text-warning' : (data?.error ?? 0) < 0 ? 'text-error' : 'text-secondary'
              }`}>
                {formatSignedMW(data?.error)}
              </span>
            </div>

            {data?.publishTime && (
              <div className="pt-1 text-[11px] text-secondary border-t border-subtle flex flex-col">
                <span>Published: {formatDateTime(data.publishTime)}</span>
                {data.leadTime !== null && (
                  <span className="text-secondary/80 font-mono">({data.leadTime}h prior to delivery)</span>
                )}
              </div>
            )}
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
            Wind Generation: Forecast vs. Actual
          </h3>
          <p className="text-xs text-secondary">
            {viewMode === 'daily' && !isSingleDay
              ? 'Daily mean megawatts (MW) delivered across January 2026.'
              : 'Megawatts (MW) delivered across half-hour settlement periods.'}
          </p>
        </div>

        {/* Legend: Clear distinct SVG indicators for both lines */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs">
          <div className="flex items-center space-x-2 shrink-0">
              <svg className="w-5 h-2 shrink-0" viewBox="0 0 20 8">
                <line x1="0" y1="4" x2="20" y2="4" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span className="text-[#182230] font-medium">Actual Delivered</span>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <svg className="w-5 h-2 shrink-0" viewBox="0 0 20 8">
                <line x1="0" y1="4" x2="20" y2="4" stroke="#15803D" strokeWidth="2.5" strokeDasharray="4 2" strokeLinecap="round" />
              </svg>
              <span className="text-[#182230] font-medium">Eligible Forecast</span>
            </div>
          </div>
        </div>

      {/* Horizontally swipeable chart container on mobile without visible scrollbar */}
      <div className="overflow-x-auto no-scrollbar w-full touch-pan-x">
        <div className="h-80 w-full min-w-[560px] md:min-w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#15803D" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#15803D" stopOpacity={0.0} />
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
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k\u00A0MW`}
              tick={{ fontSize: 11, fill: '#667085' }}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="actual"
              name="Actual Generation"
              stroke="#2563EB"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorActual)"
              dot={false}
              activeDot={{ r: 4, stroke: '#FFFFFF', strokeWidth: 2, fill: '#2563EB' }}
            />
            <Area
              type="monotone"
              dataKey="forecast"
              name="Forecast Generation"
              stroke="#15803D"
              strokeWidth={2}
              strokeDasharray="4 2"
              fillOpacity={1}
              fill="url(#colorForecast)"
              dot={false}
              activeDot={{ r: 4, stroke: '#FFFFFF', strokeWidth: 2, fill: '#15803D' }}
            />
          </AreaChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
