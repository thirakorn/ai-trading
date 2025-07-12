'use client';

export type ChartType = 'line' | 'candlestick';

interface ChartTypeSelectorProps {
  currentChartType: ChartType;
  onChartTypeChange: (chartType: ChartType) => void;
  disabled?: boolean;
}

const chartTypeOptions: { value: ChartType; label: string; description: string; icon: string }[] = [
  { value: 'line', label: 'Line', description: 'Line Chart', icon: '📈' },
  { value: 'candlestick', label: 'OHLC', description: 'Candlestick Chart', icon: '📊' },
];

export default function ChartTypeSelector({ 
  currentChartType, 
  onChartTypeChange, 
  disabled = false 
}: ChartTypeSelectorProps) {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-400 font-medium">Chart:</span>
      <div className="flex bg-gray-800 rounded-lg p-1">
        {chartTypeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChartTypeChange(option.value)}
            disabled={disabled}
            className={`
              px-3 py-1 rounded text-sm font-medium transition-all duration-200 flex items-center space-x-1
              ${currentChartType === option.value
                ? 'bg-green-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={option.description}
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}