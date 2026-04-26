# risk.py
# Risk analysis calculator
# Implements professional-grade risk metrics

import numpy as np
import pandas as pd
import yfinance as yf
from datetime import datetime


# ─────────────────────────────────────────
# VOLATILITY
# ─────────────────────────────────────────
def calculate_volatility(returns, annualize=True):
    """
    Standard deviation of daily returns
    Annualized by multiplying by sqrt(252)
    252 = trading days in a year
    """
    daily_vol = np.std(returns)
    if annualize:
        return daily_vol * np.sqrt(252)
    return daily_vol


# ─────────────────────────────────────────
# SHARPE RATIO
# ─────────────────────────────────────────
def calculate_sharpe(returns, risk_free_rate=0.05):
    """
    Sharpe Ratio = (Return - Risk Free Rate) / Volatility
    Risk free rate default = 5% (current US treasury rate)
    Higher is better
    """
    annual_return = np.mean(returns) * 252
    annual_vol    = calculate_volatility(returns)

    if annual_vol == 0:
        return 0

    sharpe = (annual_return - risk_free_rate) / annual_vol
    return round(float(sharpe), 3)


# ─────────────────────────────────────────
# MAXIMUM DRAWDOWN
# ─────────────────────────────────────────
def calculate_max_drawdown(prices):
    """
    Largest peak-to-trough decline
    Measures worst case historical loss
    """
    prices     = np.array(prices)
    peak       = np.maximum.accumulate(prices)
    drawdown   = (prices - peak) / peak
    max_dd     = np.min(drawdown)
    return round(float(max_dd * 100), 2)  # return as percentage


# ─────────────────────────────────────────
# VALUE AT RISK (VaR)
# ─────────────────────────────────────────
def calculate_var(returns, confidence=0.95):
    """
    Value at Risk at given confidence level
    "With 95% confidence, daily loss won't exceed X%"
    """
    var = np.percentile(returns, (1 - confidence) * 100)
    return round(float(var * 100), 2)  # as percentage


# ─────────────────────────────────────────
# BETA
# ─────────────────────────────────────────
def calculate_beta(stock_returns, market_returns):
    """
    Beta = Covariance(stock, market) / Variance(market)
    Measures sensitivity to market movements
    """
    if len(stock_returns) != len(market_returns):
        min_len = min(len(stock_returns), len(market_returns))
        stock_returns  = stock_returns[-min_len:]
        market_returns = market_returns[-min_len:]

    covariance = np.cov(stock_returns, market_returns)[0][1]
    variance   = np.var(market_returns)

    if variance == 0:
        return 1.0

    beta = covariance / variance
    return round(float(beta), 3)


# ─────────────────────────────────────────
# RISK SCORE (0-100)
# Combines all metrics into one score
# ─────────────────────────────────────────
def calculate_risk_score(volatility, sharpe, max_drawdown, beta, var):
    """
    Composite risk score from 0-100
    0  = extremely safe
    100 = extremely risky
    """
    score = 0

    # Volatility contribution (0-40 points)
    if volatility < 0.15:
        score += 10
    elif volatility < 0.25:
        score += 20
    elif volatility < 0.40:
        score += 30
    else:
        score += 40

    # Sharpe contribution (0-20 points)
    if sharpe > 2.0:
        score += 5
    elif sharpe > 1.0:
        score += 10
    elif sharpe > 0:
        score += 15
    else:
        score += 20

    # Max drawdown contribution (0-20 points)
    if max_drawdown > -10:
        score += 5
    elif max_drawdown > -20:
        score += 10
    elif max_drawdown > -35:
        score += 15
    else:
        score += 20

    # Beta contribution (0-20 points)
    if beta < 0.5:
        score += 5
    elif beta < 1.0:
        score += 10
    elif beta < 1.5:
        score += 15
    else:
        score += 20

    return min(score, 100)


def get_risk_label(score):
    if score < 25:
        return "Low"
    elif score < 50:
        return "Medium"
    elif score < 75:
        return "High"
    else:
        return "Very High"


# ─────────────────────────────────────────
# MAIN FUNCTION
# ─────────────────────────────────────────
def analyze_risk(ticker: str):
    """
    Downloads stock data and calculates all risk metrics
    Also downloads SPY (S&P 500) for beta calculation
    """

    # Download 1 year of stock data
    stock = yf.Ticker(ticker)
    hist  = stock.history(period="1y")

    if hist.empty or len(hist) < 30:
        raise ValueError(f"Not enough data for {ticker}")

    # Download S&P 500 for beta calculation
    spy  = yf.Ticker("SPY")
    spy_hist = spy.history(period="1y")

    # Calculate daily returns
    closes         = hist["Close"].values
    stock_returns  = np.diff(closes) / closes[:-1]  # % daily change
    spy_returns    = np.diff(spy_hist["Close"].values) / spy_hist["Close"].values[:-1]

    # Calculate all metrics
    volatility   = calculate_volatility(stock_returns)
    sharpe       = calculate_sharpe(stock_returns)
    max_drawdown = calculate_max_drawdown(closes)
    var_95       = calculate_var(stock_returns, 0.95)
    beta         = calculate_beta(stock_returns, spy_returns)
    risk_score   = calculate_risk_score(volatility, sharpe, max_drawdown, beta, var_95)
    risk_label   = get_risk_label(risk_score)

    # Annual return
    annual_return = round(float(((closes[-1] - closes[0]) / closes[0]) * 100), 2)

    return {
        "ticker":        ticker,
        "risk_score":    risk_score,
        "risk_label":    risk_label,
        "annual_return": annual_return,
        "metrics": {
            "volatility": {
                "value":       round(float(volatility * 100), 2),
                "unit":        "%",
                "description": "Annualized price volatility",
            },
            "sharpe_ratio": {
                "value":       sharpe,
                "unit":        "",
                "description": "Return per unit of risk",
            },
            "max_drawdown": {
                "value":       max_drawdown,
                "unit":        "%",
                "description": "Worst historical peak-to-trough loss",
            },
            "var_95": {
                "value":       var_95,
                "unit":        "%",
                "description": "95% daily Value at Risk",
            },
            "beta": {
                "value":       beta,
                "unit":        "",
                "description": "Sensitivity vs S&P 500",
            },
        },
        "analyzed_at": datetime.now().isoformat(),
    }