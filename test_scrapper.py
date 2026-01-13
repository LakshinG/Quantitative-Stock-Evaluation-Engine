from stock_data import get_sp500_tickers, get_stock_history

def test_scraper():
    print("Testing S&P 500 Scraper...")
    tickers = get_sp500_tickers()
    print(f"Found {len(tickers)} tickers.")
    if len(tickers) > 0:
        print(f"First 5 tickers: {tickers[:5]}")
    else:
        print("Failed to scrape tickers.")

def test_yfinance():
    print("\nTesting yfinance fetch...")
    ticker = "AAPL"
    df = get_stock_history(ticker, period="1mo")
    if not df.empty:
        print(f"Successfully fetched data for {ticker}. Rows: {len(df)}")
        print(df.head())
    else:
        print(f"Failed to fetch data for {ticker}")

if __name__ == "__main__":
    test_scraper()
    test_yfinance()
