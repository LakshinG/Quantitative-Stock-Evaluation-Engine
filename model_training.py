import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import mean_squared_error, accuracy_score

def add_features(df):
    """
    Adds technical indicators as features to the dataframe.
    """
    df = df.copy()
    
    # Feature Engineering
    # 1. Moving Averages
    df['MA_5'] = df['Close'].rolling(window=5).mean()
    df['MA_20'] = df['Close'].rolling(window=20).mean()
    
    # 2. Daily Return
    df['Daily_Return'] = df['Close'].pct_change()
    
    # 3. Lagged features (Previous days' prices)
    df['Close_Lag1'] = df['Close'].shift(1)
    df['Close_Lag2'] = df['Close'].shift(2)
    
    return df

def prepare_data(df):
    """
    Prepares the dataframe for training.
    Adds technical indicators and target variables.
    """
    df = add_features(df)
    
    # Target 1: Next Day Close Price
    df['Target_Price'] = df['Close'].shift(-1)
    
    # Target 2: Trend (1 if Next Close > Current Close, else 0)
    df['Target_Trend'] = (df['Target_Price'] > df['Close']).astype(int)
    
    # Drop NaNs created by rolling windows and shifting
    df = df.dropna()
    
    return df

def train_price_model(df):
    """
    Trains a Linear Regression model to predict next day's price.
    """
    features = ['Close', 'MA_5', 'MA_20', 'Daily_Return', 'Close_Lag1', 'Close_Lag2']
    X = df[features]
    y = df['Target_Price']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
    
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    predictions = model.predict(X_test)
    mse = mean_squared_error(y_test, predictions)
    
    return model, mse, X_test, y_test

def train_trend_model(df):
    """
    Trains a Logistic Regression model to predict next day's trend (Up/Down).
    """
    features = ['Close', 'MA_5', 'MA_20', 'Daily_Return', 'Close_Lag1', 'Close_Lag2']
    X = df[features]
    y = df['Target_Trend']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
    
    model = LogisticRegression()
    model.fit(X_train, y_train)
    
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    
    return model, accuracy, X_test, y_test

def predict_next_day(df, price_model, trend_model):
    """
    Predicts the next day's price and trend using the latest data point.
    df should already have features added via add_features().
    """
    latest_data = df.iloc[[-1]].copy()
    
    features = ['Close', 'MA_5', 'MA_20', 'Daily_Return', 'Close_Lag1', 'Close_Lag2']
    
    # Check for NaNs in features
    if latest_data[features].isnull().values.any():
         raise ValueError("Latest data point contains NaNs in feature columns. Cannot predict.")

    latest_features = latest_data[features]
    
    predicted_price = price_model.predict(latest_features)[0]
    predicted_trend = trend_model.predict(latest_features)[0]
    trend_prob = trend_model.predict_proba(latest_features)[0] # [prob_0, prob_1]
    
    return predicted_price, predicted_trend, trend_prob
