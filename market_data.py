import requests
from bs4 import BeautifulSoup
import yfinance as yf

import random

def get_market_movers():
    """
    Returns some simulated market movers (Top Gainers, Top Losers, Most Active)
    with detailed info like 7D chart data and company names.
    """
    tickers_to_check = {
        'NVDA': 'NVIDIA Corp', 'TSLA': 'Tesla Inc', 'AAPL': 'Apple Inc', 
        'AMD': 'Advanced Micro Devices', 'META': 'Meta Platforms', 
        'AMZN': 'Amazon.com', 'COIN': 'Coinbase Global', 
        'PLTR': 'Palantir Tech', 'SMCI': 'Super Micro Comp', 'MARA': 'Marathon Digital'
    }
    
    try:
        data = yf.download(list(tickers_to_check.keys()), period="7d", group_by="ticker", progress=False)
        
        results = []
        for ticker, name in tickers_to_check.items():
            try:
                closes = data[ticker]['Close'].dropna()
                if len(closes) >= 2:
                    prev_close = float(closes.iloc[-2])
                    last_close = float(closes.iloc[-1])
                    change_amt = last_close - prev_close
                    pct_change = (change_amt / prev_close) * 100
                    
                    # 7-day sparkline data
                    sparkline = [float(x) for x in closes.values.tolist()[-7:]]
                    
                    # Mock an AI "Smart Score" out of 10
                    score = random.randint(4, 10)
                    
                    results.append({
                        "symbol": ticker,
                        "name": name,
                        "price": round(last_close, 2),
                        "change_amt": round(change_amt, 2),
                        "change_pct": round(pct_change, 2),
                        "score": score,
                        "chart_data": sparkline
                    })
            except Exception:
                pass
                
        results.sort(key=lambda x: x['change_pct'], reverse=True)
        
        gainers = results[:4]
        losers = results[-4:]
        losers.sort(key=lambda x: x['change_pct'])
        
        actives = [results[0], results[-1], results[1], results[-2]]
        
        return {
            "gainers": gainers,
            "losers": losers,
            "actives": actives
        }
    except Exception as e:
        print(f"Error fetching movers: {e}")
        return {"gainers": [], "losers": [], "actives": []}

def get_general_news():
    """
    Fetches general market news by looking at S&P 500 ETF (SPY) news.
    """
    try:
        spy = yf.Ticker("SPY")
        news = spy.news
        headlines = []
        for item in news[:10]:
            title = item.get('content', {}).get('title') or item.get('title', 'Market News')
            pub_date = item.get('content', {}).get('pubDate') or item.get('providerPublishTime', '')
            link = item.get('content', {}).get('clickThroughUrl', {}).get('url') or item.get('link', '#')
            
            headlines.append({
                "title": title,
                "date": pub_date,
                "url": link
            })
        return headlines
    except Exception as e:
        print(f"Error fetching general news: {e}")
        return []
