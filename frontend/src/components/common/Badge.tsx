import React from 'react';
import { IntervalStatus } from '../../types';

interface BadgeProps {
  status: IntervalStatus;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status }) => {
  if (status === 'matched') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-brand-50 text-brand-700 border border-brand-100">
        Matched
      </span>
    );
  }
  if (status === 'missing_forecast') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-warning border border-amber-200">
        No Forecast
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-error border border-rose-200">
      No Actual
    </span>
  );
};
