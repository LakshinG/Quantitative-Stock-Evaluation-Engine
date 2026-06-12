import React, { useState } from 'react';
import type { Stock } from '../data/mockData';
import { ArrowDownRight, ArrowUpRight, Search, ArrowUpDown } from 'lucide-react';

interface StockTableProps {
  stocks: Stock[];
  onSelectStock: (stock: Stock) => void;
  selectedStock: Stock | null;
}

type SortField = 'symbol' | 'price' | 'changePercent';
type SortDirection = 'asc' | 'desc';

export const StockTable: React.FC<StockTableProps> = ({ stocks, onSelectStock, selectedStock }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedStocks = [...stocks]
    .filter(
      (stock) =>
        stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'symbol') {
        comparison = a.symbol.localeCompare(b.symbol);
      } else if (sortField === 'price') {
        comparison = a.price - b.price;
      } else if (sortField === 'changePercent') {
        comparison = a.changePercent - b.changePercent;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50/50">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
            placeholder="Search by symbol or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('symbol')}
              >
                <div className="flex items-center space-x-1">
                  <span>Symbol</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Price</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('changePercent')}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Change</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedStocks.length > 0 ? (
              filteredAndSortedStocks.map((stock) => {
                const isPositive = stock.change >= 0;
                const isSelected = selectedStock?.symbol === stock.symbol;

                return (
                  <tr
                    key={stock.symbol}
                    className={`hover:bg-blue-50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50 ring-1 ring-inset ring-blue-500' : ''}`}
                    onClick={() => onSelectStock(stock)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-0">
                          <div className="text-sm font-semibold text-gray-900">
                            {stock.symbol}
                          </div>
                          <div className="text-xs text-gray-500">{stock.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">
                        ${stock.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div
                        className={`inline-flex items-center text-sm font-medium ${
                          isPositive ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 mr-1" />
                        )}
                        {Math.abs(stock.changePercent).toFixed(2)}%
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {isPositive ? '+' : '-'}${Math.abs(stock.change).toFixed(2)}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                  No stocks found matching "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
