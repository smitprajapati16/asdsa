import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
  align?: 'left' | 'right';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  options,
  onChange,
  ariaLabel = 'Select option',
  className = '',
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className || 'inline-block'}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full h-8 px-2.5 bg-white border border-[#E5E7EB] hover:border-[#15803D] text-[#182230] rounded-lg text-xs font-medium flex items-center justify-between gap-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15803D]/20 transition-all cursor-pointer select-none min-w-0"
      >
        <span className="truncate text-left flex-1 min-w-0">{selectedOption?.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#15803D] transition-transform duration-150 shrink-0 ml-1 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Floating Menu matching exact field width with all options visible without scrollbar */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } top-full mt-1.5 w-full min-w-full bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100`}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                type="button"
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(option.value);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  handleSelect(option.value);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#F0FDF4] text-[#15803D] font-semibold'
                    : 'text-[#182230] hover:bg-[#F0FDF4] hover:text-[#15803D]'
                }`}
              >
                <div className="flex flex-col text-left min-w-0 flex-1 pr-1">
                  <span className="leading-snug break-words">{option.label}</span>
                  {option.description && (
                    <span className="text-[10px] text-[#667085] font-normal mt-0.5 leading-snug break-words">
                      {option.description}
                    </span>
                  )}
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#15803D] shrink-0 ml-1.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
