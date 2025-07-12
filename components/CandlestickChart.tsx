'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ProcessedCandle } from '@/lib/binance';

interface CandlestickChartProps {
  data: ProcessedCandle[];
  width?: number;
  height?: number;
}

export default function CandlestickChart({ data, height = 400 }: CandlestickChartProps) {
  console.log('Chart data received:', data.length, 'candles');
  
  const chartData = data.map(candle => ({
    time: new Date(candle.time * 1000).toLocaleTimeString(),
    price: candle.close,
    high: candle.high,
    low: candle.low,
    open: candle.open,
  }));

  if (data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height: `${height}px` }}>
        <p className="text-gray-400">No data available for chart</p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="time" 
            stroke="#9CA3AF"
            fontSize={12}
          />
          <YAxis 
            stroke="#9CA3AF"
            fontSize={12}
            domain={['dataMin - 100', 'dataMax + 100']}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              color: '#ffffff'
            }}
            formatter={(value: number, name: string) => [
              `$${Number(value).toFixed(2)}`, 
              name.charAt(0).toUpperCase() + name.slice(1)
            ]}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#3B82F6" 
            strokeWidth={2}
            dot={false}
            name="Close Price"
          />
          <Line 
            type="monotone" 
            dataKey="high" 
            stroke="#10B981" 
            strokeWidth={1}
            dot={false}
            name="High"
            strokeDasharray="5 5"
          />
          <Line 
            type="monotone" 
            dataKey="low" 
            stroke="#EF4444" 
            strokeWidth={1}
            dot={false}
            name="Low"
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}