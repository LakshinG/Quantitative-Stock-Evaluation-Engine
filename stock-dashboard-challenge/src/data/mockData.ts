export interface StockDataPoint {
  date: string;
  price: number;
}

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  history: StockDataPoint[];
}

const generateHistory = (startPrice: number, days: number = 30): StockDataPoint[] => {
  const data: StockDataPoint[] = [];
  let currentPrice = startPrice;
  const today = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    // Add some random walk for the stock price
    const changePercent = (Math.random() - 0.5) * 0.05; // -2.5% to +2.5% daily change max
    currentPrice = currentPrice * (1 + changePercent);

    data.push({
      date: date.toISOString().split('T')[0],
      price: Number(currentPrice.toFixed(2)),
    });
  }

  return data;
};

// Start prices
const AAPL_START = 150;
const MSFT_START = 350;
const TSLA_START = 180;
const GOOG_START = 130;
const AMZN_START = 140;
const META_START = 400;

export const mockStocks: Stock[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 172.45,
    change: 2.34,
    changePercent: 1.38,
    history: generateHistory(AAPL_START),
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 405.12,
    change: -1.25,
    changePercent: -0.31,
    history: generateHistory(MSFT_START),
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    price: 195.32,
    change: 5.67,
    changePercent: 2.99,
    history: generateHistory(TSLA_START),
  },
  {
    symbol: 'GOOG',
    name: 'Alphabet Inc.',
    price: 142.65,
    change: -0.45,
    changePercent: -0.31,
    history: generateHistory(GOOG_START),
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    price: 175.21,
    change: 1.15,
    changePercent: 0.66,
    history: generateHistory(AMZN_START),
  },
  {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    price: 485.50,
    change: 12.30,
    changePercent: 2.60,
    history: generateHistory(META_START),
  }
];

// Set the current price exactly to the last item in the generated history to make it match up
mockStocks.forEach(stock => {
  stock.price = stock.history[stock.history.length - 1].price;
  const previousPrice = stock.history[stock.history.length - 2].price;
  stock.change = Number((stock.price - previousPrice).toFixed(2));
  stock.changePercent = Number(((stock.change / previousPrice) * 100).toFixed(2));
});
