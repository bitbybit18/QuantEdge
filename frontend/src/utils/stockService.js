// stockService.js
// All stock data fetching logic lives here
// This is the "service layer" pattern used in production apps

import axios from 'axios'

const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY
const BASE_URL = 'https://www.alphavantage.co/query'

// ─────────────────────────────────────────
// Fetch daily price history for a stock
// Returns array of { date, open, high, low, close, volume }
// ─────────────────────────────────────────
export async function fetchStockHistory(ticker) {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol: ticker,
        outputsize: 'compact',  // last 100 days
        apikey: API_KEY,
      }
    })

    const timeSeries = response.data['Time Series (Daily)']

    if (!timeSeries) {
      throw new Error('Invalid ticker or API limit reached')
    }

    // Convert the object into a sorted array
    const formatted = Object.entries(timeSeries)
      .map(([date, values]) => ({
        date,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume']),
      }))
      .reverse() // oldest to newest for chart

    return formatted

  } catch (error) {
    console.error('Error fetching stock history:', error)
    throw error
  }
}

// ─────────────────────────────────────────
// Fetch current quote for a stock
// Returns { price, change, changePercent, volume }
// ─────────────────────────────────────────
export async function fetchStockQuote(ticker) {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: ticker,
        apikey: API_KEY,
      }
    })

    const quote = response.data['Global Quote']

    if (!quote || !quote['05. price']) {
      throw new Error('Invalid ticker or API limit reached')
    }

    return {
      ticker: quote['01. symbol'],
      price: parseFloat(quote['05. price']).toFixed(2),
      change: parseFloat(quote['09. change']).toFixed(2),
      changePercent: quote['10. change percent'],
      volume: parseInt(quote['06. volume']).toLocaleString(),
      high: parseFloat(quote['03. high']).toFixed(2),
      low: parseFloat(quote['04. low']).toFixed(2),
    }

  } catch (error) {
    console.error('Error fetching stock quote:', error)
    throw error
  }
}