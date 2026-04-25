// StockSearch.jsx
import { useState } from 'react'
import axios from 'axios'
import PriceChart from './PriceChart'
import StockInfo from './StockInfo'

const BASE_URL = 'http://127.0.0.1:8000'

function StockSearch({ onTickerChange }) {
  const [ticker, setTicker]       = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [chartData, setChartData] = useState(null)
  const [quote, setQuote]         = useState(null)
  const [activePeriod, setActivePeriod] = useState('3M')

  const handleSearch = async () => {
    if (ticker.trim() === '') return

    setLoading(true)
    setError('')
    setChartData(null)
    setQuote(null)

    try {
      const response = await axios.get(
  `${BASE_URL}/stock/${ticker.toUpperCase()}`,
  { params: { period: '1y' } }  // ← fetch 1 year always
)
      const data = response.data

      // Set quote info
      setQuote({
        ticker: data.ticker,
        price: data.price.toFixed(2),
        change: data.change.toFixed(2),
        changePercent: `${data.changePercent}%`,
        volume: data.volume.toLocaleString(),
        high: data.high.toFixed(2),
        low: data.low.toFixed(2),
      })

      // Set chart data
      setChartData(data.history)

      // Tell Dashboard which ticker is active
      if (onTickerChange) onTickerChange(ticker.toUpperCase())

    } catch (err) {
      setError('Could not fetch data. Check ticker symbol.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  // Filter chart data by selected period
  // Filter chart data by selected period
const getFilteredData = () => {
  if (!chartData) return []
  const periodMap = { 
    '1W': 7, 
    '1M': 30, 
    '3M': 90, 
    '6M': 180, 
    '1Y': 365 
  }
  const days = periodMap[activePeriod] || 90
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

      {/* Error */}
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
          {/* Header row */}
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