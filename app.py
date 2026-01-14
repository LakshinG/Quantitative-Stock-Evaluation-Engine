import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from stock_data import get_sp500_tickers, get_stock_history
from model_training import prepare_data, train_price_model, train_trend_model, predict_next_day, add_features

# Set page config
st.set_page_config(page_title="Stock Predictor", layout="wide")

st.title("Stock Market Data and Forcasts powered by ML")
st.markdown("""
This tool was created to bridge the gap between historical data and future movements through Machine Learning. By scraping real-time market data for 500+ key tickers, including the entire S&P 500, this app provides more than just charts and news. It utilizes integrated linear and logistic regression models to forecast the next day’s closing price and trend direction.

Explore a clean, data-first platform where you can visualize years of price action and leverage AI-powered confidence scores to help you stay one step ahead of the market.
""")

# Sidebar for controls
st.sidebar.header("Settings")

# Step 1: Data Acquisition
@st.cache_data
def load_tickers():
    return get_sp500_tickers()

with st.sidebar:
    st.write("Loading tickers...")
    tickers = load_tickers()
    st.success(f"Loaded {len(tickers)} tickers.")
    
    selected_ticker = st.selectbox("Select a Ticker", tickers, index=tickers.index('AAPL') if 'AAPL' in tickers else 0)
    
    period = st.selectbox("Select History Period", ["1y", "2y", "5y", "10y"], index=1)

# Main Data Loading
data_load_state = st.text('Loading the graphs, just a second...!')
df = get_stock_history(selected_ticker, period=period)
data_load_state.text('Here is the Latest Data!')

if df.empty:
    st.error(f"Could not load data for {selected_ticker}. Please try another ticker.")
else:
    # Display Raw Data
    st.subheader(f"Historical Data for {selected_ticker}")
    st.dataframe(df.tail())
    
    # Plotting
    fig = go.Figure()
    fig.add_trace(go.Candlestick(x=df.index,
                    open=df['Open'],
                    high=df['High'],
                    low=df['Low'],
                    close=df['Close'],
                    name='market data'))
    fig.update_layout(title=f'{selected_ticker} Stock Price', yaxis_title='Stock Price (USD)')
    st.plotly_chart(fig, use_container_width=True)
    
    # Model & Prediction
    st.subheader("Current Predictions")
    
    if len(df) < 50:
        st.warning("Not enough data points to train models (need at least 50).")
    else:
        # Prepare data
        df_prepared = prepare_data(df)
        
        # Train Models
        with st.spinner('Training models...'):
            price_model, mse, X_test_p, y_test_p = train_price_model(df_prepared)
            trend_model, accuracy, X_test_t, y_test_t = train_trend_model(df_prepared)
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.metric("Model MSE (Price)", f"{mse:.2f}")
        with col2:
            st.metric("Model Accuracy (Trend)", f"{accuracy*100:.1f}%")
            
        # Predict Next Day
        # Prepare latest feature vector
        df_latest = add_features(df)
        
        pred_price, pred_trend, prob = predict_next_day(df_latest, price_model, trend_model)
        
        st.divider()
        st.write(f"### Prediction for Next Trading Day")
        
        c1, c2 = st.columns(2)
        with c1:
            st.metric("Predicted Close Price", f"${pred_price:.2f}")
        with c2:
            trend_str = "UP 🟢" if pred_trend == 1 else "DOWN 🔴"
            confidence = prob[1] if pred_trend == 1 else prob[0]
            st.metric("Predicted Trend", trend_str, delta=f"Confidence: {confidence*100:.1f}%")
            
        st.info("Note: This app uses mathematical regression to project potential trends from past performance. Because market conditions are volatile, these predictions are not a guarantee of future results and are intended for research purposes only. This should not be considered financial advice or be used for live trading.")
