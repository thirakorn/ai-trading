'use client';

import { BinanceInterval } from '@/lib/binance';

interface TimeframeSelectorProps {
  currentTimeframe: BinanceInterval;
  onTimeframeChange: (timeframe: BinanceInterval) => void;
  disabled?: boolean;
}

const timeframeOptions: { value: BinanceInterval; label: string; category: string }[] = [
  // Minutes Group
  { value: '1m', label: '1 Minute', category: 'Minutes' },
  { value: '3m', label: '3 Minutes', category: 'Minutes' },
  { value: '5m', label: '5 Minutes', category: 'Minutes' },
  { value: '15m', label: '15 Minutes', category: 'Minutes' },
  { value: '30m', label: '30 Minutes', category: 'Minutes' },
  
  // Hours Group  
  { value: '1h', label: '1 Hour', category: 'Hours' },
  { value: '2h', label: '2 Hours', category: 'Hours' },
  { value: '4h', label: '4 Hours', category: 'Hours' },
  { value: '6h', label: '6 Hours', category: 'Hours' },
  { value: '8h', label: '8 Hours', category: 'Hours' },
  { value: '12h', label: '12 Hours', category: 'Hours' },
  
  // Days+ Group
  { value: '1d', label: '1 Day', category: 'Days+' },
  { value: '3d', label: '3 Days', category: 'Days+' },
  { value: '1w', label: '1 Week', category: 'Days+' },
  { value: '1M', label: '1 Month', category: 'Days+' }
];

// Group options by category
const groupedOptions = timeframeOptions.reduce((acc, option) => {
  if (!acc[option.category]) {
    acc[option.category] = [];
  }
  acc[option.category].push(option);
  return acc;
}, {} as Record<string, typeof timeframeOptions>);

export default function TimeframeSelector({ 
  currentTimeframe, 
  onTimeframeChange, 
  disabled = false 
}: TimeframeSelectorProps) {
  return (
    <div className="flex items-center space-x-1 sm:space-x-2">
      <span className="text-xs sm:text-sm text-gray-400 font-medium hidden sm:inline">Timeframe:</span>
      <div className="relative">
        <select
          value={currentTimeframe}
          onChange={(e) => onTimeframeChange(e.target.value as BinanceInterval)}
          disabled={disabled}
          className={`
            bg-gray-800 text-white border border-gray-600 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            hover:bg-gray-700 transition-colors duration-200
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {Object.entries(groupedOptions).map(([category, options]) => (
            <optgroup key={category} label={category} className="text-gray-300">
              {options.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-gray-800 text-white"
                >
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
}