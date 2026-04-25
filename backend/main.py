# main.py
# This is the entry point of our FastAPI backend
# Think of this as the "App.jsx" but for Python

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# ─────────────────────────────────────────
# Initialize FastAPI app
# ─────────────────────────────────────────
app = FastAPI(
    title="QuantEdge API",
    description="AI-powered financial intelligence backend",
    version="1.0.0"
)

# ─────────────────────────────────────────
# CORS Middleware
# This allows our React frontend to talk to this backend
# Without this, the browser will block all requests
# ─────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────
# Simple in-memory cache
# Stores recent API responses so we don't
# fetch the same data multiple times
# ─────────────────────────────────────────
cache = {}
CACHE_DURATION = timedelta(minutes=15)


def get_cached(key):
    """Check if we have fresh cached data"""
    if key in cache:
        data, timestamp = cache[key]
        if datetime.now() - timestamp < CACHE_DURATION:
            return data
    return None


def set_cache(key, data):
    """Store data in cache with current timestamp"""
    cache[key] = (data, datetime.now())


# ─────────────────────────────────────────
# ROOT ENDPOINT
# ─────────────────────────────────────────
@app.get("/")
def root():
    return {
        "message": "Welcome to QuantEdge API",
        "version": "1.0.0",
        "status": "running"
    }


# ─────────────────────────────────────────
# STOCK ENDPOINT
# GET /stock/{ticker}
# Returns price history + current quote
# Example: /stock/AAPL
# ─────────────────────────────────────────
@app.get("/stock/{ticker}")
def get_stock(ticker: str, period: str = "3mo"):
    """
    Fetch stock data for a given ticker symbol
    - ticker: stock symbol (e.g. AAPL, MSFT)
    - period: time period (1mo, 3mo, 6mo, 1y, 2y)
    """

    ticker = ticker.upper()
    cache_key = f"stock_{ticker}_{period}"

    # Check cache first
    cached = get_cached(cache_key)
    if cached:
        print(f"Cache hit for {ticker}")
        return cached

    try:
        # Fetch data using yfinance
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period)
        info = stock.fast_info

        # Check if ticker is valid
        if hist.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No data found for ticker: {ticker}"
            )

        # Format price history for frontend chart
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

        # Build response object
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

        # Store in cache
        set_cache(cache_key, response)

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching stock data: {str(e)}"
        )


# ─────────────────────────────────────────
# PREDICT ENDPOINT
# GET /predict/{ticker}
# Returns simple price prediction
# (We'll upgrade this with ML in Phase 5)
# ─────────────────────────────────────────
@app.get("/predict/{ticker}")
def predict_stock(ticker: str):
    """
    Simple price prediction using moving averages
    Will be upgraded to ML model in Phase 5
    """

    ticker = ticker.upper()
    cache_key = f"predict_{ticker}"

    cached = get_cached(cache_key)
    if cached:
        return cached

    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="3mo")

        if hist.empty:
            raise HTTPException(status_code=404, detail=f"No data for {ticker}")

        closes = hist["Close"].values

        # Simple moving averages
        sma_7  = round(float(np.mean(closes[-7:])), 2)   # 7-day average
        sma_30 = round(float(np.mean(closes[-30:])), 2)  # 30-day average

        current_price = round(float(closes[-1]), 2)

        # Simple signal logic
        # If short-term average > long-term average = bullish trend
        if sma_7 > sma_30:
            signal = "BUY"
            confidence = round(((sma_7 - sma_30) / sma_30) * 100, 2)
        else:
            signal = "SELL"
            confidence = round(((sma_30 - sma_7) / sma_30) * 100, 2)

        # Naive next-day prediction (will improve in Phase 5)
        predicted_price = round(current_price * (1 + (sma_7 - sma_30) / sma_30 * 0.1), 2)

        response = {
            "ticker": ticker,
            "current_price": current_price,
            "predicted_price": predicted_price,
            "signal": signal,
            "confidence": min(confidence, 99.0),
            "sma_7": sma_7,
            "sma_30": sma_30,
            "note": "Simple SMA model — ML upgrade coming in Phase 5"
        }

        set_cache(cache_key, response)
        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction error: {str(e)}"
        )


# ─────────────────────────────────────────
# HEALTH CHECK ENDPOINT
# GET /health
# Used to verify backend is running
# ─────────────────────────────────────────
@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}