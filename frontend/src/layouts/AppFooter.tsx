import React from 'react';
import { ExternalLink } from 'lucide-react';

export const AppFooter: React.FC = () => {
  return (
    <footer className="bg-white border-t border-subtle text-xs py-8 mt-16 text-secondary">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle pb-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[#15803D]">WindScope</span>
            <span className="text-secondary">•</span>
            <span className="text-secondary">UK Wind Forecast Intelligence</span>
          </div>

          <div>
            <a
              href="https://bmrs.elexon.co.uk/api-documentation"
              target="_blank"
              rel="noreferrer"
              className="text-secondary hover:text-brand-600 inline-flex items-center space-x-1 transition-colors"
            >
              <span>Elexon BMRS API Documentation</span>
              <ExternalLink className="w-3 h-3 text-[#15803D]" />
            </a>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-secondary/90">
          <strong className="text-main font-medium">Commercial Decision Support Notice:</strong> WindScope provides objective historical forecast accuracy analysis based strictly on published Elexon BMRS datasets (<code className="text-main font-mono">FUELHH</code> actuals and <code className="text-main font-mono">WINDFOR</code> forecasts). It does not receive or infer proprietary trades, purchase contracts, cash-out imbalance prices, or hedging positions.
        </p>
      </div>
    </footer>
  );
};
