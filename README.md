# 🚀 BTC Trading Analyzer

A sophisticated Bitcoin trading analysis platform built with Next.js, featuring real-time data visualization, AI-powered market analysis, and comprehensive technical indicators.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC)
![TradingView](https://img.shields.io/badge/TradingView-Charts-blue)

## ✨ Features

### 📊 Advanced Chart System
- **Professional Trading Charts** powered by TradingView Lightweight Charts
- **15 Timeframes**: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
- **Multiple Chart Types**: Candlestick and Line charts
- **Real-time Updates** via Binance WebSocket streaming

### 🤖 AI-Powered Analysis
- **Dual AI System**: Real AI (Claude) + Mock AI fallback
- **Browser Integration**: No API keys required - uses `window.claude.complete()`
- **Clear Source Indication**: Shows whether using "Real AI" or "Mock AI"
- **Manual Analysis Triggers**: Click-to-analyze instead of automatic
- **Multi-timeframe Support**: Analyze any timeframe independently

### 📈 Technical Indicators
- **Core Indicators**: RSI, MACD, SMA (20/50), EMA (12/26)
- **Bollinger Bands**: Upper, Middle, and Lower bands
- **Support/Resistance**: Calculated from latest 20 candles
- **Volume Analysis**: Advanced volume profile with Point of Control

### 🎯 Price Line Visualization
- **Support Line**: Green solid line showing support levels
- **Resistance Line**: Red solid line showing resistance levels
- **Entry Price**: Blue solid line for AI-recommended entry points
- **Stop Loss**: Red dashed line for risk management
- **Take Profit**: Green dashed line for profit targets

### 📊 Volume Profile
- **Horizontal Volume Bars**: Shows volume distribution across price levels
- **Point of Control (POC)**: Price level with highest volume (gold highlight)
- **Value Area**: 70% of total volume area (dashed lines)
- **Toggle Control**: Easy on/off switch for volume profile visibility

### ⚡ Real-time Features
- **WebSocket Integration**: Binance WebSocket for live data streaming
- **Auto-reconnection**: Automatic reconnection with fallback URLs
- **Connection Status**: Real-time connection status indicator
- **Live Price Updates**: Current price and change percentage

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Charts**: TradingView Lightweight Charts
- **Data Source**: Binance Public API & WebSocket
- **AI Integration**: Browser-based Claude AI
- **Real-time**: WebSocket connections with auto-reconnection
- **Styling**: TailwindCSS with custom components

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/btc-trading-analyzer.git
   cd btc-trading-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 📖 Usage Guide

### Basic Usage

1. **Select Timeframe**: Choose from 15 available timeframes using the dropdown
2. **Chart Type**: Switch between Candlestick and Line charts
3. **AI Analysis**: Click "Test Analysis" to get AI-powered market insights
4. **Volume Profile**: Toggle volume profile visualization on/off
5. **Real-time Data**: Watch live price updates via WebSocket connection

### AI Analysis

The platform supports two types of AI analysis:

- **Real AI**: Uses Claude AI via browser integration (when available)
- **Mock AI**: Fallback system using technical indicators

Results include:
- Trading signals (BUY/SELL/HOLD)
- Entry/exit price recommendations
- Stop loss and take profit levels
- Confidence levels and reasoning

### Technical Features

- **Support/Resistance Detection**: Automatically calculated levels
- **Multiple Timeframe Analysis**: Analyze different timeframes independently
- **Real-time Price Lines**: Dynamic visualization of trading levels
- **Volume Analysis**: Professional volume profile with POC

## 🔧 Configuration

### Environment Variables

No environment variables or API keys required! The application uses:
- Binance public API endpoints
- Browser-based Claude AI integration
- WebSocket connections without authentication

### WebSocket Configuration

The application automatically handles WebSocket connections with:
- Primary URL: `wss://stream.binance.com:9443`
- Multiple fallback URLs for reliability
- Automatic reconnection with exponential backoff
- Heartbeat mechanism for connection health

## 📁 Project Structure

```
├── components/           # React components
│   ├── TradingChart.tsx         # Main chart component
│   ├── AIAnalysisPanel.tsx     # AI analysis display
│   ├── TimeframeSelector.tsx   # Timeframe dropdown
│   ├── ChartTypeSelector.tsx   # Chart type toggle
│   ├── VolumeProfileToggle.tsx # Volume profile control
│   └── RealTimePriceIndicator.tsx # Price display
├── lib/                 # Core libraries
│   ├── binance.ts              # Binance API integration
│   ├── websocket.ts            # WebSocket management
│   ├── claude-ai.ts            # AI analysis integration
│   ├── technical-analysis.ts   # Technical indicators
│   ├── ai-analyzer.ts          # Market analysis
│   └── volume-profile-plugin.ts # Volume profile calculation
├── hooks/               # React hooks
│   └── useMarketData.ts        # Data fetching and management
└── app/                 # Next.js app directory
    ├── page.tsx                # Main page
    └── api/                    # API routes
```

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check internet connection
   - The app automatically tries fallback URLs
   - Connection status is shown in the UI

2. **Chart Not Loading**
   - Refresh the page
   - Check browser console for errors
   - Ensure JavaScript is enabled

3. **AI Analysis Not Working**
   - Real AI requires Claude browser integration
   - Falls back to Mock AI automatically
   - Check if Claude is available in your browser

### Development Issues

1. **Build Errors**
   ```bash
   npm run lint
   npm run build
   ```

2. **TypeScript Errors**
   - Check type definitions
   - Ensure all imports are correct
   - Run `npm run build` for full type checking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [TradingView](https://www.tradingview.com/) for the excellent Lightweight Charts library
- [Binance](https://www.binance.com/) for providing free public API access
- [Anthropic](https://www.anthropic.com/) for Claude AI integration
- [Next.js](https://nextjs.org/) team for the amazing framework

## 📧 Contact

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

---

**⚠️ Disclaimer**: This application is for educational and analysis purposes only. It does not provide financial advice and should not be used for actual trading decisions. Always do your own research and consult with financial professionals before making investment decisions.

**Status**: Production Ready ✅  
**Version**: 1.0.0  
**Last Updated**: December 2024