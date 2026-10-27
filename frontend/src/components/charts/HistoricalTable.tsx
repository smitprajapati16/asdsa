import React, { useState, useEffect, useCallback } from 'react';
import { IntervalRecord, CutoffPreset } from '../../types';
import { StatusBadge } from '../common/Badge';
import {
  formatDateTime,
  formatDecMW,
  formatSignedMW,
} from '../../utils/formatters';
import { exportIntervalsToCsv } from '../../utils/exportCsv';
import { Download, ChevronLeft, ChevronRight, ArrowUpDown, Loader2 } from 'lucide-react';
import { CustomSelect } from '../common/CustomSelect';
import { fetchIntervals } from '../../api/client';

interface HistoricalTableProps {
  intervals: IntervalRecord[];
  startDate: string;
  endDate: string;
  cutoffPreset?: CutoffPreset;
  cutoffHours?: number;
}

type SortField = 'start_time' | 'actual' | 'forecast' | 'error' | 'abs_error';

export const HistoricalTable: React.FC<HistoricalTableProps> = ({
  intervals,
  startDate,
  endDate,
  cutoffPreset = 'gate_closure',
  cutoffHours = 1.0,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(48);
  const [sortField, setSortField] = useState<SortField>('start_time');
  const [sortAsc, setSortAsc] = useState(true);
  const [paginatedRecords, setPaginatedRecords] = useState<IntervalRecord[]>(() => intervals.slice(0, 48));
  const [totalPages, setTotalPages] = useState(() => Math.ceil(intervals.length / 48) || 1);
  const [totalRecords, setTotalRecords] = useState(() => intervals.length);
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  // When filters from toolbar change (startDate, endDate, cutoffPreset, cutoffHours), reset page
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, cutoffPreset, cutoffHours]);

  // Fetch paginated intervals on page/sort/size/filter change
  const loadPage = useCallback(async () => {
    setIsLoadingPage(true);
    try {
      const res = await fetchIntervals(
        startDate,
        endDate,
        cutoffPreset,
        cutoffHours,
        currentPage,
        pageSize,
        sortField,
        sortAsc
      );
      setPaginatedRecords(res.intervals);
      setTotalPages(res.total_pages);
      setTotalRecords(res.total);
    } catch (err) {
      console.error('Failed to fetch paginated table records:', err);
    } finally {
      setIsLoadingPage(false);
    }
  }, [startDate, endDate, cutoffPreset, cutoffHours, currentPage, pageSize, sortField, sortAsc]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
    setCurrentPage(1);
  };

  const handleDownload = () => {
    const filename = `windscope_${startDate}_to_${endDate}.csv`;
    exportIntervalsToCsv(intervals, filename);
  };

  return (
    <div className="bg-white rounded-lg border border-subtle shadow-sm overflow-hidden mb-6 w-full max-w-full">
      <div className="p-3.5 sm:p-5 border-b border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white w-full">
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-main truncate">
            Settlement Interval Records
          </h3>
          <p className="text-xs text-secondary mt-0.5 truncate">
            Inspecting {totalRecords || intervals.length} half-hour periods ({startDate} to {endDate}).
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-subtle text-main hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#15803D]" />
            <span>Export CSV</span>
          </button>

          <CustomSelect
            value={pageSize.toString()}
            options={[
              { value: '24', label: '24 rows (Half-day)' },
              { value: '48', label: '48 rows (Full day)' },
              { value: '96', label: '96 rows (2 days)' },
            ]}
            onChange={(val) => {
              setPageSize(Number(val));
              setCurrentPage(1);
            }}
            ariaLabel="Rows per page"
            align="right"
            className="w-44"
          />
        </div>
      </div>

      {/* Responsive Scrollable Table with touch swipe and hidden scrollbar on mobile */}
      <div className="overflow-x-auto no-scrollbar md:custom-scrollbar relative touch-pan-x">
        {isLoadingPage && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[0.5px] z-10 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
          </div>
        )}

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F9FAFB] border-b border-subtle text-secondary font-medium uppercase tracking-wider text-[11px] select-none">
              <th
                className="py-2.5 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors"
                onClick={() => handleSort('start_time')}
              >
                <div className="flex items-center space-x-1">
                  <span>Delivery Time (UTC)</span>
                  <ArrowUpDown className={`w-3 h-3 ${sortField === 'start_time' ? 'text-[#15803D]' : 'text-[#15803D]/60'}`} />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center">Period</th>
              <th
                className="py-2.5 px-4 text-right cursor-pointer hover:bg-slate-100/70 transition-colors"
                onClick={() => handleSort('actual')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Actual (MW)</span>
                  <ArrowUpDown className={`w-3 h-3 ${sortField === 'actual' ? 'text-[#15803D]' : 'text-[#15803D]/60'}`} />
                </div>
              </th>
              <th
                className="py-2.5 px-4 text-right cursor-pointer hover:bg-slate-100/70 transition-colors"
                onClick={() => handleSort('forecast')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Forecast (MW)</span>
                  <ArrowUpDown className={`w-3 h-3 ${sortField === 'forecast' ? 'text-[#15803D]' : 'text-[#15803D]/60'}`} />
                </div>
              </th>
              <th
                className="py-2.5 px-4 text-right cursor-pointer hover:bg-slate-100/70 transition-colors"
                onClick={() => handleSort('error')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Error (MW)</span>
                  <ArrowUpDown className={`w-3 h-3 ${sortField === 'error' ? 'text-[#15803D]' : 'text-[#15803D]/60'}`} />
                </div>
              </th>
              <th
                className="py-2.5 px-4 text-right cursor-pointer hover:bg-slate-100/70 transition-colors"
                onClick={() => handleSort('abs_error')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Abs Error (MW)</span>
                  <ArrowUpDown className={`w-3 h-3 ${sortField === 'abs_error' ? 'text-[#15803D]' : 'text-[#15803D]/60'}`} />
                </div>
              </th>
              <th className="py-2.5 px-4">Forecast Published (UTC)</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-subtle text-main transition-opacity duration-150 ${isLoadingPage ? 'opacity-60' : 'opacity-100'}`}>
            {paginatedRecords.map((row) => (
              <tr key={row.start_time} className="hover:bg-[#F9FAFB] transition-colors">
                <td className="py-2 px-4 font-mono font-medium whitespace-nowrap">
                  {formatDateTime(row.start_time)}
                </td>
                <td className="py-2 px-3 text-center font-mono text-secondary">
                  {row.settlement_period}
                </td>
                <td className="py-2 px-4 text-right font-mono font-medium">
                  {formatDecMW(row.actual_generation_mw)}
                </td>
                <td className="py-2 px-4 text-right font-mono font-semibold text-brand-700">
                  {formatDecMW(row.forecast_generation_mw)}
                </td>
                <td className={`py-2 px-4 text-right font-mono font-medium ${
                  (row.error_mw ?? 0) > 0 ? 'text-warning' : (row.error_mw ?? 0) < 0 ? 'text-error' : 'text-secondary'
                }`}>
                  {formatSignedMW(row.error_mw)}
                </td>
                <td className="py-2 px-4 text-right font-mono text-main">
                  {formatDecMW(row.absolute_error_mw)}
                </td>
                <td className="py-2 px-4 text-secondary whitespace-nowrap">
                  {row.forecast_publish_time ? (
                    <span title={`Published ${row.lead_time_hours}h prior`}>
                      {formatDateTime(row.forecast_publish_time)}{' '}
                      <span className="text-[10px] text-secondary/70">({row.lead_time_hours}h prior)</span>
                    </span>
                  ) : (
                    <span className="text-secondary/50">—</span>
                  )}
                </td>
                <td className="py-2 px-3 text-center whitespace-nowrap">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Centered Pagination Controls - 'Showing 1-48...' removed per user request */}
      <div className="p-3 border-t border-subtle bg-white flex items-center justify-center text-xs text-secondary select-none">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            disabled={currentPage <= 1 || isLoadingPage}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-subtle bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4 text-[#15803D]" />
          </button>
          <span className="px-3 font-medium text-main">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages || isLoadingPage}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg border border-subtle bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4 text-[#15803D]" />
          </button>
        </div>
      </div>
    </div>
  );
};
