import yfinance as yf
import pandas as pd
import numpy as np

def optimize_portfolio(tickers, risk_free_rate=0.04):
    """
    Uses Monte Carlo simulation to find the optimal portfolio allocation
    based on Modern Portfolio Theory (maximizing the Sharpe Ratio).
    """
    if not tickers or len(tickers) < 2:
        return {"error": "Please provide at least 2 tickers for optimization."}
        
    try:
        # Download 1 year of historical close prices
        data = yf.download(tickers, period="1y", group_by="ticker", progress=False)
        
        # Extract 'Close' prices into a single DataFrame
        close_data = pd.DataFrame()
        for ticker in tickers:
            if ticker in data and 'Close' in data[ticker]:
                close_data[ticker] = data[ticker]['Close']
            elif 'Close' in data:
                # Fallback if yfinance format varies
                close_data[ticker] = data['Close'][ticker]
                
        close_data = close_data.dropna()
        if close_data.empty:
             return {"error": "Could not fetch historical data for these tickers."}
             
        # Calculate daily returns
        returns = close_data.pct_change().dropna()
        
        # Annualized expected returns and covariance matrix
        mean_returns = returns.mean() * 252
        cov_matrix = returns.cov() * 252
        
        num_portfolios = 5000
        num_assets = len(tickers)
        
        results = np.zeros((3, num_portfolios))
        weights_record = []
        
        # Monte Carlo Simulation
        for i in range(num_portfolios):
            weights = np.random.random(num_assets)
            weights /= np.sum(weights)
            
            portfolio_return = np.sum(mean_returns * weights)
            portfolio_std_dev = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
            
            results[0, i] = portfolio_return
            results[1, i] = portfolio_std_dev
            results[2, i] = (portfolio_return - risk_free_rate) / portfolio_std_dev # Sharpe Ratio
            
            weights_record.append(weights)
            
        # Find the portfolio with the maximum Sharpe Ratio
        max_sharpe_idx = np.argmax(results[2])
        optimal_weights = weights_record[max_sharpe_idx]
        
        allocations = []
        for i, ticker in enumerate(tickers):
            weight_pct = optimal_weights[i] * 100
            if weight_pct > 0.1: # Only include if > 0.1%
                allocations.append({
                    "ticker": ticker,
                    "weight": round(weight_pct, 2)
                })
            
        # Sort by weight
        allocations = sorted(allocations, key=lambda x: x['weight'], reverse=True)
            
        return {
            "expected_return_pct": round(results[0, max_sharpe_idx] * 100, 2),
            "expected_volatility_pct": round(results[1, max_sharpe_idx] * 100, 2),
            "sharpe_ratio": round(results[2, max_sharpe_idx], 2),
            "allocations": allocations
        }
    except Exception as e:
        return {"error": str(e)}
