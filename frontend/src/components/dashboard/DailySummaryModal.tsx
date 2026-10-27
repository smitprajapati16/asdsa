import React, { useEffect, useState } from 'react';
import { DailySummaryResponse, CutoffPreset } from '../../types';
import { fetchDailySummary } from '../../api/client';
import { formatDecMW, formatSignedMW } from '../../utils/formatters';
import { X, Calendar } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface DailySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  cutoffPreset: CutoffPreset;
  cutoffHours: number;
}

export const DailySummaryModal: React.FC<DailySummaryModalProps> = ({
  isOpen,
  onClose,
  startDate,
  endDate,
  cutoffPreset,
  cutoffHours,
}) => {
  const [data, setData] = useState<DailySummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      fetchDailySummary(startDate, endDate, cutoffPreset, cutoffHours)
        .then((res) => setData(res))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, startDate, endDate, cutoffPreset, cutoffHours]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl border border-subtle w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 sm:p-5 border-b border-subtle flex items-center justify-between bg-white">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-main flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>Daily Accuracy Breakdown (January 2026)</span>
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              Aggregated daily performance metrics evaluated at the selected decision cutoff.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#15803D] hover:bg-[#F0FDF4] transition-colors"
          >
            <X className="w-5 h-5 text-[#15803D]" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-scrollbar">
          {loading && <LoadingSpinner message="Calculating daily accuracy metrics..." />}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-md text-error text-xs">
              Error: {error}
            </div>
          )}

          {!loading && !error && data && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB] text-secondary font-medium uppercase tracking-wider text-[11px] border-b border-subtle">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-center">Periods</th>
                    <th className="py-2.5 px-3 text-right">Mean Actual</th>
                    <th className="py-2.5 px-3 text-right">Mean Forecast</th>
                    <th className="py-2.5 px-3 text-right">MAE</th>
                    <th className="py-2.5 px-3 text-right">RMSE</th>
                    <th className="py-2.5 px-3 text-right">Bias</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle text-main">
                  {data.days.map((day) => (
                    <tr key={day.date} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-2 px-3 font-mono font-medium whitespace-nowrap">
                        {day.date}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-secondary">
                        {day.valid_count} / {day.total_intervals}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">
                        {formatDecMW(day.mean_actual_mw)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-brand-700">
                        {formatDecMW(day.mean_forecast_mw)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-main">
                        {formatDecMW(day.mae_mw)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-secondary">
                        {formatDecMW(day.rmse_mw)}
                      </td>
                      <td className={`py-2 px-3 text-right font-mono font-medium ${
                        (day.bias_mw ?? 0) > 0 ? 'text-warning' : (day.bias_mw ?? 0) < 0 ? 'text-error' : 'text-secondary'
                      }`}>
                        {formatSignedMW(day.bias_mw)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-subtle bg-white flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md text-xs font-medium bg-white border border-subtle text-main hover:bg-slate-50 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
