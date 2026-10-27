import React, { ReactNode } from 'react';
import { TooltipInfo } from '../common/TooltipInfo';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  tooltip: string;
  badgeText?: string;
  badgeType?: 'neutral' | 'success' | 'warning' | 'error';
  icon: ReactNode;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  tooltip,
  badgeText,
  badgeType = 'neutral',
  icon,
}) => {
  const getBadgeClass = () => {
    switch (badgeType) {
      case 'success':
        return 'bg-brand-50 text-brand-700 border-brand-100';
      case 'warning':
        return 'bg-amber-50 text-warning border-amber-200';
      case 'error':
        return 'bg-rose-50 text-error border-rose-200';
      default:
        return 'bg-slate-50 text-secondary border-subtle';
    }
  };

  // Bind last word of title with TooltipInfo in a whitespace-nowrap container
  // so the icon NEVER wraps to a line by itself below the text.
  const titleWords = title.trim().split(/\s+/);
  const lastWord = titleWords.pop() || '';
  const leadingWords = titleWords.join(' ');

  return (
    <div className="bg-white rounded-xl border border-subtle p-5 shadow-sm flex flex-col justify-between h-full hover:border-[#D1D5DB] transition-colors">
      <div>
        {/* Header: Stat card icon at start, vertically centered with title + info icon */}
        <div className="flex items-center gap-2.5 mb-2.5 min-h-[38px]">
          {/* Theme-consistent green stat card icon at the starting position */}
          <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0 text-brand-600 shadow-xs">
            {icon}
          </div>

          {/* Metric Title with Info Icon directly attached after text */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-semibold text-secondary uppercase tracking-tight leading-snug">
              {leadingWords && `${leadingWords} `}
              <span className="whitespace-nowrap inline-flex items-center gap-1.5">
                <span>{lastWord}</span>
                <TooltipInfo
                  content={tooltip}
                  ariaLabel={`Information about ${title}`}
                />
              </span>
            </h3>
          </div>
        </div>

        {/* Metric Value and Badge in shared flex container */}
        <div className="flex items-center gap-2 flex-wrap min-h-[32px] mb-2">
          <span className="text-2xl font-bold tracking-tight text-main font-mono leading-none">
            {value}
          </span>
          {badgeText && (
            <span
              className={`inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium leading-none border shrink-0 ${getBadgeClass()}`}
            >
              {badgeText}
            </span>
          )}
        </div>
      </div>

      {/* Description / Subtitle area */}
      <p className="text-xs text-secondary leading-relaxed min-h-[34px] flex items-start">
        {subtitle}
      </p>
    </div>
  );
};
