import React from 'react';
import { Calendar } from 'lucide-react';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onChange,
}) => {
  const presets = [
    { label: 'Full Jan 2026', start: '2026-01-01', end: '2026-01-31' },
    { label: 'Week 1 (1–7)', start: '2026-01-01', end: '2026-01-07' },
    { label: 'Week 2 (8–14)', start: '2026-01-08', end: '2026-01-14' },
    { label: 'Week 3 (15–21)', start: '2026-01-15', end: '2026-01-21' },
    { label: 'Storm Period (24–26)', start: '2026-01-24', end: '2026-01-26' },
  ];

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && val <= endDate) {
      onChange(val, endDate);
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && val >= startDate) {
      onChange(startDate, val);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
      {/* Date Pickers */}
      <div className="flex items-center space-x-2 bg-white border border-subtle rounded-lg px-2.5 py-1.5 shadow-sm">
        <Calendar className="w-4 h-4 text-[#15803D] shrink-0" />
        <div className="flex items-center space-x-1.5 text-xs">
          <label htmlFor="start-date-input" className="text-secondary font-medium">From</label>
          <input
            id="start-date-input"
            type="date"
            min="2026-01-01"
            max="2026-01-31"
            value={startDate}
            onChange={handleStartChange}
            className="bg-slate-50 border border-subtle rounded px-2 py-0.5 font-mono text-main text-xs focus:ring-1 focus:ring-brand-600 focus:outline-none"
          />
          <label htmlFor="end-date-input" className="text-secondary font-medium pl-1">To</label>
          <input
            id="end-date-input"
            type="date"
            min="2026-01-01"
            max="2026-01-31"
            value={endDate}
            onChange={handleEndChange}
            className="bg-slate-50 border border-subtle rounded px-2 py-0.5 font-mono text-main text-xs focus:ring-1 focus:ring-brand-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-1">
        {presets.map((p) => {
          const isActive = startDate === p.start && endDate === p.end;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(p.start, p.end)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-secondary hover:text-main border border-subtle'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
