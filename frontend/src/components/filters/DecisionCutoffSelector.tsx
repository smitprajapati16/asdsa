import React from 'react';
import { CutoffPreset } from '../../types';
import { Clock } from 'lucide-react';
import { TooltipInfo } from '../common/TooltipInfo';

interface DecisionCutoffSelectorProps {
  cutoffPreset: CutoffPreset;
  cutoffHours: number;
  onChange: (preset: CutoffPreset, hours: number) => void;
}

export const DecisionCutoffSelector: React.FC<DecisionCutoffSelectorProps> = ({
  cutoffPreset,
  cutoffHours,
  onChange,
}) => {
  const options = [
    { preset: 'gate_closure' as CutoffPreset, hours: 1.0, label: 'Gate Closure (1h ahead)' },
    { preset: 'custom' as CutoffPreset, hours: 2.0, label: '2 Hours Ahead' },
    { preset: 'custom' as CutoffPreset, hours: 4.0, label: '4 Hours Ahead' },
    { preset: 'custom' as CutoffPreset, hours: 12.0, label: '12 Hours Ahead' },
    { preset: 'custom' as CutoffPreset, hours: 24.0, label: '24 Hours Ahead' },
    { preset: 'day_ahead_12' as CutoffPreset, hours: 24.0, label: 'Day-Ahead (D-1 12:00 UTC)' },
  ];

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const selected = options.find((opt) => `${opt.preset}_${opt.hours}` === val);
    if (selected) {
      onChange(selected.preset, selected.hours);
    }
  };

  const currentVal = `${cutoffPreset}_${cutoffHours}`;

  return (
    <div className="flex items-center space-x-2 bg-white border border-subtle rounded-lg px-2.5 py-1.5 shadow-sm text-xs">
      <div className="flex items-center text-secondary font-medium space-x-1 shrink-0">
        <Clock className="w-3.5 h-3.5 text-brand-600" />
        <span>Decision Cutoff:</span>
        <TooltipInfo content="Filters eligible forecasts to only those published prior to the selected market purchasing deadline." />
      </div>

      <select
        value={currentVal}
        onChange={handleSelectChange}
        className="bg-slate-50 border border-subtle text-main rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-brand-600 focus:outline-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={`${opt.preset}_${opt.hours}`} value={`${opt.preset}_${opt.hours}`}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
