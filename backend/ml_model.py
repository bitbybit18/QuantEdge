# ml_model.py
# Upgraded to XGBoost — industry standard for financial ML
# Used by top quantitative hedge funds worldwide

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import TimeSeriesSplit
import xgboost as xgb
import yfinance as yf
from datetime import datetime


# ─────────────────────────────────────────
# FEATURE ENGINEERING
# More features = better predictions
# ─────────────────────────────────────────
def create_features(df):
    """
    Creates rich feature set for XGBoost
    More features than before for better accuracy
    """
    df = df.copy()

    # ── Basic return features ──
    df['return_1d']  = df['Close'].pct_change(1)
    df['return_3d']  = df['Close'].pct_change(3)
    df['return_5d']  = df['Close'].pct_change(5)
    df['return_10d'] = df['Close'].pct_change(10)
    df['return_20d'] = df['Close'].pct_change(20)

    # ── Moving averages ──
    df['sma_5']  = df['Close'].rolling(5).mean()
    df['sma_10'] = df['Close'].rolling(10).mean()
    df['sma_20'] = df['Close'].rolling(20).mean()
    df['sma_50'] = df['Close'].rolling(50).mean()

    # ── Exponential moving averages ──
    df['ema_5']  = df['Close'].ewm(span=5).mean()
    df['ema_10'] = df['Close'].ewm(span=10).mean()
    df['ema_20'] = df['Close'].ewm(span=20).mean()

    # ── Price relative to moving averages ──
    df['price_vs_sma5']  = (df['Close'] - df['sma_5'])  / df['sma_5']
    df['price_vs_sma20'] = (df['Close'] - df['sma_20']) / df['sma_20']
    df['price_vs_sma50'] = (df['Close'] - df['sma_50']) / df['sma_50']

    # ── Volatility features ──
    df['volatility_5']  = df['Close'].rolling(5).std()
    df['volatility_20'] = df['Close'].rolling(20).std()

    # ── RSI ──
    delta      = df['Close'].diff()
    gain       = delta.where(delta > 0, 0)
    loss       = -delta.where(delta < 0, 0)
    avg_gain   = gain.rolling(14).mean()
    avg_loss   = loss.rolling(14).mean()
    rs         = avg_gain / avg_loss
    df['rsi']  = 100 - (100 / (1 + rs))

    # ── MACD ──
    ema12        = df['Close'].ewm(span=12).mean()
    ema26        = df['Close'].ewm(span=26).mean()
    df['macd']   = ema12 - ema26
    df['signal'] = df['macd'].ewm(span=9).mean()
    df['macd_hist'] = df['macd'] - df['signal']

    # ── Volume features ──
    df['volume_sma']   = df['Volume'].rolling(20).mean()
    df['volume_ratio'] = df['Volume'] / df['volume_sma']
    df['volume_change'] = df['Volume'].pct_change(1)

    # ── Candlestick features ──
    df['hl_spread']    = (df['High'] - df['Low']) / df['Close']
    df['oc_spread']    = (df['Close'] - df['Open']) / df['Open']
    df['upper_shadow'] = (df['High'] - df[['Open','Close']].max(axis=1)) / df['Close']
    df['lower_shadow'] = (df[['Open','Close']].min(axis=1) - df['Low']) / df['Close']

    # ── Lag features (previous days prices) ──
    for lag in [1, 2, 3, 5]:
        df[f'close_lag_{lag}'] = df['Close'].shift(lag)
        df[f'return_lag_{lag}'] = df['return_1d'].shift(lag)

    # ── Target: next day closing price ──
    df['target'] = df['Close'].shift(-1)

    df.dropna(inplace=True)

    return df


# ─────────────────────────────────────────
# TRAIN XGBOOST MODEL
# ─────────────────────────────────────────
def train_model(ticker: str, model_type: str = "xgboost"):
    """
    Trains XGBoost model on stock data
    Uses TimeSeriesSplit for proper financial backtesting
    """

    print(f"Training XGBoost model for {ticker}...")

    # Download 3 years of data for better training
    stock = yf.Ticker(ticker)
    df    = stock.history(period="3y")

    if df.empty or len(df) < 100:
        raise ValueError(f"Not enough data for {ticker}")

    # Create features
    df = create_features(df)

    # Feature columns
    feature_cols = [
        'return_1d', 'return_3d', 'return_5d', 'return_10d', 'return_20d',
        'sma_5', 'sma_10', 'sma_20', 'sma_50',
        'ema_5', 'ema_10', 'ema_20',
        'price_vs_sma5', 'price_vs_sma20', 'price_vs_sma50',
        'volatility_5', 'volatility_20',
        'rsi', 'macd', 'signal', 'macd_hist',
        'volume_ratio', 'volume_change',
        'hl_spread', 'oc_spread', 'upper_shadow', 'lower_shadow',
        'close_lag_1', 'close_lag_2', 'close_lag_3', 'close_lag_5',
        'return_lag_1', 'return_lag_2', 'return_lag_3', 'return_lag_5',
    ]

    X = df[feature_cols].values
    y = df['target'].values

    # TimeSeriesSplit — proper way to validate financial models
    # Never use random split for time series — it leaks future data!
    tscv    = TimeSeriesSplit(n_splits=5)
    split   = int(len(X) * 0.8)
    X_train = X[:split]
    X_test  = X[split:]
    y_train = y[:split]
    y_test  = y[split:]

    # Scale features
    scaler         = MinMaxScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    # XGBoost model with tuned hyperparameters
    model = xgb.XGBRegressor(
        n_estimators=500,        # 500 trees
        learning_rate=0.05,      # slow learning = better generalization
        max_depth=6,             # tree depth
        subsample=0.8,           # use 80% of data per tree
        colsample_bytree=0.8,    # use 80% of features per tree
        min_child_weight=5,      # prevents overfitting
        reg_alpha=0.1,           # L1 regularization
        reg_lambda=1.0,          # L2 regularization
        random_state=42,
        verbosity=0,             # silent mode
    )

    # Train with early stopping to prevent overfitting
    model.fit(
        X_train_scaled,
        y_train,
        eval_set=[(X_test_scaled, y_test)],
        verbose=False,
    )

    # Evaluate
    y_pred = model.predict(X_test_scaled)
    mae    = mean_absolute_error(y_test, y_pred)
    r2     = r2_score(y_test, y_pred)

    print(f"XGBoost trained! MAE: ${mae:.2f}, R2: {r2:.4f}")

    return {
        "model":        model,
        "scaler":       scaler,
        "feature_cols": feature_cols,
        "mae":          round(mae, 2),
        "r2":           round(r2, 4),
        "model_type":   "xgboost",
        "ticker":       ticker,
        "trained_at":   datetime.now().isoformat(),
    }


# ─────────────────────────────────────────
# PREDICT
# ─────────────────────────────────────────
def predict_next_price(ticker: str, model_data: dict):
    """
    Uses trained XGBoost model to predict tomorrow's price
    """

    stock = yf.Ticker(ticker)
    df    = stock.history(period="6mo")
    df    = create_features(df)

    if df.empty:
        raise ValueError("No data available")

    # Get latest features
    latest = df[model_data["feature_cols"]].iloc[-1].values.reshape(1, -1)
    latest_scaled = model_data["scaler"].transform(latest)

    # Predict
    predicted_price  = model_data["model"].predict(latest_scaled)[0]
    current_price    = df["Close"].iloc[-1]
    predicted_change = predicted_price - current_price
    predicted_pct    = (predicted_change / current_price) * 100

    # Signal
    if predicted_pct > 2.0:
        signal = "STRONG BUY"
    elif predicted_pct > 0.5:
        signal = "BUY"
    elif predicted_pct > -0.5:
        signal = "NEUTRAL"
    elif predicted_pct > -2.0:
        signal = "SELL"
    else:
        signal = "STRONG SELL"

    # Feature importance — shows which features matter most
    importance = model_data["model"].feature_importances_
    top_features = sorted(
        zip(model_data["feature_cols"], importance),
        key=lambda x: x[1],
        reverse=True
    )[:5]

    return {
        "ticker":               ticker,
        "current_price":        round(float(current_price), 2),
        "predicted_price":      round(float(predicted_price), 2),
        "predicted_change":     round(float(predicted_change), 2),
        "predicted_change_pct": round(float(predicted_pct), 2),
        "signal":               signal,
        "model_type":           "xgboost",
        "model_accuracy": {
            "mae": model_data["mae"],
            "r2":  model_data["r2"],
        },
        "top_features": [
            {"feature": f, "importance": round(float(i), 4)}
            for f, i in top_features
        ],
        "trained_at": model_data["trained_at"],
    }