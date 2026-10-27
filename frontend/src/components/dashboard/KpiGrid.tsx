import React from 'react';
import { AccuracyMetrics, ComparisonMeta } from '../../types';
import { formatDecMW, formatSignedMW } from '../../utils/formatters';
import { KpiCard } from './KpiCard';
import { Activity, Gauge, TrendingUp, CheckCircle2 } from 'lucide-react';

interface KpiGridProps {
  metrics: AccuracyMetrics;
  meta: ComparisonMeta;
}

export const KpiGrid: React.FC<KpiGridProps> = ({ metrics, meta }) => {
  const matchPct = meta.total_expected_intervals > 0
    ? Math.round((metrics.valid_count / meta.total_expected_intervals) * 100)
    : 0;

  const biasBadge = () => {
    if (metrics.bias_mw === null) return undefined;
    if (Math.abs(metrics.bias_mw) < 25) return { text: 'Balanced', type: 'neutral' as const };
    if (metrics.bias_mw > 0) return { text: 'Overforecasting', type: 'neutral' as const };
    return { text: 'Underforecasting', type: 'neutral' as const };
  };

  const biasInfo = biasBadge();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <KpiCard
        title="Mean Absolute Error (MAE)"
        value={formatDecMW(metrics.mae_mw)}
        subtitle="Average magnitude of forecast error across evaluated periods."
        tooltip="MAE = mean(|Forecast - Actual|). Reflects typical absolute MW deviation without directional bias. Lower is better."
        badgeText="Lower is better"
        badgeType="neutral"
        icon={<Activity className="w-4 h-4 text-brand-600" />}
      />

      <KpiCard
        title="Root Mean Squared Error"
        value={formatDecMW(metrics.rmse_mw)}
        subtitle="Error variance heavily penalizing large forecast spikes."
        tooltip="RMSE = sqrt(mean((Forecast - Actual)^2)). Disproportionately penalizes extreme unexpected generation misses. Lower is better."
        badgeText="Penalizes spikes"
        badgeType="neutral"
        icon={<Gauge className="w-4 h-4 text-brand-600" />}
      />

      <KpiCard
        title="Forecast Bias (Mean Error)"
        value={formatSignedMW(metrics.bias_mw)}
        subtitle={
          metrics.bias_mw && metrics.bias_mw > 0
            ? 'Forecasts systematically predicted more power than delivered.'
            : metrics.bias_mw && metrics.bias_mw < 0
            ? 'Forecasts systematically underpredicted actual power generated.'
            : 'Forecast errors are evenly balanced around actuals.'
        }
        tooltip="Bias = mean(Forecast - Actual). Positive means overestimation (purchasing team risked over-hedging). Negative means underestimation."
        badgeText={biasInfo?.text}
        badgeType={biasInfo?.type}
        icon={<TrendingUp className="w-4 h-4 text-brand-600" />}
      />

      <KpiCard
        title="Evaluated Intervals"
        value={`${metrics.valid_count} / ${meta.total_expected_intervals}`}
        subtitle={`${matchPct}% of expected 48-period intervals matched with eligible forecasts.`}
        tooltip="Count of delivery intervals having both actual wind generation and an eligible forecast run published on or before decision cutoff."
        badgeText={`${matchPct}% Matched`}
        badgeType="neutral"
        icon={<CheckCircle2 className="w-4 h-4 text-brand-600" />}
      />
    </div>
  );
};
