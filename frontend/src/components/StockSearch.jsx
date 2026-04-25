// StockSearch.jsx
// Now connects to real Alpha Vantage API

import { useState } from 'react'
import { fetchStockHistory, fetchStockQuote } from '../utils/stockService'
import PriceChart from './PriceChart'
import StockInfo from './StockInfo'

function StockSearch({ onTickerChange }) {
  const [ticker, setTicker] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [chartData, setChartData] = useState(null)
  const [quote, setQuote] = useState(null)
  const [activePeriod, setActivePeriod] = useState('1M')

  const handleSearch = async () => {
    if (ticker.trim() === '') return

    setLoading(true)
    setError('')
    setChartData(null)
    setQuote(null)
    onTickerChange(ticker.toUpperCase())

    try {
      // Fetch both at the same time (faster!)
      const [history, quoteData] = await Promise.all([
        fetchStockHistory(ticker.toUpperCase()),
        fetchStockQuote(ticker.toUpperCase()),
      ])

      setChartData(history)
      setQuote(quoteData)

    } catch (err) {
      setError('Could not fetch data. Check ticker or API limit.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  // Filter data based on selected period
  const getFilteredData = () => {
    if (!chartData) return []
    const periodMap = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }
    const days = periodMap[activePeriod] || 30
    return chartData.slice(-days)
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">

      {/* Search Bar */}
      <h3 className="text-white font-semibold mb-4">🔍 Search Stock</h3>
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter ticker symbol (e.g. AAPL, TSLA, MSFT)"
          className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-lg text-sm transition-colors"
        >
          {loading ? 'Loading...' : 'Search'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">⚠️ {error}</p>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-400 ml-3 text-sm">Fetching market data...</span>
        </div>
      )}

      {/* Stock Info + Chart */}
      {quote && chartData && !loading && (
        <>
          {/* Stock header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white text-xl font-bold">{quote.ticker}</h2>
              <p className="text-gray-400 text-sm">NYSE / NASDAQ</p>
            </div>
            {/* Period selector */}
            <div className="flex gap-2">
              {['1W', '1M', '3M', '6M', '1Y'].map((period) => (
                <button
                  key={period}
                  onClick={() => setActivePeriod(period)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    activePeriod === period
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* Quote cards */}
          <StockInfo quote={quote} />

          {/* Price chart */}
          <PriceChart data={getFilteredData()} ticker={quote.ticker} />
        </>
      )}

    </div>
  )
}

export default StockSearch