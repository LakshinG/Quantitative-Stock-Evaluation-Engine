# Quantitative Stock Evaluation Engine

A full-stack, Bloomberg-style financial terminal built with Next.js, FastAPI, and Python. This platform integrates real-time market data, AI-driven sentiment analysis, quantitative strategy backtesting, and Modern Portfolio Theory optimization.

## Features

- **Interactive Dashboard**: High-performance candlestick charts and real-time fundamentals via TradingView's Lightweight Charts and Recharts.
- **AI Sentiment Analysis**: Utilizes `ProsusAI/finbert` (run locally via PyTorch & HuggingFace) to score live news headlines from yfinance as Bullish or Bearish.
- **Strategy Backtester**: Simulates historical trading returns using Scikit-Learn Random Forest models against a Buy & Hold benchmark.
- **Market Heatmap**: Interactive S&P 500 sector treemap to visualize market movers based on market cap and daily performance.
- **Portfolio Optimization**: Uses Monte Carlo simulations (6,500 iterations) to find the mathematically perfect portfolio allocation to maximize the Sharpe Ratio (Modern Portfolio Theory).

## Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS v4, Recharts, Lightweight-Charts.
- **Backend**: FastAPI, Uvicorn, Python, Pandas, NumPy, Scikit-Learn, PyTorch, Transformers.

## Getting Started

### 1. Backend Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
python api.py
```
*The backend will run on `http://localhost:8000`*

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the Next.js dev server
npm run dev
```
*The frontend will run on `http://localhost:3000`*
