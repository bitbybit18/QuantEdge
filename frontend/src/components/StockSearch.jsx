// StockSearch.jsx
// Lets the user type a stock ticker (e.g. AAPL, TSLA)
// and fetch its data

import { useState } from 'react'

function StockSearch() {
  // State = data that can change and re-renders the UI
  const [ticker, setTicker] = useState('')        // what user types
  const [submitted, setSubmitted] = useState('')  // what was searched

  // Called when user clicks Search
  const handleSearch = () => {
    if (ticker.trim() === '') return
    setSubmitted(ticker.toUpperCase())
    // We'll connect this to real API in Phase 3
  }

  // Allow pressing Enter to search
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">

      <h3 className="text-white font-semibold mb-4">
        🔍 Search Stock
      </h3>

      {/* Search input row */}
      <div className="flex gap-3">
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
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-lg text-sm transition-colors"
        >
          Search
        </button>
      </div>

      {/* Show what was searched */}
      {submitted && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-gray-400 text-sm">Showing data for:</span>
          <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
            {submitted}
          </span>
        </div>
      )}

    </div>
  )
}

export default StockSearch