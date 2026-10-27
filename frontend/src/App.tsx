import React, { useEffect, useState, useCallback } from 'react';
import { ComparisonResponse, CutoffPreset } from './types';
import { fetchComparison } from './api/client';
import { AppHeader } from './layouts/AppHeader';
import { AppFooter } from './layouts/AppFooter';
import { FilterToolbar } from './components/filters/FilterToolbar';
import { KpiGrid } from './components/dashboard/KpiGrid';
import { DataQualityBanner } from './components/dashboard/DataQualityBanner';
import { ForecastActualChart } from './components/charts/ForecastActualChart';
import { ForecastErrorChart } from './components/charts/ForecastErrorChart';
import { HistoricalTable } from './components/charts/HistoricalTable';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-01-31');
  const [cutoffPreset, setCutoffPreset] = useState<CutoffPreset>('gate_closure');
  const [cutoffHours, setCutoffHours] = useState(1.0);

  const [chartViewMode, setChartViewMode] = useState<'daily' | 'intervals'>('daily');

  const [data, setData] = useState<ComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchComparison(startDate, endDate, cutoffPreset, cutoffHours);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch Elexon comparison data.');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, cutoffPreset, cutoffHours]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReset = () => {
    setStartDate('2026-01-01');
    setEndDate('2026-01-31');
    setCutoffPreset('gate_closure');
    setCutoffHours(1.0);
    setChartViewMode('daily');
  };

  const isDailyActive = chartViewMode === 'daily';

  return (
    <div className="flex flex-col min-h-screen bg-app w-full max-w-full overflow-x-clip">
      <AppHeader
        isActive={isDailyActive}
        onSelectDailySummary={() => {
          setChartViewMode((prev) => (prev === 'daily' ? 'intervals' : 'daily'));
          setTimeout(() => {
            const el = document.getElementById('charts-section');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 80);
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 overflow-x-clip">
        {/* Page Title & Intro */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-main tracking-tight">
            UK Wind Forecast Accuracy
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1">
            Evaluating National Grid / Elexon BMRS wind generation forecasts against delivered actuals across January 2026.
          </p>
        </div>

        {/* Compact, Unified Filter Toolbar */}
        <FilterToolbar
          startDate={startDate}
          endDate={endDate}
          onDateChange={(s, e) => {
            setStartDate(s);
            setEndDate(e);
          }}
          cutoffPreset={cutoffPreset}
          cutoffHours={cutoffHours}
          onCutoffChange={(preset, hours) => {
            setCutoffPreset(preset);
            setCutoffHours(hours);
          }}
          onReset={handleReset}
        />

        {/* Loading State */}
        {isLoading && <LoadingSpinner />}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-4 sm:p-5 bg-rose-50 border border-rose-200 rounded-lg text-error mb-6 flex items-start space-x-3 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-main">Failed to Load Market Data</h4>
              <p className="text-xs text-secondary mt-1">{error}</p>
              <button
                type="button"
                onClick={loadData}
                className="mt-3 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-md text-xs font-medium shadow-sm transition-colors"
              >
                Retry Request
              </button>
            </div>
          </div>
        )}

        {/* Success Data Dashboard */}
        {!isLoading && !error && data && (
          <>
            <DataQualityBanner meta={data.meta} />
            <KpiGrid metrics={data.metrics} meta={data.meta} />
            <div id="charts-section" className="space-y-6 mb-6">
              <ForecastActualChart
                intervals={data.intervals}
                viewMode={chartViewMode}
              />
              <ForecastErrorChart
                intervals={data.intervals}
                viewMode={chartViewMode}
              />
            </div>
            <HistoricalTable
              intervals={data.intervals}
              startDate={startDate}
              endDate={endDate}
              cutoffPreset={cutoffPreset}
              cutoffHours={cutoffHours}
            />
          </>
        )}
      </main>

      <AppFooter />
    </div>
  );
};
