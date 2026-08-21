import pandas as pd
import numpy as np
from stock_data import get_stock_history
from model_training import prepare_data, train_trend_model

def run_backtest(ticker: str, initial_capital: float = 10000.0, period: str = "5y"):
    """
    Runs a backtest of the trend prediction model against Buy & Hold.
    Uses the 20% test split from the model_training logic.
    """
    # 1. Fetch data
    df = get_stock_history(ticker, period=period)
    if df.empty or len(df) < 50:
        return {"error": "Not enough data for backtesting."}

    # 2. Prepare data
    df_prepared = prepare_data(df)
    
    # 3. Train model and get test data
    trend_model, accuracy, X_test, y_test = train_trend_model(df_prepared)
    
    # 4. Generate predictions on test data
    predictions = trend_model.predict(X_test)
    
    # 5. Simulate Strategy vs Buy & Hold
    # Test data corresponds to the tail of df_prepared
    test_indices = X_test.index
    
    results = []
    
    capital_strategy = initial_capital
    capital_bh = initial_capital
    
    # We need the actual close prices to calculate returns
    actual_closes = df_prepared.loc[test_indices, 'Close']
    
    # Initial state
    shares_strategy = 0
    shares_bh = capital_bh / actual_closes.iloc[0]
    
    position_strategy = 0 # 1 if holding, 0 if cash
    
    for i in range(len(test_indices)):
        date = test_indices[i]
        current_price = actual_closes.iloc[i]
        
        # --- Benchmark: Buy & Hold ---
        current_value_bh = shares_bh * current_price
        
        # --- Strategy ---
        # Execute trade based on previous day's prediction (or current day's prediction for next day)
        # We assume we enter/exit at the current close based on yesterday's prediction for today
        if position_strategy == 1:
            current_value_strategy = shares_strategy * current_price
        else:
            current_value_strategy = capital_strategy # held in cash
            
        # Record results before taking new action for tomorrow
        results.append({
            "date": str(date.date()) if hasattr(date, 'date') else str(date),
            "price": current_price,
            "strategy_value": current_value_strategy,
            "benchmark_value": current_value_bh,
            "prediction": int(predictions[i])
        })
        
        # Make decision for tomorrow based on today's prediction
        pred_trend = predictions[i]
        if pred_trend == 1 and position_strategy == 0:
            # Buy
            shares_strategy = current_value_strategy / current_price
            capital_strategy = 0
            position_strategy = 1
        elif pred_trend == 0 and position_strategy == 1:
            # Sell
            capital_strategy = shares_strategy * current_price
            shares_strategy = 0
            position_strategy = 0

    # Calculate final metrics
    final_strategy_val = results[-1]['strategy_value']
    final_bh_val = results[-1]['benchmark_value']
    
    strategy_return = ((final_strategy_val - initial_capital) / initial_capital) * 100
    bh_return = ((final_bh_val - initial_capital) / initial_capital) * 100
    
    return {
        "ticker": ticker,
        "initial_capital": initial_capital,
        "final_strategy_value": round(final_strategy_val, 2),
        "final_benchmark_value": round(final_bh_val, 2),
        "strategy_return_pct": round(strategy_return, 2),
        "benchmark_return_pct": round(bh_return, 2),
        "accuracy_pct": round(accuracy * 100, 2),
        "history": results
    }

if __name__ == "__main__":
    res = run_backtest("AAPL")
    print(f"Strategy Return: {res.get('strategy_return_pct')}%")
    print(f"Benchmark Return: {res.get('benchmark_return_pct')}%")
