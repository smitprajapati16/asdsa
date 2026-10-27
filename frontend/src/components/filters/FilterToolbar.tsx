import React from 'react';
import { CutoffPreset } from '../../types';
import { CustomSelect, SelectOption } from '../common/CustomSelect';

interface FilterToolbarProps {
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
  cutoffPreset: CutoffPreset;
  cutoffHours: number;
  onCutoffChange: (preset: CutoffPreset, hours: number) => void;
  onReset: () => void;
}

const PRESET_OPTIONS = [
  { id: 'full', label: 'Full month (1–31 Jan)', start: '2026-01-01', end: '2026-01-31', description: 'Complete January 2026 dataset (1488 periods)' },
  { id: 'w1', label: 'Week 1 (1–7 Jan)', start: '2026-01-01', end: '2026-01-07', description: 'Early month baseline' },
  { id: 'w2', label: 'Week 2 (8–14 Jan)', start: '2026-01-08', end: '2026-01-14', description: 'Mid-month delivery' },
  { id: 'w3', label: 'Week 3 (15–21 Jan)', start: '2026-01-15', end: '2026-01-21', description: 'High wind generation days' },
  { id: 'storm', label: 'Storm period (24–26 Jan)', start: '2026-01-24', end: '2026-01-26', description: 'Extreme wind volatility event' },
];

const CUTOFF_OPTIONS: SelectOption[] = [
  { value: 'gate_closure_1', label: 'Gate Closure (1h ahead)', description: 'Balancing Mechanism standard cutoff' },
  { value: 'custom_2', label: '2 hours ahead', description: 'Intraday fine-tuning horizon' },
  { value: 'custom_4', label: '4 hours ahead', description: 'Short-term procurement view' },
  { value: 'custom_12', label: '12 hours ahead', description: 'Half-day forward position' },
  { value: 'custom_24', label: '24 hours ahead', description: 'Day-ahead scheduling horizon' },
  { value: 'day_ahead_12_24', label: 'Day-Ahead (D-1 12:00 UTC)', description: 'Standard wholesale auction cutoff' },
];

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  startDate,
  endDate,
  onDateChange,
  cutoffPreset,
  cutoffHours,
  onCutoffChange,
  onReset,
}) => {
  const isDefault =
    startDate === '2026-01-01' &&
    endDate === '2026-01-31' &&
    cutoffPreset === 'gate_closure' &&
    cutoffHours === 1.0;

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && val <= endDate) {
      onDateChange(val, endDate);
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val && val >= startDate) {
      onDateChange(startDate, val);
    }
  };

  const handleCutoffSelect = (val: string) => {
    if (val === 'gate_closure_1') {
      onCutoffChange('gate_closure', 1.0);
    } else if (val === 'day_ahead_12_24') {
      onCutoffChange('day_ahead_12', 24.0);
    } else if (val.startsWith('custom_')) {
      const hours = parseFloat(val.replace('custom_', ''));
      onCutoffChange('custom', hours);
    }
  };

  const matchingPreset = PRESET_OPTIONS.find((p) => p.start === startDate && p.end === endDate);
  const currentPresetId = matchingPreset ? matchingPreset.id : 'custom';

  const periodSelectOptions: SelectOption[] = [
    ...PRESET_OPTIONS.map((p) => ({
      value: p.id,
      label: p.label,
      description: p.description,
    })),
    ...(matchingPreset
      ? []
      : [
          {
            value: 'custom',
            label:
              startDate === endDate
                ? `1 Day (${new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})`
                : 'Custom range',
            description: `${startDate} to ${endDate}`,
          },
        ]),
  ];

  const handlePeriodPresetSelect = (id: string) => {
    const found = PRESET_OPTIONS.find((p) => p.id === id);
    if (found) {
      onDateChange(found.start, found.end);
    }
  };

  const currentCutoffVal = `${cutoffPreset}_${cutoffHours}`;

  return (
    <section id="filter-toolbar" aria-label="Filters and Controls" className="mb-6">
      {/* Header row with section title & clear filters */}
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <h2 className="text-xs font-semibold text-[#182230] tracking-wide uppercase">
          Analysis period & cutoff
        </h2>
        {!isDefault && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-[#667085] hover:text-[#15803D] font-medium transition-colors cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Main Filter Toolbar */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 sm:px-4 sm:py-3 shadow-sm">
        {/* DESKTOP (lg: and above) -> 3 evenly balanced sections: Left (Dates), Center (Presets), Right (Cutoff) */}
        <div className="hidden lg:flex items-center justify-between gap-4">
          {/* 1. Left: Date Range Inputs */}
          <div className="flex items-center space-x-1.5 text-xs text-[#667085] shrink-0">
            <label htmlFor="filter-start-date" className="font-medium text-[#182230] shrink-0">
              Period:
            </label>
            <input
              id="filter-start-date"
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={startDate}
              onChange={handleStartChange}
              className="h-8 w-[114px] px-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-mono text-[#182230] shadow-sm hover:border-[#D1D5DB] focus:ring-2 focus:ring-[#15803D]/20 focus:border-[#15803D] focus:outline-none transition-all"
            />
            <span className="text-[#667085] font-semibold">—</span>
            <input
              id="filter-end-date"
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={endDate}
              onChange={handleEndChange}
              className="h-8 w-[114px] px-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-mono text-[#182230] shadow-sm hover:border-[#D1D5DB] focus:ring-2 focus:ring-[#15803D]/20 focus:border-[#15803D] focus:outline-none transition-all"
            />
          </div>

          {/* 2. Center: Desktop Preset Buttons */}
          <div className="flex items-center justify-center gap-1.5 shrink-0">
            {PRESET_OPTIONS.map((p) => {
              const isActive = startDate === p.start && endDate === p.end;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onDateChange(p.start, p.end)}
                  style={
                    isActive
                      ? { backgroundColor: '#15803D', color: '#FFFFFF', borderColor: '#15803D' }
                      : { backgroundColor: '#FFFFFF', color: '#182230', borderColor: '#E5E7EB' }
                  }
                  className={`h-8 px-2.5 rounded-lg text-xs font-medium border transition-all duration-150 cursor-pointer shadow-sm select-none whitespace-nowrap ${
                    isActive
                      ? 'shadow-sm font-semibold'
                      : 'hover:bg-[#F7F8F7] hover:border-[#D1D5DB] hover:text-[#15803D]'
                  }`}
                >
                  {p.id === 'full'
                    ? 'Full month'
                    : p.id === 'w1'
                    ? 'Week 1 (1–7)'
                    : p.id === 'w2'
                    ? 'Week 2 (8–14)'
                    : p.id === 'w3'
                    ? 'Week 3 (15–21)'
                    : 'Storm (24–26)'}
                </button>
              );
            })}
          </div>

          {/* 3. Right: Decision Cutoff Selector */}
          <div className="flex items-center space-x-2 text-xs shrink-0">
            <label htmlFor="filter-cutoff" className="font-medium text-[#182230] shrink-0">
              Decision cutoff:
            </label>
            <CustomSelect
              value={currentCutoffVal}
              options={CUTOFF_OPTIONS}
              onChange={handleCutoffSelect}
              ariaLabel="Decision cutoff selector"
              align="right"
              className="w-52"
            />
          </div>
        </div>

        {/* TABLET & MOBILE (< lg:) -> Two clean rows, both dropdowns in one line */}
        <div className="flex flex-col gap-2.5 lg:hidden">
          {/* Row 1: Date Range Inputs */}
          <div className="flex items-center space-x-1.5 text-xs text-[#667085] w-full min-w-0">
            <label htmlFor="filter-start-date-mobile" className="font-medium text-[#182230] shrink-0 text-xs">
              Period:
            </label>
            <input
              id="filter-start-date-mobile"
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={startDate}
              onChange={handleStartChange}
              className="h-8 flex-1 min-w-0 w-0 px-1.5 sm:px-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-mono text-[#182230] shadow-sm hover:border-[#D1D5DB] focus:ring-2 focus:ring-[#15803D]/20 focus:border-[#15803D] focus:outline-none transition-all"
            />
            <span className="text-[#667085] font-semibold shrink-0">—</span>
            <input
              id="filter-end-date-mobile"
              type="date"
              min="2026-01-01"
              max="2026-01-31"
              value={endDate}
              onChange={handleEndChange}
              className="h-8 flex-1 min-w-0 w-0 px-1.5 sm:px-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-mono text-[#182230] shadow-sm hover:border-[#D1D5DB] focus:ring-2 focus:ring-[#15803D]/20 focus:border-[#15803D] focus:outline-none transition-all"
            />
          </div>

          {/* Row 2: BOTH DROPDOWNS SIDE BY SIDE IN ONE LINE (no label text) */}
          <div className="flex items-center gap-2 w-full min-w-0">
            <CustomSelect
              value={currentPresetId}
              options={periodSelectOptions}
              onChange={handlePeriodPresetSelect}
              ariaLabel="Select analysis period preset"
              align="left"
              className="flex-1 min-w-0"
            />
            <CustomSelect
              value={currentCutoffVal}
              options={CUTOFF_OPTIONS}
              onChange={handleCutoffSelect}
              ariaLabel="Select decision cutoff"
              align="right"
              className="flex-1 min-w-0"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
