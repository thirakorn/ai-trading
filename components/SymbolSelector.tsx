"use client";

export interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  displayName: string;
}

// Popular trading pairs on Binance
export const POPULAR_TRADING_PAIRS: TradingPair[] = [
  {
    symbol: "BTCUSDT",
    baseAsset: "BTC",
    quoteAsset: "USDT",
    displayName: "Bitcoin",
  },
  {
    symbol: "ETHUSDT",
    baseAsset: "ETH",
    quoteAsset: "USDT",
    displayName: "Ethereum",
  },
  {
    symbol: "BNBUSDT",
    baseAsset: "BNB",
    quoteAsset: "USDT",
    displayName: "BNB",
  },
  {
    symbol: "ADAUSDT",
    baseAsset: "ADA",
    quoteAsset: "USDT",
    displayName: "Cardano",
  },
  {
    symbol: "SOLUSDT",
    baseAsset: "SOL",
    quoteAsset: "USDT",
    displayName: "Solana",
  },
  {
    symbol: "DOGEUSDT",
    baseAsset: "DOGE",
    quoteAsset: "USDT",
    displayName: "Dogecoin",
  },
  {
    symbol: "MATICUSDT",
    baseAsset: "MATIC",
    quoteAsset: "USDT",
    displayName: "Polygon",
  },
  {
    symbol: "AVAXUSDT",
    baseAsset: "AVAX",
    quoteAsset: "USDT",
    displayName: "Avalanche",
  },
  {
    symbol: "DOTUSDT",
    baseAsset: "DOT",
    quoteAsset: "USDT",
    displayName: "Polkadot",
  },
  {
    symbol: "LTCUSDT",
    baseAsset: "LTC",
    quoteAsset: "USDT",
    displayName: "Litecoin",
  },
  {
    symbol: "LINKUSDT",
    baseAsset: "LINK",
    quoteAsset: "USDT",
    displayName: "Chainlink",
  },
  {
    symbol: "UNIUSDT",
    baseAsset: "UNI",
    quoteAsset: "USDT",
    displayName: "Uniswap",
  },
  {
    symbol: "XRPUSDT",
    baseAsset: "XRP",
    quoteAsset: "USDT",
    displayName: "XRP",
  },
];

interface SymbolSelectorProps {
  currentSymbol: string;
  onSymbolChange: (symbol: string) => void;
  disabled?: boolean;
}

export default function SymbolSelector({
  currentSymbol,
  onSymbolChange,
  disabled = false,
}: SymbolSelectorProps) {
  return (
    <div className="flex items-center space-x-1 sm:space-x-2">
      <span className="text-xs sm:text-sm text-gray-400 font-medium hidden sm:inline">
        Symbol:
      </span>
      <div className="relative">
        <select
          value={currentSymbol}
          onChange={(e) => onSymbolChange(e.target.value)}
          disabled={disabled}
          className={`
            bg-gray-800 text-white border border-gray-600 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            hover:bg-gray-700 transition-colors duration-200
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {POPULAR_TRADING_PAIRS.map((pair) => (
            <option
              key={pair.symbol}
              value={pair.symbol}
              className="bg-gray-800 text-white"
            >
              {pair.baseAsset}/{pair.quoteAsset}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
