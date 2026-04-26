// TradingSignals.jsx
// Displays SMA, RSI, MACD trading signals
import { useState, useEffect } from 'react'
import axios from 'axios'

const BASE_URL = 'http://127.0.0.1:8000'

function TradingSignals({ ticker }) {
  const [signals, setSignals] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (!ticker) return
    fetchSignals()
  }, [ticker])

  const fetchSignals = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.get(`${BASE_URL}/signals/${ticker}`)
      setSignals(response.data)
    } catch (err) {
      setError('Could not load signals')
    } finally {
      setLoading(false)
    }
  }

  const getSignalColor = (s) => {
    if (s === 'BUY')     return 'text-green-400'
    if (s === 'SELL')    return 'text-red-400'
    return 'text-yellow-400'
  }

  const getSignalBg = (s) => {
    if (s === 'BUY')     return 'bg-green-900/20 border-green-800'
    if (s === 'SELL')    return 'bg-red-900/20 border-red-800'
    return 'bg-yellow-900/20 border-yellow-800'
  }

  const getStrengthColor = (s) => {
    if (s === 'Strong')  return 'text-green-400'
    if (s === 'Medium')  return 'text-yellow-400'
    return 'text-gray-400'
  }

  if (!ticker) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Trading Signals</h3>
        <div className="h-32 flex items-center justify-center border border-dashed border-gray-700 rounded-lg">
          <p className="text-gray-500 text-sm">Search a stock to see signals</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Trading Signals</h3>
        <span className="text-blue-400 text-xs bg-blue-900/30 px-2 py-1 rounded-full">
          SMA / RSI / MACD
        </span>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm ml-3">Calculating signals...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {signals && !loading && (
        <div className="space-y-4">

          {/* Overall signal */}
          <div className={`border rounded-xl p-4 text-center ${getSignalBg(signals.overall)}`}>
            <p className="text-gray-400 text-xs mb-1">Overall Signal</p>
            <p className={`text-2xl font-bold ${getSignalColor(signals.overall)}`}>
              {signals.overall}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {signals.buy_count} Buy / {signals.sell_count} Sell signals
            </p>
          </div>

          {/* Indicators row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs mb-1">RSI</p>
              <p className={`font-bold text-sm ${
                signals.indicators?.rsi > 70
                  ? 'text-red-400'
                  : signals.indicators?.rsi < 30
                  ? 'text-green-400'
                  : 'text-white'
              }`}>
                {signals.indicators?.rsi}
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs mb-1">SMA20</p>
              <p className="text-white font-bold text-sm">
                ${signals.indicators?.sma20}
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs mb-1">SMA50</p>
              <p className="text-white font-bold text-sm">
                ${signals.indicators?.sma50}
              </p>
            </div>
          </div>

          {/* Individual signals list */}
          <div className="space-y-2">
            <p className="text-gray-400 text-xs font-medium">Signal Breakdown</p>
            {signals.signals?.map((signal, i) => (
              <div
                key={i}
                className="bg-gray-800 rounded-lg p-3 flex items-start justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-xs font-semibold">
                      {signal.name}
                    </span>
                    <span className={`text-xs ${getStrengthColor(signal.strength)}`}>
                      {signal.strength}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {signal.reason}
                  </p>
                </div>
                <span className={`text-xs font-bold shrink-0 px-2 py-1 rounded-full border ${getSignalBg(signal.signal)} ${getSignalColor(signal.signal)}`}>
                  {signal.signal}
                </span>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  )
}

export default TradingSignals