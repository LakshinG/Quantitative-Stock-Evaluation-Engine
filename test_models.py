from stock_data import get_sp500_tickers, get_stock_history
from model_training import prepare_data, train_price_model, train_trend_model, predict_next_day, add_features
import pandas as pd

def test_models():
    print("Fetching data for AAPL...")
    df = get_stock_history("AAPL", period="2y")
    if df.empty:
        print("Failed to fetch data.")
        return

    print("Preparing data...")
    df_prepared = prepare_data(df)
    print(f"Data prepared. Rows: {len(df_prepared)}")
    
    if len(df_prepared) < 50:
        print("Not enough data to train.")
        return

    print("Training Price Model...")
    price_model, mse, _, _ = train_price_model(df_prepared)
    print(f"Price Model MSE: {mse}")

    print("Training Trend Model...")
    trend_model, accuracy, _, _ = train_trend_model(df_prepared)
    print(f"Trend Model Accuracy: {accuracy}")
    
    print("Predicting next day...")
    # Use the last row of the prepared data which corresponds to "today" to predict "tomorrow"
    # Note: In prepare_data, we dropped rows with NaNs. The last row has features for the current day 
    # and Target_Price for the next day (which might not exist if it's the absolute latest day, 
    # but prepare_data shifts targets so the very last day of *available* data is usually dropped 
    # because it doesn't have a target 'tomorrow').
    # However, to predict the *future* (unknown tomorrow), we need the latest available close data.
    
    # Let's re-fetch or use original df to get the absolute latest data point to predict the *unknown* future.
    # prepare_data drops the last row because shift(-1) creates a NaN target.
    # So the model is trained on d1..d99.
    # To predict for d101, we need features from d100.
    
    # So we should grab the last row of the *original* df (with features calculated) before dropna for prediction.
    
    # Re-running feature calc without dropna for prediction
    df_latest = add_features(df)
    
    latest_row = df_latest.iloc[[-1]]
    print(f"Latest date: {latest_row.index[0]}")
    
    # Check if latest row has NaNs (e.g. if not enough history for MA)
    # The last row might have NaNs if the window is larger than available data, but we check 50 rows earlier.
    # Note: add_features does not drop NaNs.
    
    try:
        pred_price, pred_trend, prob = predict_next_day(df_latest, price_model, trend_model)
        print(f"Predicted Price: {pred_price}")
        print(f"Predicted Trend: {'Up' if pred_trend == 1 else 'Down'} (Prob Up: {prob[1]:.2f})")
    except ValueError as e:
        print(f"Prediction failed: {e}")

if __name__ == "__main__":
    test_models()
