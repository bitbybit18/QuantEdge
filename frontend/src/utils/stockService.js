// stockService.js
// Now points to our own FastAPI backend instead of Alpha Vantage directly
// This is more secure, faster (cached), and ready for ML

import axios from 'axios'

// Our backend URL
const BASE_URL = 'http://localhost:8000'

// ─────────────────────────────────────────
// Fetch stock history + quote from our backend
// ─────────────────────────────────────────
export async function fetchStockHistory(ticker, period = '3mo') {
  try {
    const response = await axios.get(`${BASE_URL}/stock/${ticker}`, {
      params: { period }
    })
    // Backend returns history array directly
    return response.data.history

  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('INVALID_TICKER')
    }
    throw new Error('FETCH_ERROR')
  }
}

export async function fetchStockQuote(ticker) {
  try {
    const response = await axios.get(`${BASE_URL}/stock/${ticker}`)
    const data = response.data

    return {
      ticker: data.ticker,
      price: data.price.toFixed(2),
      change: data.change.toFixed(2),
      changePercent: `${data.changePercent}%`,
      volume: data.volume.toLocaleString(),
      high: data.high.toFixed(2),
      low: data.low.toFixed(2),
    }

  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('INVALID_TICKER')
    }
    throw new Error('FETCH_ERROR')
  }
}

// ─────────────────────────────────────────
// Fetch AI prediction from our backend
// ─────────────────────────────────────────
export async function fetchPrediction(ticker) {
  try {
    const response = await axios.get(`${BASE_URL}/predict/${ticker}`)
    return response.data
  } catch (error) {
    throw new Error('PREDICTION_ERROR')
  }
}