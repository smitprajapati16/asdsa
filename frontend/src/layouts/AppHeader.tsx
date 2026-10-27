import React from 'react';
import { Wind } from 'lucide-react';

interface AppHeaderProps {
  onSelectDailySummary: () => void;
  isActive?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onSelectDailySummary,
  isActive = false,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-subtle shadow-xs transition-shadow">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#15803D] flex items-center justify-center text-white shadow-sm">
            <Wind className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-[#15803D] tracking-tight">
            WindScope
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-1 sm:space-x-3">
          <button
            type="button"
            onClick={onSelectDailySummary}
            className={`inline-flex items-center space-x-2 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none ${
              isActive
                ? 'bg-[#F0FDF4] text-[#15803D] border-[#DCFCE7] shadow-xs'
                : 'text-secondary hover:text-main hover:bg-slate-50 border-transparent'
            }`}
          >
            {isActive && (
              <span className="w-2 h-2 rounded-full bg-[#15803D] animate-pulse shrink-0" />
            )}
            <span>Daily Summary</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
