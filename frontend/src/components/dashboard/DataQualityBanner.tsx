import React from 'react';
import { ComparisonMeta } from '../../types';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface DataQualityBannerProps {
  meta: ComparisonMeta;
}

export const DataQualityBanner: React.FC<DataQualityBannerProps> = ({ meta }) => {
  const hasGaps = meta.missing_forecasts > 0 || meta.missing_actuals > 0;

  return (
    <div className={`p-3 sm:p-3.5 rounded-lg border mb-6 flex items-center text-xs w-full max-w-full overflow-hidden ${
      hasGaps
        ? 'bg-amber-50/60 border-amber-200 text-warning'
        : 'bg-white border-subtle text-secondary'
    }`}>
      <div className="flex items-start sm:items-center space-x-2.5 min-w-0">
        {hasGaps ? (
          <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5 sm:mt-0" />
        ) : (
          <CheckCircle className="w-4 h-4 text-brand-600 shrink-0 mt-0.5 sm:mt-0" />
        )}
        <div className="min-w-0">
          <span className="font-medium text-main mr-1.5">
            {hasGaps ? 'Data Notice:' : 'Data Integrity:'}
          </span>
          {hasGaps ? (
            <span>
              {meta.missing_forecasts} interval(s) without eligible forecast prior to cutoff; {meta.missing_actuals} missing actuals. Gaps excluded from accuracy KPIs.
            </span>
          ) : (
            <span>
              All {meta.total_expected_intervals} expected delivery intervals in range matched with valid Elexon BMRS FUELHH actuals & WINDFOR forecasts.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
