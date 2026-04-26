# main.py
# QuantEdge FastAPI Backend — now with real ML predictions

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import numpy as np
from datetime import datetime, timedelta
from ml_model import train_model, predict_next_price
# Add this with the other imports at the top of main.py
from sentiment import fetch_news, analyze_sentiment, get_company_name
from signals import generate_signals
from risk import analyze_risk

# ─────────────────────────────────────────
# Initialize app
# ─────────────────────────────────────────
app = FastAPI(
    title="QuantEdge API",
    description="AI-powered financial intelligence backend",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────
# Cache — stores data and trained models
# ─────────────────────────────────────────
cache = {}
model_cache = {}  # stores trained ML models
CACHE_DURATION = timedelta(minutes=15)


def get_cached(key):
    if key in cache:
        data, timestamp = cache[key]
        if datetime.now() - timestamp < CACHE_DURATION:
            return data
    return None


def set_cache(key, data):
    cache[key] = (data, datetime.now())


# ─────────────────────────────────────────
# ROOT
# ─────────────────────────────────────────
@app.get("/")
def root():
    return {
        "message": "Welcome to QuantEdge API",
        "version": "2.0.0",
        "status": "running"
    }


# ─────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models_cached": list(model_cache.keys())
    }


# ─────────────────────────────────────────
# STOCK ENDPOINT
# GET /stock/{ticker}
# ─────────────────────────────────────────
@app.get("/stock/{ticker}")
def get_stock(ticker: str, period: str = "3mo"):
    ticker = ticker.upper()
    cache_key = f"stock_{ticker}_{period}"

    cached = get_cached(cache_key)
    if cached:
        print(f"Cache hit for {ticker}")
        return cached

    try:
        stock = yf.Ticker(ticker)
        hist  = stock.history(period=period)
        info  = stock.fast_info

        if hist.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No data found for ticker: {ticker}"
            )

        history = []
        for date, row in hist.iterrows():
            history.append({
                "date": date.strftime("%Y-%m-%d"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            })

        response = {
            "ticker": ticker,
            "price": round(float(info.last_price), 2),
            "change": round(float(info.last_price - info.previous_close), 2),
            "changePercent": round(
                float((info.last_price - info.previous_close) / info.previous_close * 100), 2
            ),
            "high": round(float(info.day_high), 2),
            "low": round(float(info.day_low), 2),
            "volume": int(info.three_month_average_volume),
            "marketCap": int(info.market_cap) if info.market_cap else None,
            "history": history,
        }

        set_cache(cache_key, response)
        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────
# ML PREDICT ENDPOINT
# GET /predict/{ticker}
# Trains model if not cached, then predicts
# ─────────────────────────────────────────
@app.get("/predict/{ticker}")
def predict_stock(ticker: str, model_type: str = "random_forest"):
    """
    Predict next day's price using ML
    - First call: trains the model (takes ~10 seconds)
    - Subsequent calls: uses cached model (instant)
    """

    ticker = ticker.upper()
    model_key = f"{ticker}_{model_type}"

    try:
        # Train model if not already cached
        if model_key not in model_cache:
            print(f"Training new model for {ticker}...")
            model_data = train_model(ticker, model_type)
            model_cache[model_key] = model_data
        else:
            print(f"Using cached model for {ticker}")
            model_data = model_cache[model_key]

        # Make prediction
        prediction = predict_next_price(ticker, model_data)
        return prediction

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────
# MODEL INFO ENDPOINT
# GET /model/{ticker}
# Returns info about the trained model
# ─────────────────────────────────────────
@app.get("/model/{ticker}")
def get_model_info(ticker: str, model_type: str = "random_forest"):
    ticker = ticker.upper()
    model_key = f"{ticker}_{model_type}"

    if model_key not in model_cache:
        return {"message": f"No model trained for {ticker} yet. Call /predict/{ticker} first."}

    model_data = model_cache[model_key]
    # ─────────────────────────────────────────
# SENTIMENT ENDPOINT
# GET /sentiment/{ticker}
# Returns news sentiment analysis
# ─────────────────────────────────────────
@app.get("/sentiment/{ticker}")
def get_sentiment(ticker: str):
    """
    Fetches recent news and analyzes sentiment using FinBERT
    First call downloads FinBERT (~500MB) — subsequent calls are fast
    """

    ticker = ticker.upper()
    cache_key = f"sentiment_{ticker}"

    # Check cache (sentiment cached for 30 mins)
    cached = get_cached(cache_key)
    if cached:
        return cached

    try:
        company_name = get_company_name(ticker)

        # Fetch news articles
        articles = fetch_news(ticker, company_name)

        if not articles:
            return {
                "ticker": ticker,
                "overall": "neutral",
                "score": 0,
                "message": "No recent news found",
                "articles": []
            }

        # Run sentiment analysis
        sentiment_data = analyze_sentiment(articles)
        sentiment_data["ticker"] = ticker
        sentiment_data["company"] = company_name
        sentiment_data["analyzed_at"] = datetime.now().isoformat()

        set_cache(cache_key, sentiment_data)
        return sentiment_data

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {
        "ticker": ticker,
        "model_type": model_data["model_type"],
        "mae": model_data["mae"],
        "r2": model_data["r2"],
        "trained_at": model_data["trained_at"],
    }
# ─────────────────────────────────────────
# SIGNALS ENDPOINT
# GET /signals/{ticker}
# Returns SMA, EMA, RSI trading signals
# ─────────────────────────────────────────
@app.get("/signals/{ticker}")
def get_signals(ticker: str):
    """
    Calculate trading signals for a stock
    Returns SMA cross, RSI, MACD signals
    """
    ticker = ticker.upper()
    cache_key = f"signals_{ticker}"

    cached = get_cached(cache_key)
    if cached:
        return cached

    try:
        result = generate_signals(ticker)
        set_cache(cache_key, result)
        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    # ─────────────────────────────────────────
# RISK ENDPOINT
# GET /risk/{ticker}
# ─────────────────────────────────────────
@app.get("/risk/{ticker}")
def get_risk(ticker: str):
    """
    Calculate risk metrics for a stock
    Returns volatility, sharpe, drawdown, VaR, beta
    """
    ticker    = ticker.upper()
    cache_key = f"risk_{ticker}"

    cached = get_cached(cache_key)
    if cached:
        return cached

    try:
        result = analyze_risk(ticker)
        set_cache(cache_key, result)
        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))