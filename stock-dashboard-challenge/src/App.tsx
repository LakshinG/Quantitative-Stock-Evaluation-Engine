import { useState, useEffect } from 'react';
import { StockTable } from './components/StockTable';
import { StockChart } from './components/StockChart';
import { mockStocks } from './data/mockData';
import type { Stock } from './data/mockData';
import { Activity, AlertCircle, RefreshCw } from 'lucide-react';

function App() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate API fetch on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    setError(null);

    // Simulate network delay
    setTimeout(() => {
      try {
        // Simulate a 10% chance of API failure for error state demonstration
        if (Math.random() < 0.1) {
          throw new Error('Failed to connect to the stock API. Please try again.');
        }

        setStocks(mockStocks);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLoading(false);
      }
    }, 1500); // 1.5s simulated loading
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Stock Dashboard</h1>
              <p className="text-sm text-gray-500">Real-time market insights</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </header>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <button
                      onClick={fetchData}
                      type="button"
                      className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600 transition-colors"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State Overlay / Skeleton */}
        {loading && !stocks.length && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
            <div className="lg:col-span-1 bg-white h-[600px] rounded-xl border border-gray-200"></div>
            <div className="lg:col-span-2 bg-white h-[600px] rounded-xl border border-gray-200"></div>
          </div>
        )}

        {/* Main Content Area */}
        {!error && stocks.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <StockTable
                  stocks={stocks}
                  onSelectStock={setSelectedStock}
                  selectedStock={selectedStock}
                />
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="sticky top-6">
                <StockChart stock={selectedStock} />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
