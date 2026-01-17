StockTrend-Predictor
Quantitative Stock Analysis and Trend Forecasting using Streamlit & Scikit-Learn
This application leverages historical market data to perform time-series forecasting and trend classification. 
By integrating data scraping via the yfinance API with Random Forest Regressors and Classification models, 
the tool provides both price estimation and directional trend confidence for various equity tickers.


1. Clone the Repository

2. Install Dependencies:
pip install -r requirements.txt

3. Launch the App:
streamlit run app.py

4. Analyze Equities:
Select Ticker: Choose from various market indices (e.g., AAPL, MSFT).

History Period: Define the look-back window (e.g., "2y") to adjust the training dataset size.

Review Forecasts: Analyze the Predicted Close Price alongside the Trend Confidence percentage.
