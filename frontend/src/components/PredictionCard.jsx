// PredictionCard.jsx
// Displays AI prediction results in a clean card
// Shows predicted price, signal, and model accuracy

import { useState, useEffect } from 'react'
import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

function PredictionCard({ ticker }) {
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    // Fetch prediction whenever ticker changes
    if (!ticker) return
    fetchPrediction()
  }, [ticker])

  const fetchPrediction = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.get(`${BASE_URL}/predict/${ticker}`)
      setPrediction(response.data)
    } catch (err) {
      setError('Could not load prediction')
    } finally {
      setLoading(false)
    }
  }

  // Color based on signal
  const getSignalColor = (signal) => {
    if (!signal) return 'text-gray-400'
    if (signal.includes('BUY'))  return 'text-green-400'
    if (signal.includes('SELL')) return 'text-red-400'
    return 'text-yellow-400'
  }

  const getSignalBg = (signal) => {
    if (!signal) return 'bg-gray-800'
    if (signal.includes('BUY'))  return 'bg-green-900/30 border-green-700'
    if (signal.includes('SELL')) return 'bg-red-900/30 border-red-700'
    return 'bg-yellow-900/30 border-yellow-700'
  }

  // No ticker selected yet
  if (!ticker) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">🤖 AI Prediction</h3>
        <div className="h-48 flex items-center justify-center border border-dashed border-gray-700 rounded-lg">
          <p className="text-gray-500 text-sm text-center">
            Search a stock to see AI prediction
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">🤖 AI Prediction</h3>
        <span className="text-blue-400 text-xs font-medium bg-blue-900/30 px-2 py-1 rounded-full">
          Random Forest
        </span>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm text-center">
            Training AI model for {ticker}...<br/>
            <span className="text-xs text-gray-500">First load takes ~15 seconds</span>
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
          <p className="text-red-400 text-sm">⚠️ {error}</p>
        </div>
      )}

      {/* Prediction results */}
      {prediction && !loading && (
        <div className="space-y-4">

          {/* Signal badge */}
          <div className={`border rounded-xl p-4 text-center ${getSignalBg(prediction.signal)}`}>
            <p className="text-gray-400 text-xs mb-1">AI Signal</p>
            <p className={`text-2xl font-bold ${getSignalColor(prediction.signal)}`}>
              {prediction.signal}
            </p>
          </div>

          {/* Price prediction */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">Current Price</p>
              <p className="text-white font-bold">${prediction.current_price}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">Predicted Price</p>
              <p className="text-white font-bold">${prediction.predicted_price}</p>
            </div>
          </div>

          {/* Predicted change */}
          <div className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
            <p className="text-gray-400 text-xs">Predicted Change</p>
            <p className={`font-bold text-sm ${prediction.predicted_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {prediction.predicted_change >= 0 ? '+' : ''}
              ${prediction.predicted_change} ({prediction.predicted_change_pct}%)
            </p>
          </div>

          {/* Model accuracy */}
          <div className="border border-gray-700 rounded-lg p-3">
            <p className="text-gray-400 text-xs font-medium mb-2">
              📊 Model Accuracy
            </p>
            <div className="flex justify-between text-xs">
              <div>
                <p className="text-gray-500">Mean Abs. Error</p>
                <p className="text-white font-semibold">
                  ${prediction.model_accuracy?.mae}
                </p>
              </div>
              <div>
                <p className="text-gray-500">R² Score</p>
                <p className="text-white font-semibold">
                  {prediction.model_accuracy?.r2}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Model</p>
                <p className="text-white font-semibold capitalize">
                  {prediction.model_type?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-gray-600 text-xs text-center">
            ⚠️ For educational purposes only. Not financial advice.
          </p>

        </div>
      )}
    </div>
  )
}

export default PredictionCard