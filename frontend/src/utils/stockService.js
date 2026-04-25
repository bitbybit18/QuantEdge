// stockService.js
import axios from 'axios'

const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY
const BASE_URL = 'https://www.alphavantage.co/query'

export async function fetchStockHistory(ticker) {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol: ticker,
        outputsize: 'compact',
        apikey: API_KEY,
      }
    })

    // ✅ Check for API limit message
    if (response.data['Information']) {
      throw new Error('API_LIMIT')
    }

    // ✅ Check for invalid ticker
    if (response.data['Error Message']) {
      throw new Error('INVALID_TICKER')
    }

    const timeSeries = response.data['Time Series (Daily)']
    if (!timeSeries) {
      throw new Error('NO_DATA')
    }

    const formatted = Object.entries(timeSeries)
      .map(([date, values]) => ({
        date,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume']),
      }))
      .reverse()

    return formatted

  } catch (error) {
    throw error
  }
}

export async function fetchStockQuote(ticker) {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: ticker,
        apikey: API_KEY,
      }
    })

    // ✅ Check for API limit message
    if (response.data['Information']) {
      throw new Error('API_LIMIT')
    }

    // ✅ Check for invalid ticker
    if (response.data['Error Message']) {
      throw new Error('INVALID_TICKER')
    }

    const quote = response.data['Global Quote']
    if (!quote || !quote['05. price']) {
      throw new Error('NO_DATA')
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
    throw error
  }
}