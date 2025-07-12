'use client';

interface IndicatorControlsProps {
  showRSI: boolean;
  showMACD: boolean;
  onRSIToggle: (show: boolean) => void;
  onMACDToggle: (show: boolean) => void;
  disabled?: boolean;
}

export default function IndicatorControls({ 
  showRSI, 
  showMACD, 
  onRSIToggle, 
  onMACDToggle, 
  disabled = false 
}: IndicatorControlsProps) {
  return (
    <div className="flex items-center space-x-4">
      {/* RSI Toggle */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-400">RSI:</span>
        <button
          onClick={() => onRSIToggle(!showRSI)}
          disabled={disabled}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${showRSI 
              ? 'bg-yellow-600 hover:bg-yellow-700' 
              : 'bg-gray-600 hover:bg-gray-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 rounded-full bg-white transition-transform
              ${showRSI ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
        {showRSI && (
          <div className="flex items-center space-x-1">
            <div className="w-3 h-0.5 bg-yellow-500 rounded"></div>
            <span className="text-xs text-gray-400">ON</span>
          </div>
        )}
      </div>

      {/* MACD Toggle */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-400">MACD:</span>
        <button
          onClick={() => onMACDToggle(!showMACD)}
          disabled={disabled}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${showMACD 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-600 hover:bg-gray-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 rounded-full bg-white transition-transform
              ${showMACD ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
        {showMACD && (
          <div className="flex items-center space-x-1">
            <div className="flex space-x-0.5">
              <div className="w-2 h-0.5 bg-blue-500 rounded"></div>
              <div className="w-2 h-0.5 bg-red-500 rounded"></div>
              <div className="w-2 h-0.5 bg-green-500 rounded"></div>
            </div>
            <span className="text-xs text-gray-400">ON</span>
          </div>
        )}
      </div>

      {/* Legend when indicators are active */}
      {(showRSI || showMACD) && (
        <div className="border-l border-gray-600 pl-4">
          <div className="text-xs text-gray-400">
            {showRSI && showMACD && 'Indicators Active'}
            {showRSI && !showMACD && 'RSI Active'}
            {!showRSI && showMACD && 'MACD Active'}
          </div>
          {showRSI && (
            <div className="text-xs text-yellow-400">RSI: 30/70 levels</div>
          )}
          {showMACD && (
            <div className="text-xs text-blue-400">MACD: Line/Signal/Hist</div>
          )}
        </div>
      )}
    </div>
  );
}