from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf

# Import existing functions (we will refactor them if needed, but keeping it simple for now)
from stock_data import get_sp500_tickers, get_stock_history

app = FastAPI(title="Stock Evaluation Engine API")

# Allow CORS for local Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Stock Evaluation Engine API"}

@app.get("/api/tickers")
def get_tickers():
    try:
        tickers = get_sp500_tickers()
        return {"tickers": tickers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stock/{ticker}")
def get_stock_data(ticker: str, period: str = "1y"):
    try:
        df = get_stock_history(ticker, period=period)
        if df.empty:
             raise HTTPException(status_code=404, detail="No data found for ticker")
        
        # Convert df to JSON serializable format
        # Reset index to get Date as a column
        df_reset = df.reset_index()
        # Convert datetime to string
        if 'Date' in df_reset.columns:
            df_reset['Date'] = df_reset['Date'].astype(str)
        
        data = df_reset.to_dict(orient="records")
        return {"ticker": ticker, "data": data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from sentiment import analyze_sentiment
from backtester import run_backtest

@app.get("/api/sentiment/{ticker}")
def get_sentiment(ticker: str):
    try:
        return analyze_sentiment(ticker)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/backtest")
def get_backtest(ticker: str, capital: float = 10000.0, period: str = "5y"):
    try:
        return run_backtest(ticker, capital, period)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from market_data import get_market_movers, get_general_news

@app.get("/api/market-movers")
def api_market_movers():
    try:
        return get_market_movers()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sectors")
def api_sectors():
    # Mocking Treemap Data for Recharts
    # Each sector contains its largest companies with market cap "size" and "performance"
    treemap_data = [
        {
            "name": "Technology",
            "children": [
                {"name": "AAPL", "size": 3000, "performance": 1.2},
                {"name": "MSFT", "size": 2800, "performance": -0.5},
                {"name": "NVDA", "size": 2200, "performance": 3.4},
                {"name": "AVGO", "size": 600, "performance": 1.1},
                {"name": "ORCL", "size": 350, "performance": -0.2},
            ]
        },
        {
            "name": "Communication",
            "children": [
                {"name": "GOOGL", "size": 1800, "performance": 0.8},
                {"name": "META", "size": 1200, "performance": 2.1},
                {"name": "NFLX", "size": 300, "performance": -1.5},
                {"name": "DIS", "size": 200, "performance": -0.8},
            ]
        },
        {
            "name": "Consumer Cyclical",
            "children": [
                {"name": "AMZN", "size": 1800, "performance": 1.5},
                {"name": "TSLA", "size": 600, "performance": -2.3},
                {"name": "HD", "size": 350, "performance": 0.4},
                {"name": "MCD", "size": 200, "performance": 0.1},
            ]
        },
        {
            "name": "Financials",
            "children": [
                {"name": "JPM", "size": 500, "performance": 0.9},
                {"name": "V", "size": 550, "performance": 1.1},
                {"name": "MA", "size": 450, "performance": 1.0},
                {"name": "BAC", "size": 250, "performance": -0.5},
            ]
        },
        {
            "name": "Health Care",
            "children": [
                {"name": "LLY", "size": 700, "performance": 2.5},
                {"name": "UNH", "size": 450, "performance": -1.2},
                {"name": "JNJ", "size": 380, "performance": 0.2},
                {"name": "MRK", "size": 300, "performance": 0.8},
            ]
        }
    ]
    return {"sectors": treemap_data}

@app.get("/api/news")
def api_news():
    try:
        return {"news": get_general_news()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/fundamentals/{ticker}")
def api_fundamentals(ticker: str):
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        def format_large_number(num):
            if not num: return "N/A"
            if num >= 1e12: return f"${num/1e12:.2f}T"
            if num >= 1e9: return f"${num/1e9:.2f}B"
            if num >= 1e6: return f"${num/1e6:.2f}M"
            return f"${num}"

        return {
            "market_cap": format_large_number(info.get("marketCap")),
            "pe_ratio": round(info.get("trailingPE", 0), 2) if info.get("trailingPE") else "N/A",
            "forward_pe": round(info.get("forwardPE", 0), 2) if info.get("forwardPE") else "N/A",
            "dividend_yield": f"{round(info.get('dividendYield', 0) * 100, 2)}%" if info.get("dividendYield") else "N/A",
            "high_52w": f"${info.get('fiftyTwoWeekHigh', 'N/A')}" if info.get('fiftyTwoWeekHigh') else "N/A",
            "low_52w": f"${info.get('fiftyTwoWeekLow', 'N/A')}" if info.get('fiftyTwoWeekLow') else "N/A",
            "analyst_rating": info.get("recommendationKey", "N/A").replace('_', ' ').title(),
            "target_price": f"${info.get('targetMeanPrice', 'N/A')}" if info.get('targetMeanPrice') else "N/A",
            "volume": format_large_number(info.get("volume", 0)).replace('$', '')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from portfolio import optimize_portfolio

@app.get("/api/portfolio/optimize")
def api_portfolio_optimize(tickers: str):
    # expect tickers as comma separated string e.g. "AAPL,MSFT,NVDA"
    try:
        ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
        result = optimize_portfolio(ticker_list)
        if "error" in result:
             raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
