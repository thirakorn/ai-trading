'use client';

interface RealTimePriceIndicatorProps {
  currentPrice: number | null;
  priceChange: number;
  isConnected: boolean;
  symbol?: string;
}

export default function RealTimePriceIndicator({ 
  currentPrice, 
  priceChange, 
  isConnected, 
  symbol = 'BTCUSDT' 
}: RealTimePriceIndicatorProps) {
  const getPriceChangeColor = () => {
    if (priceChange > 0) return 'text-green-400';
    if (priceChange < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getPriceChangeIcon = () => {
    if (priceChange > 0) return '▲';
    if (priceChange < 0) return '▼';
    return '●';
  };

  const getConnectionStatus = () => {
    if (isConnected) {
      return (
        <div className="flex items-center space-x-1 text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium">LIVE</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-1 text-red-400">
          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
          <span className="text-xs font-medium">OFFLINE</span>
        </div>
      );
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-white">{symbol}</h3>
            {getConnectionStatus()}
          </div>
          
          <div className="flex items-center space-x-3 mt-2">
            {currentPrice ? (
              <>
                <span className="text-2xl font-mono font-bold text-white">
                  ${currentPrice.toFixed(2)}
                </span>
                <div className={`flex items-center space-x-1 ${getPriceChangeColor()}`}>
                  <span className="text-sm">{getPriceChangeIcon()}</span>
                  <span className="text-sm font-medium">
                    ${Math.abs(priceChange).toFixed(2)}
                  </span>
                  <span className="text-xs">
                    ({priceChange > 0 ? '+' : ''}{((priceChange / (currentPrice - priceChange)) * 100).toFixed(2)}%)
                  </span>
                </div>
              </>
            ) : (
              <span className="text-xl text-gray-400">Loading...</span>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-400 mb-1">24h Change</div>
          <div className={`text-lg font-bold ${getPriceChangeColor()}`}>
            {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}