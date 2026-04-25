# ml_model.py
# This file contains all our Machine Learning logic
# Separated from main.py to keep code clean (separation of concerns)

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, r2_score
import yfinance as yf
from datetime import datetime


# ─────────────────────────────────────────
# FEATURE ENGINEERING
# Creating useful inputs for our ML model
# ─────────────────────────────────────────
def create_features(df):
    """
    Takes raw OHLCV data and creates ML features
    
    Features we create:
    - SMA (Simple Moving Average) — trend indicator
    - Price momentum — how fast price is changing
    - Volatility — how much price fluctuates
    - Volume change — unusual trading activity
    """
    df = df.copy()

    # Price features
    df['return_1d'] = df['Close'].pct_change(1)   # 1-day return
    df['return_5d'] = df['Close'].pct_change(5)   # 5-day return
    df['return_20d'] = df['Close'].pct_change(20) # 20-day return

    # Moving averages
    df['sma_7']  = df['Close'].rolling(window=7).mean()
    df['sma_20'] = df['Close'].rolling(window=20).mean()
    df['sma_50'] = df['Close'].rolling(window=50).mean()

    # Price relative to moving average
    # This tells us if price is above or below trend
    df['price_vs_sma20'] = (df['Close'] - df['sma_20']) / df['sma_20']

    # Volatility — standard deviation of last 20 days
    df['volatility'] = df['Close'].rolling(window=20).std()

    # Volume features
    df['volume_sma'] = df['Volume'].rolling(window=20).mean()
    df['volume_ratio'] = df['Volume'] / df['volume_sma']

    # High-Low spread — measures daily volatility
    df['hl_spread'] = (df['High'] - df['Low']) / df['Close']

    # Target: next day's closing price (what we want to predict)
    df['target'] = df['Close'].shift(-1)

    # Drop rows with NaN values (caused by rolling calculations)
    df.dropna(inplace=True)

    return df


# ─────────────────────────────────────────
# TRAIN MODEL
# ─────────────────────────────────────────
def train_model(ticker: str, model_type: str = "random_forest"):
    """
    Downloads stock data, engineers features, trains ML model
    Returns trained model + metadata
    """

    print(f"Training {model_type} model for {ticker}...")

    # Download 2 years of data for training
    stock = yf.Ticker(ticker)
    df = stock.history(period="2y")

    if df.empty or len(df) < 60:
        raise ValueError(f"Not enough data for {ticker}")

    # Create features
    df = create_features(df)

    # Define which columns are features (inputs)
    feature_cols = [
        'return_1d', 'return_5d', 'return_20d',
        'sma_7', 'sma_20', 'sma_50',
        'price_vs_sma20', 'volatility',
        'volume_ratio', 'hl_spread'
    ]

    X = df[feature_cols].values  # Features matrix
    y = df['target'].values      # Target vector

    # Train/test split — 80% train, 20% test
    split = int(len(X) * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    # Scale features to 0-1 range
    # Important for many ML models to work properly
    scaler = MinMaxScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    # Choose model
    if model_type == "linear":
        model = LinearRegression()
    else:
        # Random Forest — more powerful than linear regression
        # Uses many decision trees and averages their predictions
        model = RandomForestRegressor(
            n_estimators=100,  # 100 decision trees
            max_depth=10,
            random_state=42    # for reproducibility
        )

    # Train the model
    model.fit(X_train_scaled, y_train)

    # Evaluate on test data
    y_pred = model.predict(X_test_scaled)
    mae = mean_absolute_error(y_test, y_pred)
    r2  = r2_score(y_test, y_pred)

    print(f"Model trained! MAE: ${mae:.2f}, R²: {r2:.4f}")

    return {
        "model": model,
        "scaler": scaler,
        "feature_cols": feature_cols,
        "mae": round(mae, 2),
        "r2": round(r2, 4),
        "model_type": model_type,
        "ticker": ticker,
        "trained_at": datetime.now().isoformat()
    }


# ─────────────────────────────────────────
# PREDICT
# ─────────────────────────────────────────
def predict_next_price(ticker: str, model_data: dict):
    """
    Uses trained model to predict tomorrow's price
    """

    # Get latest data
    stock = yf.Ticker(ticker)
    df = stock.history(period="3mo")
    df = create_features(df)

    if df.empty:
        raise ValueError("No data available")

    # Get the most recent row of features
    latest_features = df[model_data["feature_cols"]].iloc[-1].values.reshape(1, -1)

    # Scale it using the same scaler used in training
    latest_scaled = model_data["scaler"].transform(latest_features)

    # Make prediction
    predicted_price = model_data["model"].predict(latest_scaled)[0]
    current_price   = df["Close"].iloc[-1]

    # Calculate predicted change
    predicted_change = predicted_price - current_price
    predicted_change_pct = (predicted_change / current_price) * 100

    # Generate signal
    if predicted_change_pct > 1.0:
        signal = "STRONG BUY"
    elif predicted_change_pct > 0:
        signal = "BUY"
    elif predicted_change_pct > -1.0:
        signal = "SELL"
    else:
        signal = "STRONG SELL"

    return {
        "ticker": ticker,
        "current_price": round(float(current_price), 2),
        "predicted_price": round(float(predicted_price), 2),
        "predicted_change": round(float(predicted_change), 2),
        "predicted_change_pct": round(float(predicted_change_pct), 2),
        "signal": signal,
        "model_type": model_data["model_type"],
        "model_accuracy": {
            "mae": model_data["mae"],
            "r2": model_data["r2"],
        },
        "trained_at": model_data["trained_at"]
    }