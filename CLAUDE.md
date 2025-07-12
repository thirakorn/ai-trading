# BTC Trading Analyzer - Project Context Summary

## Project Overview
BTCUSD Trading Analyzer เป็น Next.js web application ที่ใช้วิเคราะห์การเทรด Bitcoin โดยใช้ข้อมูลจาก Binance API และ AI analysis สำหรับหาจุด entry/exit points (สำหรับการศึกษาเท่านั้น ไม่ทำการเทรดจริง)

## Technical Stack
- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Charts**: TradingView Lightweight Charts
- **Data Source**: Binance Public API & WebSocket
- **AI Integration**: Browser-based Claude AI (window.claude.complete)
- **Real-time**: WebSocket connections with auto-reconnection

## Key Features

### 1. Advanced Chart System
- **TradingView Lightweight Charts** integration
- **15 Timeframes**: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
- **Default Timeframe**: 1D
- **Chart Types**: Candlestick และ Line charts
- **Real-time Updates**: WebSocket streaming data

### 2. AI Analysis System
- **Dual AI Support**: Real AI (Claude) + Mock AI fallback
- **Browser Integration**: ใช้ window.claude.complete() ไม่ต้อง API keys
- **Clear Source Indication**: แสดงชัดเจนว่าใช้ "Real AI" หรือ "Mock AI"
- **Manual Triggers**: กดปุ่มเพื่อ analyze แทนการทำงานอัตโนมัติ
- **Multiple Timeframe Analysis**: สามารถ analyze timeframe อื่นได้

### 3. Technical Indicators
- **Basic Indicators**: RSI, MACD, SMA (20/50), EMA (12/26)
- **Bollinger Bands**: Upper/Middle/Lower bands
- **Support/Resistance**: คำนวณจาก 20 candles ล่าสุด
- **Volume Analysis**: Volume profile with Point of Control

### 4. Price Line Visualization
- **Support Line**: เส้นเขียวทึบ แสดงระดับ support
- **Resistance Line**: เส้นแดงทึบ แสดงระดับ resistance  
- **Entry Price**: เส้นน้ำเงินทึบ แสดงจุด entry ที่ AI แนะนำ
- **Stop Loss**: เส้นแดงประ แสดงจุดตัดขาดทุน
- **Take Profit**: เส้นเขียวประ แสดงจุดเก็บกำไร

### 5. Volume Profile
- **Horizontal Volume Bars**: แสดง volume distribution ตามระดับราคา
- **Point of Control (POC)**: ระดับราคาที่มี volume สูงสุด (สีทอง)
- **Value Area**: พื้นที่ 70% ของ total volume (เส้นประ)
- **Toggle Control**: เปิด/ปิดได้ด้วยปุ่ม toggle

### 6. Real-time Features
- **WebSocket Integration**: Binance WebSocket สำหรับ real-time data
- **Auto-reconnection**: ระบบ reconnect อัตโนมัติพร้อม fallback URLs
- **Connection Status**: แสดงสถานะการเชื่อมต่อ real-time
- **Price Updates**: แสดงราคาปัจจุบันและการเปลี่ยนแปลง

## File Structure

### Components
- `TradingChart.tsx` - หลักของ chart พร้อม TradingView integration
- `AIAnalysisPanel.tsx` - แสดงผล AI analysis และ controls
- `TimeframeSelector.tsx` - Dropdown เลือก timeframe (15 ตัวเลือก)
- `ChartTypeSelector.tsx` - เลือกประเภท chart (candlestick/line)
- `VolumeProfileToggle.tsx` - Toggle เปิด/ปิด volume profile
- `RealTimePriceIndicator.tsx` - แสดงราคาปัจจุบัน

### Libraries
- `binance.ts` - Binance API integration และ data processing
- `websocket.ts` - WebSocket management พร้อม error handling
- `claude-ai.ts` - AI analysis integration (Real + Mock)
- `technical-analysis.ts` - คำนวณ technical indicators
- `ai-analyzer.ts` - Market analysis และ support/resistance detection
- `volume-profile-plugin.ts` - Volume profile calculation และ rendering

### Hooks
- `useMarketData.ts` - จัดการ data fetching, WebSocket, และ analysis

## AI Analysis Details

### Real AI Integration
- ใช้ `window.claude.complete()` สำหรับ browser-based AI
- ส่ง prompt ที่มีข้อมูล market data และ technical indicators
- รับผลลัพธ์เป็น JSON format พร้อม trading signals

### Mock AI Fallback
- ระบบ AI จำลองที่ใช้ technical indicators
- คำนวณ signals จาก RSI levels (oversold/overbought)
- ใช้เมื่อ Real AI ไม่พร้อมใช้งาน

### Trading Signals
- **Signal Types**: BUY, SELL, HOLD
- **Entry/TP/SL**: คำนวณจากราคาปัจจุบัน (±2%, ±4%)
- **Confidence Levels**: แสดงระดับความมั่นใจของ AI
- **Reasoning**: อธิบายเหตุผลของการ analysis

## WebSocket Implementation

### Connection Management
- **Primary URL**: `wss://stream.binance.com:9443`
- **Fallback URLs**: Multiple backup endpoints
- **Stream Format**: `btcusdt@kline_1d` (ตาม timeframe)
- **Auto-reconnection**: Exponential backoff พร้อม jitter

### Error Handling
- **Timeout Handling**: 10 วินาที connection timeout
- **Ping/Pong**: Heartbeat ทุก 30 วินาที (ตาม Binance requirements)
- **Error Logging**: Detailed error messages และ close codes
- **Graceful Degradation**: Fallback เมื่อ WebSocket fail

## Recent Bug Fixes

### WebSocket Connection Issues
- แก้ไข URL format ให้ตรงกับ Binance documentation
- เปลี่ยนจาก `/ws/streamName` เป็น `/ws/streamName` 
- เพิ่ม fallback URLs และ exponential backoff

### Duplicate Timestamp Validation
- เพิ่ม duplicate filtering ใน data processing
- แก้ไข "data must be asc ordered by time" errors
- ปรับปรุง time validation ใน chart component

### Chart Data Ordering
- เพิ่ม data sorting ก่อน setData()
- แก้ไข "Cannot update oldest data" errors
- ปรับปรุง real-time update logic

## Development Commands

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Linting
npm run lint
```

## Development Notes
- you don't need to "npm run dev" I will do myself

## Environment Setup
- ไม่ต้องใช้ API keys (ใช้ Binance public API)
- ใช้ browser-based Claude AI integration
- รองรับ development และ production environments

## Future Enhancements
- เพิ่ม technical indicators เพิ่มเติม
- ปรับปรุง Volume Profile visualization
- เพิ่ม historical data analysis
- Backtesting capabilities
- Multi-timeframe analysis

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready