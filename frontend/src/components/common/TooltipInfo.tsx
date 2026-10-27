import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface TooltipInfoProps {
  content: string;
  ariaLabel?: string;
  className?: string;
}

export const TooltipInfo: React.FC<TooltipInfoProps> = ({
  content,
  ariaLabel = 'More information',
  className = '',
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className={`relative inline-flex items-center group ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <button
        type="button"
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="text-brand-600 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600/40 rounded transition-colors cursor-pointer shrink-0 p-0.5 inline-flex items-center justify-center"
        aria-label={ariaLabel}
      >
        <Info className="w-3.5 h-3.5 shrink-0 pointer-events-none text-[#15803D]" />
      </button>

      {/* Tooltip Popup: guaranteed high contrast, readable text, and instant visibility on hover/focus */}
      <div
        role="tooltip"
        style={{
          backgroundColor: '#182230',
          color: '#FFFFFF',
        }}
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[9999] w-64 p-2.5 rounded-lg shadow-xl pointer-events-none border border-slate-700/60 whitespace-normal transition-all duration-150 ${
          visible
            ? 'opacity-100 visible scale-100'
            : 'opacity-0 invisible scale-95 group-hover:opacity-100 group-hover:visible group-hover:scale-100'
        }`}
      >
        <span
          style={{ color: '#FFFFFF' }}
          className="block font-sans text-xs font-normal normal-case tracking-normal leading-relaxed text-left text-white whitespace-normal"
        >
          {content}
        </span>
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
          style={{ borderTopColor: '#182230' }}
        />
      </div>
    </div>
  );
};
