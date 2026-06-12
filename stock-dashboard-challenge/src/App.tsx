import { useState, useEffect } from 'react';
import { StockTable } from './components/StockTable';
import { StockChart } from './components/StockChart';
import { mockStocks } from './data/mockData';
import type { Stock } from './data/mockData';
import { Activity, AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';

const SYMBOLS = ['AAPL', 'MSFT', 'TSLA', 'GOOG', 'AMZN', 'META'];
const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

function App() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setUsingFallback(false);

    if (!FINNHUB_API_KEY) {
      console.warn("No Finnhub API key found. Using mock data.");
      setStocks(mockStocks);
      setUsingFallback(true);
      setLoading(false);
      return;
    }

    try {
      const liveDataPromises = SYMBOLS.map(async (symbol) => {
        const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);

        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        // Find the base mock stock to keep the history chart working
        // since the free /quote endpoint only gives current price
        const baseStock = mockStocks.find(s => s.symbol === symbol)!;

        return {
          ...baseStock,
          price: Number(data.c.toFixed(2)),
          change: Number(data.d.toFixed(2)),
          changePercent: Number(data.dp.toFixed(2)),
        };
      });

      const liveStocks = await Promise.all(liveDataPromises);
      setStocks(liveStocks);
      setLoading(false);

    } catch (err) {
      console.error("Fetch failed:", err);
      // Fallback to mock data
      setStocks(mockStocks);
      setUsingFallback(true);
      setLoading(false);
    }
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

        {/* Fallback Warning State */}
        {usingFallback && !loading && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-xl shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">API Rate Limit Reached - Displaying Cached Data</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>We are temporarily displaying simulated data due to API limits. Please try refreshing again later.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !usingFallback && (
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
