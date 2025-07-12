import { ProcessedCandle } from './binance';

export const generateMockData = (): ProcessedCandle[] => {
  const data: ProcessedCandle[] = [];
  const now = Math.floor(Date.now() / 1000);
  let price = 45000; // Starting price

  console.log('Generating mock data...');

  for (let i = 99; i >= 0; i--) {
    const time = now - (i * 300); // 5-minute intervals
    
    // Generate realistic price movement
    const changePercent = (Math.random() - 0.5) * 0.02; // ±1% change
    const newPrice = price * (1 + changePercent);
    
    const open = price;
    const close = newPrice;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.random() * 100 + 50;

    data.push({
      time,
      open,
      high,
      low,
      close,
      volume
    });

    price = newPrice;
  }

  console.log('Mock data generated:', data.length, 'candles');
  console.log('Sample candle:', data[0]);
  return data;
};