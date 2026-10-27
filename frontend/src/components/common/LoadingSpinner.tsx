import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading market data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-subtle shadow-sm my-6">
      <div className="w-8 h-8 border-2 border-brand-100 border-t-brand-600 rounded-full animate-spin mb-3.5" />
      <p className="text-sm font-medium text-main">{message}</p>
      <p className="text-xs text-secondary mt-1">Fetching Elexon FUELHH actuals & WINDFOR forecasts...</p>
    </div>
  );
};
