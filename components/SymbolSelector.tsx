'use client';

import { useState } from 'react';

export interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  displayName: string;
  icon: string;
  color: string;
}

// Popular trading pairs on Binance
export const POPULAR_TRADING_PAIRS: TradingPair[] = [
  {
    symbol: 'BTCUSDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    displayName: 'Bitcoin',
    icon: '₿',
    color: 'text-orange-400'
  },
  {
    symbol: 'ETHUSDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    displayName: 'Ethereum',
    icon: 'Ξ',
    color: 'text-blue-400'
  },
  {
    symbol: 'BNBUSDT',
    baseAsset: 'BNB',
    quoteAsset: 'USDT',
    displayName: 'BNB',
    icon: '🟡',
    color: 'text-yellow-400'
  },
  {
    symbol: 'ADAUSDT',
    baseAsset: 'ADA',
    quoteAsset: 'USDT',
    displayName: 'Cardano',
    icon: '🔵',
    color: 'text-blue-500'
  },
  {
    symbol: 'SOLUSDT',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    displayName: 'Solana',
    icon: '🟣',
    color: 'text-purple-400'
  },
  {
    symbol: 'DOGEUSDT',
    baseAsset: 'DOGE',
    quoteAsset: 'USDT',
    displayName: 'Dogecoin',
    icon: '🐕',
    color: 'text-yellow-500'
  },
  {
    symbol: 'MATICUSDT',
    baseAsset: 'MATIC',
    quoteAsset: 'USDT',
    displayName: 'Polygon',
    icon: '🔷',
    color: 'text-purple-500'
  },
  {
    symbol: 'AVAXUSDT',
    baseAsset: 'AVAX',
    quoteAsset: 'USDT',
    displayName: 'Avalanche',
    icon: '🔺',
    color: 'text-red-400'
  },
  {
    symbol: 'DOTUSDT',
    baseAsset: 'DOT',
    quoteAsset: 'USDT',
    displayName: 'Polkadot',
    icon: '⚫',
    color: 'text-pink-400'
  },
  {
    symbol: 'LTCUSDT',
    baseAsset: 'LTC',
    quoteAsset: 'USDT',
    displayName: 'Litecoin',
    icon: 'Ł',
    color: 'text-gray-400'
  },
  {
    symbol: 'LINKUSDT',
    baseAsset: 'LINK',
    quoteAsset: 'USDT',
    displayName: 'Chainlink',
    icon: '🔗',
    color: 'text-blue-600'
  },
  {
    symbol: 'UNIUSDT',
    baseAsset: 'UNI',
    quoteAsset: 'USDT',
    displayName: 'Uniswap',
    icon: '🦄',
    color: 'text-pink-500'
  }
];

interface SymbolSelectorProps {
  currentSymbol: string;
  onSymbolChange: (symbol: string) => void;
  disabled?: boolean;
}

export default function SymbolSelector({ currentSymbol, onSymbolChange, disabled = false }: SymbolSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentPair = POPULAR_TRADING_PAIRS.find(pair => pair.symbol === currentSymbol) || POPULAR_TRADING_PAIRS[0];

  const handleSymbolSelect = (symbol: string) => {
    onSymbolChange(symbol);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Trading Pair:
      </label>
      
      {/* Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full min-w-[200px] bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-3 text-left
          flex items-center justify-between
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          hover:bg-gray-600 transition-colors duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center space-x-3">
          <span className={`text-lg ${currentPair.color}`}>
            {currentPair.icon}
          </span>
          <div>
            <div className="font-medium">
              {currentPair.baseAsset}/{currentPair.quoteAsset}
            </div>
            <div className="text-xs text-gray-400">
              {currentPair.displayName}
            </div>
          </div>
        </div>
        <div className="text-gray-400">
          {isOpen ? '▲' : '▼'}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-400 uppercase tracking-wide px-2 py-1 mb-2">
              Popular Trading Pairs
            </div>
            
            {POPULAR_TRADING_PAIRS.map((pair) => (
              <button
                key={pair.symbol}
                onClick={() => handleSymbolSelect(pair.symbol)}
                className={`
                  w-full text-left px-3 py-2 rounded-md transition-colors duration-150
                  flex items-center space-x-3
                  ${pair.symbol === currentSymbol 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-600 text-gray-300'
                  }
                `}
              >
                <span className={`text-lg ${pair.color}`}>
                  {pair.icon}
                </span>
                <div className="flex-1">
                  <div className="font-medium">
                    {pair.baseAsset}/{pair.quoteAsset}
                  </div>
                  <div className="text-xs text-gray-400">
                    {pair.displayName}
                  </div>
                </div>
                {pair.symbol === currentSymbol && (
                  <div className="text-blue-300">✓</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}