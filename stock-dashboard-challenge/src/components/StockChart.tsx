import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { Stock } from '../data/mockData';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StockChartProps {
  stock: Stock | null;
}

export const StockChart: React.FC<StockChartProps> = ({ stock }) => {
  if (!stock) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full min-h-[400px] flex items-center justify-center p-8 text-center">
        <div>
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Select a Stock</h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            Click on a stock in the table to view its 30-day historical performance chart.
          </p>
        </div>
      </div>
    );
  }

  const isPositive = stock.change >= 0;
  const strokeColor = isPositive ? '#16a34a' : '#dc2626'; // Tailwind green-600 or red-600

  // Format dates for the X-axis
  const chartData = stock.history.map(item => {
    const date = new Date(item.date);
    return {
      ...item,
      displayDate: `${date.getMonth() + 1}/${date.getDate()}`
    };
  });

  const minPrice = Math.min(...stock.history.map(d => d.price));
  const maxPrice = Math.max(...stock.history.map(d => d.price));
  const domainPadding = (maxPrice - minPrice) * 0.1;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {stock.symbol}
            <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
              {stock.name}
            </span>
          </h2>
          <div className="flex items-end gap-3 mt-2">
            <span className="text-3xl font-bold tracking-tight text-gray-900">
              ${stock.price.toFixed(2)}
            </span>
            <div className={`flex items-center text-sm font-semibold mb-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">30-Day Range</div>
          <div className="text-sm font-medium text-gray-900 mt-1">
            ${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full h-[400px] min-h-[400px]">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="displayDate"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              minTickGap={20}
            />
            <YAxis
              domain={[minPrice - domainPadding, maxPrice + domainPadding]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              width={60}
            />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
              formatter={(value: any) => [`$${value.toFixed(2)}`, 'Price']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <ReferenceLine y={stock.history[0].price} stroke="#9ca3af" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="price"
              stroke={strokeColor}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, fill: strokeColor, stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
