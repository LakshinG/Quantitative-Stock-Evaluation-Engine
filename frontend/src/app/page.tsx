"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { 
  Activity, TrendingUp, TrendingDown, Search, BarChart3, 
  LayoutDashboard, LineChart as LineChartIcon, PieChart as PieChartIcon, 
  Settings, Bell, Globe, Info, Briefcase
} from "lucide-react";
import { createChart, IChartApi, ColorType } from "lightweight-charts";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Treemap,
  PieChart,
  Pie,
  Cell
} from "recharts";

const API_URL = "http://localhost:8000/api";

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

function CandlestickChart({ data }: { data: any[] }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#6b7280',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });
    chartRef.current = chart;

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    const formattedData = data.map(item => ({
      time: item.Date.split(' ')[0],
      open: item.Open,
      high: item.High,
      low: item.Low,
      close: item.Close,
    }));

    candlestickSeries.setData(formattedData);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
}

// Custom Treemap Content
const TreemapContent = (props: any) => {
  const { root, depth, x, y, width, height, index, name, performance } = props;

  if (depth === 1) {
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: '#0f1115',
            stroke: '#1f2937',
            strokeWidth: 2,
          }}
        />
        <text x={x + 4} y={y + 14} fill="#6b7280" fontSize={10} fontWeight="bold" className="uppercase tracking-widest">
          {name}
        </text>
      </g>
    );
  }

  if (depth === 2) {
    const isPos = performance >= 0;
    const absPerf = Math.abs(performance);
    
    let fill = '#1f2937';
    if (isPos) {
       if (absPerf > 2) fill = '#166534';
       else if (absPerf > 1) fill = '#22c55e';
       else fill = '#4ade80';
    } else {
       if (absPerf > 2) fill = '#991b1b';
       else if (absPerf > 1) fill = '#ef4444';
       else fill = '#f87171';
    }

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill,
            stroke: '#09090b',
            strokeWidth: 1,
          }}
        />
        {width > 40 && height > 30 && (
           <text x={x + width / 2} y={y + height / 2 - 4} textAnchor="middle" fill="#fff" fontSize={12} fontWeight="bold">
             {name}
           </text>
        )}
        {width > 40 && height > 30 && (
           <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="#fff" fontSize={10}>
             {isPos ? '+' : ''}{performance}%
           </text>
        )}
      </g>
    );
  }
  return null;
};

// Hexagon Score Component
const HexagonScore = ({ score }: { score: number }) => {
  const isHigh = score >= 7;
  const isMid = score >= 4 && score < 7;
  const color = isHigh ? "#22c55e" : isMid ? "#eab308" : "#ef4444";
  
  return (
    <div className="relative w-8 h-8 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ stroke: color }}>
        <polygon points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25" fill="transparent" strokeWidth="6" />
      </svg>
      <span className="relative text-xs font-bold" style={{ color }}>{score}</span>
    </div>
  );
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [selectedTicker, setSelectedTicker] = useState("AAPL");
  const [search, setSearch] = useState("");
  
  // Dashboard State
  const [stockData, setStockData] = useState<any>(null);
  const [sentiment, setSentiment] = useState<any>(null);
  const [backtest, setBacktest] = useState<any>(null);
  const [fundamentals, setFundamentals] = useState<any>(null);
  
  // Markets/Sectors State
  const [marketMovers, setMarketMovers] = useState<any>(null);
  const [moversTab, setMoversTab] = useState("gainers");
  const [sectors, setSectors] = useState<any>(null);
  const [generalNews, setGeneralNews] = useState<any>(null);

  // Portfolio State
  const [portfolioInput, setPortfolioInput] = useState("AAPL, MSFT, NVDA, GOOGL, AMZN");
  const [portfolioResults, setPortfolioResults] = useState<any>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioError, setPortfolioError] = useState("");
  
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = (ticker: string) => {
    setLoading(true);
    Promise.all([
      axios.get(`${API_URL}/stock/${ticker}?period=1y`),
      axios.get(`${API_URL}/sentiment/${ticker}`),
      axios.get(`${API_URL}/backtest?ticker=${ticker}&period=2y`),
      axios.get(`${API_URL}/fundamentals/${ticker}`)
    ]).then(([stockRes, sentimentRes, backtestRes, fundRes]) => {
      setStockData(stockRes.data.data);
      setSentiment(sentimentRes.data);
      setBacktest(backtestRes.data);
      setFundamentals(fundRes.data);
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  };

  const fetchTabData = (tab: string) => {
    if (tab === "Markets" && !marketMovers) {
      setLoading(true);
      axios.get(`${API_URL}/market-movers`).then(res => setMarketMovers(res.data)).finally(() => setLoading(false));
    } else if (tab === "Sectors" && !sectors) {
      setLoading(true);
      axios.get(`${API_URL}/sectors`).then(res => setSectors(res.data.sectors)).finally(() => setLoading(false));
    } else if (tab === "News" && !generalNews) {
      setLoading(true);
      axios.get(`${API_URL}/news`).then(res => setGeneralNews(res.data.news)).finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    if (activeTab === "Dashboard") {
      fetchDashboardData(selectedTicker);
    } else {
      fetchTabData(activeTab);
    }
  }, [activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search) {
      setSelectedTicker(search.toUpperCase());
      setActiveTab("Dashboard");
      fetchDashboardData(search.toUpperCase());
    }
  };

  const handleOptimizePortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    setPortfolioLoading(true);
    setPortfolioError("");
    axios.get(`${API_URL}/portfolio/optimize?tickers=${encodeURIComponent(portfolioInput)}`)
      .then(res => {
        setPortfolioResults(res.data);
      })
      .catch(err => {
        setPortfolioError(err.response?.data?.detail || "Optimization failed. Check tickers.");
      })
      .finally(() => {
        setPortfolioLoading(false);
      });
  };

  const latestPrice = stockData && stockData.length > 0 ? stockData[stockData.length - 1].Close : 0;
  const prevPrice = stockData && stockData.length > 1 ? stockData[stockData.length - 2].Close : 0;
  const priceChange = latestPrice - prevPrice;
  const priceChangePct = prevPrice ? (priceChange / prevPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-300 font-sans flex overflow-hidden selection:bg-blue-500/30">
      
      {/* Sidebar */}
      <aside className="w-16 lg:w-64 border-r border-white/5 bg-[#09090b] flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/5">
            <BarChart3 className="text-blue-500" size={24} />
            <span className="ml-3 font-bold text-white hidden lg:block tracking-wide">EVAL ENGINE</span>
          </div>
          <nav className="p-4 space-y-2">
            {[
              { name: "Dashboard", icon: LayoutDashboard },
              { name: "Portfolio", icon: Briefcase },
              { name: "Markets", icon: LineChartIcon },
              { name: "Sectors", icon: PieChartIcon },
              { name: "News", icon: Globe }
            ].map(item => (
              <button 
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  activeTab === item.name 
                  ? 'bg-blue-500/10 text-blue-400 font-medium' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <item.icon size={18} />
                <span className="hidden lg:block text-sm">{item.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-white/5 bg-[#09090b] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <form onSubmit={handleSearch} className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Ticker & Press Enter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#121217] border border-white/10 rounded-md py-1.5 pl-9 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase tracking-wider"
              />
            </form>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-500 hover:text-white transition-colors">
              <Bell size={18} />
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500"></div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#040405] custom-scrollbar">
          
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse flex flex-col items-center gap-4">
                <BarChart3 className="text-blue-500 animate-bounce" size={32} />
                <span className="text-gray-500 text-sm tracking-widest uppercase">Fetching Data...</span>
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-6 h-full pb-10">
              
              {/* --- DASHBOARD TAB --- */}
              {activeTab === "Dashboard" && (
                <>
                  {/* Top Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#0f1115] border border-white/5 rounded-lg p-4 flex flex-col justify-between">
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Symbol</span>
                      <div className="mt-2 flex items-end justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-white">{selectedTicker}</h2>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-mono text-gray-300">${latestPrice.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className={`flex flex-col items-end text-sm font-mono ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          <span>{isPositive ? '+' : ''}{priceChange.toFixed(2)}</span>
                          <span className="flex items-center text-xs">
                            {isPositive ? <TrendingUp size={12} className="mr-1"/> : <TrendingDown size={12} className="mr-1"/>}
                            {Math.abs(priceChangePct).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#0f1115] border border-white/5 rounded-lg p-4 flex flex-col justify-between">
                       <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">AI Market Sentiment</span>
                       <div className="mt-2 flex items-end justify-between">
                          <h2 className={`text-xl font-bold capitalize ${
                            sentiment?.sentiment === 'bullish' ? 'text-green-500' :
                            sentiment?.sentiment === 'bearish' ? 'text-red-500' : 'text-gray-400'
                          }`}>
                            {sentiment?.sentiment || 'Neutral'}
                          </h2>
                          <div className="text-right">
                             <span className="text-xs text-gray-500 block">Score</span>
                             <span className="text-lg font-mono text-white">{sentiment?.score > 0 ? '+' : ''}{sentiment?.score || '0.00'}</span>
                          </div>
                       </div>
                    </div>

                    <div className="bg-[#0f1115] border border-white/5 rounded-lg p-4 flex flex-col justify-between">
                       <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Model Accuracy</span>
                       <div className="mt-2 flex items-end justify-between">
                          <h2 className="text-2xl font-bold text-white font-mono">{backtest?.accuracy_pct || '0.0'}%</h2>
                          <Activity size={24} className="text-blue-500 opacity-50" />
                       </div>
                    </div>

                    <div className="bg-[#0f1115] border border-white/5 rounded-lg p-4 flex flex-col justify-between">
                       <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Strategy Edge</span>
                       <div className="mt-2 flex items-end justify-between">
                          <div>
                            <span className={`text-xl font-bold font-mono ${backtest?.strategy_return_pct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {backtest?.strategy_return_pct > 0 ? '+' : ''}{backtest?.strategy_return_pct || '0.0'}%
                            </span>
                            <span className="text-xs text-gray-500 block mt-1">vs {backtest?.benchmark_return_pct > 0 ? '+' : ''}{backtest?.benchmark_return_pct || '0.0'}% B&H</span>
                          </div>
                          <LineChartIcon size={24} className="text-purple-500 opacity-50" />
                       </div>
                    </div>
                  </div>

                  {/* Charts & Fundamentals */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 flex flex-col gap-6">
                      {/* Candlestick */}
                      <div className="bg-[#0f1115] border border-white/5 rounded-lg p-5 flex flex-col h-[480px]">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{selectedTicker} Price Action</h3>
                          <div className="flex gap-2">
                             <span className="text-xs px-2 py-1 bg-white/5 rounded text-gray-400 cursor-pointer hover:bg-white/10">1D</span>
                             <span className="text-xs px-2 py-1 bg-white/5 rounded text-gray-400 cursor-pointer hover:bg-white/10">1W</span>
                             <span className="text-xs px-2 py-1 bg-white/5 rounded text-gray-400 cursor-pointer hover:bg-white/10">1M</span>
                          </div>
                        </div>
                        <div className="flex-1 w-full relative">
                          {stockData && stockData.length > 0 ? (
                            <CandlestickChart data={stockData} />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">No data</div>
                          )}
                        </div>
                      </div>

                      {/* Fundamentals Panel */}
                      <div className="bg-[#0f1115] border border-white/5 rounded-lg p-5">
                        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Fundamental Analysis</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: "Market Cap", value: fundamentals?.market_cap },
                            { label: "P/E Ratio (TTM)", value: fundamentals?.pe_ratio },
                            { label: "Forward P/E", value: fundamentals?.forward_pe },
                            { label: "Div Yield", value: fundamentals?.dividend_yield },
                            { label: "52W High", value: fundamentals?.high_52w },
                            { label: "52W Low", value: fundamentals?.low_52w },
                            { label: "Avg Volume", value: fundamentals?.volume },
                            { label: "Analyst Rating", value: fundamentals?.analyst_rating, highlight: true }
                          ].map(f => (
                            <div key={f.label} className="flex flex-col p-3 bg-[#16181d] rounded-md border border-white/5">
                              <span className="text-[10px] text-gray-500 uppercase font-semibold">{f.label}</span>
                              <span className={`text-sm font-bold mt-1 ${f.highlight && f.value !== 'N/A' ? 'text-blue-400' : 'text-gray-200'}`}>
                                {f.value || '-'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-1 flex flex-col gap-6">
                      <div className="bg-[#0f1115] border border-white/5 rounded-lg p-5 flex-1 flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Live News & Sentiment</h3>
                          <button onClick={() => setActiveTab('News')} className="text-xs text-blue-400 hover:text-blue-300">View All</button>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                          {sentiment?.news?.length > 0 ? sentiment.news.map((n: any, i: number) => (
                            <div key={i} className="group relative pl-3 py-2 border-l-2 border-white/5 hover:border-blue-500 transition-colors">
                              <p className="text-xs text-gray-300 leading-tight mb-2 group-hover:text-white transition-colors">{n.headline}</p>
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                  n.label === 'positive' ? 'bg-green-500/10 text-green-500' : 
                                  n.label === 'negative' ? 'bg-red-500/10 text-red-500' : 'bg-gray-500/10 text-gray-400'
                                }`}>
                                  {n.label}
                                </span>
                                <span className="text-[10px] font-mono text-gray-600">CONF: {(n.confidence * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          )) : (
                             <div className="text-xs text-gray-600 text-center py-10">No recent news parsed.</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-[#0f1115] border border-white/5 rounded-lg p-5 h-[280px] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Strategy Backtest</h3>
                        </div>
                        <div className="flex-1 w-full">
                          {backtest && !backtest.error ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={backtest.history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis dataKey="date" stroke="#4b5563" tick={{fill: '#6b7280', fontSize: 10}} tickLine={false} axisLine={false} minTickGap={50} />
                                <YAxis stroke="#4b5563" domain={['auto', 'auto']} hide />
                                <RechartsTooltip 
                                  contentStyle={{backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: '#FFF', fontSize: '12px'}}
                                  itemStyle={{fontWeight: 'bold', fontFamily: 'monospace'}}
                                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, undefined]}
                                />
                                <Line type="stepAfter" dataKey="strategy_value" name="Model Strategy" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{r: 4, fill: '#3b82f6', stroke: '#09090b', strokeWidth: 2}} />
                                <Line type="monotone" dataKey="benchmark_value" name="Buy & Hold" stroke="#6b7280" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                              </LineChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-xs text-gray-600">Unavailable</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* --- PORTFOLIO TAB --- */}
              {activeTab === "Portfolio" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white">AI Portfolio Optimization</h2>
                  
                  <div className="bg-[#0f1115] border border-white/5 rounded-lg p-6">
                    <p className="text-sm text-gray-400 mb-4">Enter a list of tickers to compute the optimal weight allocation using Modern Portfolio Theory (Max Sharpe Ratio).</p>
                    <form onSubmit={handleOptimizePortfolio} className="flex gap-4">
                      <input 
                        type="text"
                        value={portfolioInput}
                        onChange={(e) => setPortfolioInput(e.target.value)}
                        placeholder="AAPL, MSFT, TSLA, NVDA..."
                        className="flex-1 bg-[#16181d] border border-white/10 rounded-md px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                      <button 
                        type="submit" 
                        disabled={portfolioLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-semibold transition-colors disabled:opacity-50"
                      >
                        {portfolioLoading ? 'Optimizing...' : 'Run Optimization'}
                      </button>
                    </form>
                    {portfolioError && <p className="text-red-500 text-sm mt-3">{portfolioError}</p>}
                  </div>

                  {portfolioResults && !portfolioError && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Chart */}
                      <div className="md:col-span-1 bg-[#0f1115] border border-white/5 rounded-lg p-6 flex flex-col items-center justify-center min-h-[300px]">
                        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Optimal Allocation</h3>
                        <div className="w-full h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={portfolioResults.allocations}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="weight"
                              >
                                {portfolioResults.allocations.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                contentStyle={{backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)'}}
                                itemStyle={{color: '#fff', fontWeight: 'bold'}}
                                formatter={(value: number) => [`${value}%`, undefined]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Stats & Table */}
                      <div className="md:col-span-2 flex flex-col gap-6">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-[#0f1115] border border-white/5 rounded-lg p-4">
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Expected Return (1Y)</span>
                            <h2 className="text-2xl font-bold text-green-500 mt-2">+{portfolioResults.expected_return_pct}%</h2>
                          </div>
                          <div className="bg-[#0f1115] border border-white/5 rounded-lg p-4">
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Volatility (Risk)</span>
                            <h2 className="text-2xl font-bold text-red-400 mt-2">{portfolioResults.expected_volatility_pct}%</h2>
                          </div>
                          <div className="bg-[#0f1115] border border-white/5 rounded-lg p-4">
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Sharpe Ratio</span>
                            <h2 className="text-2xl font-bold text-blue-400 mt-2">{portfolioResults.sharpe_ratio}</h2>
                          </div>
                        </div>

                        <div className="bg-[#0f1115] border border-white/5 rounded-lg overflow-hidden flex-1">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-white/5 border-b border-white/5">
                                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase">Ticker</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase text-right">Target Weight</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase text-center">Color</th>
                              </tr>
                            </thead>
                            <tbody>
                              {portfolioResults.allocations.map((a: any, i: number) => (
                                <tr key={a.ticker} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                                  <td className="px-6 py-4 font-bold text-white">{a.ticker}</td>
                                  <td className="px-6 py-4 font-mono text-right text-gray-300">{a.weight}%</td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="w-3 h-3 rounded-full mx-auto" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- MARKETS TAB --- */}
              {activeTab === "Markets" && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="bg-white rounded-lg overflow-hidden shadow text-gray-900">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                      <h2 className="text-xl font-bold text-gray-900">Stocks On The Move</h2>
                      <Info className="text-gray-400" size={20} />
                    </div>
                    
                    <div className="flex border-b border-gray-200 px-4">
                      {["Top Gainers", "Top Losers", "Most Active"].map(tab => {
                        const key = tab.split(' ')[1]?.toLowerCase() || 'actives';
                        const isActive = moversTab === key || (tab === "Most Active" && moversTab === "actives");
                        return (
                          <button
                            key={tab}
                            onClick={() => setMoversTab(tab === "Most Active" ? "actives" : tab.split(' ')[1].toLowerCase())}
                            className={`py-3 px-4 text-sm font-semibold transition-colors ${
                              isActive ? 'text-gray-900 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            {tab}
                          </button>
                        );
                      })}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="py-3 px-6 text-xs font-bold text-gray-600 w-1/3">Company</th>
                            <th className="py-3 px-6 text-xs font-bold text-gray-600 text-right">Price & Change</th>
                            <th className="py-3 px-6 text-xs font-bold text-gray-600 text-center">Smart Score</th>
                            <th className="py-3 px-6 text-xs font-bold text-gray-600 text-center">Price Chart (7D)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {marketMovers && marketMovers[moversTab]?.map((m: any) => {
                             const isPos = m.change_pct >= 0;
                             const colorClass = isPos ? 'text-green-600' : 'text-red-600';
                             const sparklineData = m.chart_data?.map((val: number, i: number) => ({ index: i, value: val })) || [];
                             return (
                              <tr key={m.symbol} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="py-4 px-6 cursor-pointer" onClick={() => { setSearch(m.symbol); handleSearch({preventDefault: ()=>{}} as any); }}>
                                  <span className="block text-blue-600 font-semibold">{m.symbol}</span>
                                  <span className="block text-xs text-gray-500 mt-0.5">{m.name || m.symbol}</span>
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <span className="block text-gray-900 font-semibold">{m.price.toFixed(2)}</span>
                                  <span className={`flex items-center justify-end text-sm font-bold ${colorClass}`}>
                                    {isPos ? <span className="mr-1 text-xs">▲</span> : <span className="mr-1 text-xs">▼</span>}
                                    {Math.abs(m.change_amt).toFixed(2)} ({Math.abs(m.change_pct).toFixed(2)}%)
                                  </span>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="flex justify-center">
                                    <HexagonScore score={m.score} />
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <div className="h-12 w-24 mx-auto">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={sparklineData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <YAxis domain={['auto', 'auto']} hide />
                                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{r: 3}} />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                </td>
                              </tr>
                             )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* --- SECTORS TAB --- */}
              {activeTab === "Sectors" && (
                <div className="h-full flex flex-col space-y-4">
                  <h2 className="text-xl font-bold text-white shrink-0">Market Heatmap</h2>
                  <div className="flex-1 w-full bg-[#09090b] min-h-[600px] border border-white/5 rounded-lg overflow-hidden">
                    {sectors && sectors.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <Treemap
                          data={sectors}
                          dataKey="size"
                          ratio={4/3}
                          stroke="#09090b"
                          content={<TreemapContent />}
                          isAnimationActive={false}
                        />
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">No sector data</div>
                    )}
                  </div>
                </div>
              )}

              {/* --- NEWS TAB --- */}
              {activeTab === "News" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white mb-6">General Market News</h2>
                  <div className="bg-[#0f1115] border border-white/5 rounded-lg p-6">
                    <div className="space-y-6">
                      {generalNews?.map((n: any, i: number) => (
                        <div key={i} className="group border-b border-white/5 last:border-0 pb-6 last:pb-0">
                          <a href={n.url} target="_blank" rel="noreferrer" className="block hover:text-blue-400 transition-colors">
                            <h3 className="text-lg font-medium text-gray-200 group-hover:text-blue-400 mb-2">{n.title}</h3>
                          </a>
                          <span className="text-xs text-gray-500">{new Date(n.date).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </div>
  );
}
