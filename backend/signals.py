# signals.py
# Trading signals calculator
# Implements SMA, EMA, RSI — industry standard indicators

import numpy as np
import pandas as pd
import yfinance as yf


# ─────────────────────────────────────────
# SMA — Simple Moving Average
# ─────────────────────────────────────────
def calculate_sma(prices, window):
    """
    Simple Moving Average
    Sum of last N prices divided by N
    """
    return pd.Series(prices).rolling(window=window).mean().values


# ─────────────────────────────────────────
# EMA — Exponential Moving Average
# ─────────────────────────────────────────
def calculate_ema(prices, window):
    """
    Exponential Moving Average
    Recent prices weighted more heavily
    """
    return pd.Series(prices).ewm(span=window, adjust=False).mean().values


# ─────────────────────────────────────────
# RSI — Relative Strength Index
# ─────────────────────────────────────────
def calculate_rsi(prices, window=14):
    """
    RSI measures momentum
    Above 70 = overbought (likely to fall)
    Below 30 = oversold (likely to rise)
    """
    prices = pd.Series(prices)

    # Calculate daily price changes
    delta = prices.diff()

    # Separate gains and losses
    gains  = delta.where(delta > 0, 0)
    losses = -delta.where(delta < 0, 0)

    # Calculate average gains and losses
    avg_gain = gains.rolling(window=window).mean()
    avg_loss = losses.rolling(window=window).mean()

    # Calculate RS and RSI
    rs  = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))

    return rsi.values


# ─────────────────────────────────────────
# MACD — Moving Average Convergence Divergence
# Bonus indicator used by professionals
# ─────────────────────────────────────────
def calculate_macd(prices):
    """
    MACD = EMA(12) - EMA(26)
    Signal line = EMA(9) of MACD
    When MACD crosses above signal → BUY
    When MACD crosses below signal → SELL
    """
    prices  = pd.Series(prices)
    ema12   = prices.ewm(span=12, adjust=False).mean()
    ema26   = prices.ewm(span=26, adjust=False).mean()
    macd    = ema12 - ema26
    signal  = macd.ewm(span=9, adjust=False).mean()
    hist    = macd - signal

    return macd.values, signal.values, hist.values


# ─────────────────────────────────────────
# GENERATE ALL SIGNALS
# Main function called by the API endpoint
# ─────────────────────────────────────────
def generate_signals(ticker: str):
    """
    Downloads stock data and calculates all trading signals
    Returns current values + buy/sell recommendations
    """

    # Download 6 months of data
    stock = yf.Ticker(ticker)
    hist  = stock.history(period="6mo")

    if hist.empty or len(hist) < 30:
        raise ValueError(f"Not enough data for {ticker}")

    closes  = hist["Close"].values
    volumes = hist["Volume"].values
    dates   = [d.strftime("%Y-%m-%d") for d in hist.index]

    # ── Calculate indicators ──
    sma7   = calculate_sma(closes, 7)
    sma20  = calculate_sma(closes, 20)
    sma50  = calculate_sma(closes, 50)
    ema12  = calculate_ema(closes, 12)
    ema26  = calculate_ema(closes, 26)
    rsi    = calculate_rsi(closes, 14)
    macd_line, signal_line, macd_hist = calculate_macd(closes)

    # ── Get current values (last row) ──
    current_price  = round(float(closes[-1]), 2)
    current_sma7   = round(float(sma7[-1]), 2)   if not np.isnan(sma7[-1])  else None
    current_sma20  = round(float(sma20[-1]), 2)  if not np.isnan(sma20[-1]) else None
    current_sma50  = round(float(sma50[-1]), 2)  if not np.isnan(sma50[-1]) else None
    current_rsi    = round(float(rsi[-1]), 2)    if not np.isnan(rsi[-1])   else None
    current_macd   = round(float(macd_line[-1]), 4) if not np.isnan(macd_line[-1]) else None
    current_signal = round(float(signal_line[-1]), 4) if not np.isnan(signal_line[-1]) else None

    # ── Generate signals ──
    signals = []

    # SMA Golden/Death Cross
    if current_sma7 and current_sma20:
        if current_sma7 > current_sma20:
            signals.append({
                "name": "SMA Cross",
                "signal": "BUY",
                "reason": f"SMA7 (${current_sma7}) above SMA20 (${current_sma20}) — Golden Cross",
                "strength": "Medium",
            })
        else:
            signals.append({
                "name": "SMA Cross",
                "signal": "SELL",
                "reason": f"SMA7 (${current_sma7}) below SMA20 (${current_sma20}) — Death Cross",
                "strength": "Medium",
            })

    # RSI Signal
    if current_rsi:
        if current_rsi < 30:
            signals.append({
                "name": "RSI",
                "signal": "BUY",
                "reason": f"RSI at {current_rsi} — Oversold territory",
                "strength": "Strong",
            })
        elif current_rsi > 70:
            signals.append({
                "name": "RSI",
                "signal": "SELL",
                "reason": f"RSI at {current_rsi} — Overbought territory",
                "strength": "Strong",
            })
        else:
            signals.append({
                "name": "RSI",
                "signal": "NEUTRAL",
                "reason": f"RSI at {current_rsi} — Neutral zone (30-70)",
                "strength": "Weak",
            })

    # MACD Signal
    if current_macd and current_signal:
        if current_macd > current_signal:
            signals.append({
                "name": "MACD",
                "signal": "BUY",
                "reason": f"MACD ({current_macd}) above signal ({current_signal})",
                "strength": "Medium",
            })
        else:
            signals.append({
                "name": "MACD",
                "signal": "SELL",
                "reason": f"MACD ({current_macd}) below signal ({current_signal})",
                "strength": "Medium",
            })

    # Price vs SMA50
    if current_sma50:
        if current_price > current_sma50:
            signals.append({
                "name": "Price vs SMA50",
                "signal": "BUY",
                "reason": f"Price (${current_price}) above SMA50 (${current_sma50}) — Bullish",
                "strength": "Medium",
            })
        else:
            signals.append({
                "name": "Price vs SMA50",
                "signal": "SELL",
                "reason": f"Price (${current_price}) below SMA50 (${current_sma50}) — Bearish",
                "strength": "Medium",
            })

    # ── Overall recommendation ──
    buy_count  = sum(1 for s in signals if s["signal"] == "BUY")
    sell_count = sum(1 for s in signals if s["signal"] == "SELL")

    if buy_count > sell_count:
        overall = "BUY"
    elif sell_count > buy_count:
        overall = "SELL"
    else:
        overall = "NEUTRAL"

    # ── Chart data (last 60 days) ──
    chart_data = []
    for i in range(max(0, len(dates) - 60), len(dates)):
        chart_data.append({
            "date":   dates[i],
            "close":  round(float(closes[i]), 2),
            "sma7":   round(float(sma7[i]), 2)  if not np.isnan(sma7[i])  else None,
            "sma20":  round(float(sma20[i]), 2) if not np.isnan(sma20[i]) else None,
            "sma50":  round(float(sma50[i]), 2) if not np.isnan(sma50[i]) else None,
            "rsi":    round(float(rsi[i]), 2)   if not np.isnan(rsi[i])   else None,
            "volume": int(volumes[i]),
        })

    return {
        "ticker":        ticker,
        "current_price": current_price,
        "overall":       overall,
        "buy_count":     buy_count,
        "sell_count":    sell_count,
        "indicators": {
            "sma7":   current_sma7,
            "sma20":  current_sma20,
            "sma50":  current_sma50,
            "rsi":    current_rsi,
            "macd":   current_macd,
        },
        "signals":    signals,
        "chart_data": chart_data,
    }