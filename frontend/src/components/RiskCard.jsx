// RiskCard.jsx
// Displays risk analysis metrics
import { useState, useEffect } from 'react'
import axios from 'axios'

const BASE_URL = 'http://127.0.0.1:8000'

function RiskCard({ ticker }) {
  const [risk, setRisk]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (!ticker) return
    fetchRisk()
  }, [ticker])

  const fetchRisk = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.get(`${BASE_URL}/risk/${ticker}`)
      setRisk(response.data)
    } catch (err) {
      setError('Could not load risk data')
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (label) => {
    if (label === 'Low')       return 'text-green-400'
    if (label === 'Medium')    return 'text-yellow-400'
    if (label === 'High')      return 'text-orange-400'
    return 'text-red-400'
  }

  const getRiskBg = (label) => {
    if (label === 'Low')       return 'bg-green-900/20 border-green-800'
    if (label === 'Medium')    return 'bg-yellow-900/20 border-yellow-800'
    if (label === 'High')      return 'bg-orange-900/20 border-orange-800'
    return 'bg-red-900/20 border-red-800'
  }

  const getScoreWidth = (score) => `${score}%`

  const getBarColor = (score) => {
    if (score < 25) return 'bg-green-500'
    if (score < 50) return 'bg-yellow-500'
    if (score < 75) return 'bg-orange-500'
    return 'bg-red-500'
  }

  if (!ticker) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">Risk Analysis</h3>
        <div className="h-32 flex items-center justify-center border border-dashed border-gray-700 rounded-lg">
          <p className="text-gray-500 text-sm">Search a stock to see risk analysis</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Risk Analysis</h3>
        <span className="text-orange-400 text-xs bg-orange-900/30 px-2 py-1 rounded-full">
          Quant Metrics
        </span>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm ml-3">Calculating risk...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {risk && !loading && (
        <div className="space-y-4">

          {/* Risk score gauge */}
          <div className={`border rounded-xl p-4 ${getRiskBg(risk.risk_label)}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-xs">Risk Score</p>
              <p className={`text-sm font-bold ${getRiskColor(risk.risk_label)}`}>
                {risk.risk_label}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${getBarColor(risk.risk_score)}`}
                  style={{ width: getScoreWidth(risk.risk_score) }}
                />
              </div>
              <span className={`text-lg font-bold ${getRiskColor(risk.risk_label)}`}>
                {risk.risk_score}/100
              </span>
            </div>
          </div>

          {/* Annual return */}
          <div className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
            <p className="text-gray-400 text-xs">1Y Return</p>
            <p className={`font-bold text-sm ${risk.annual_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {risk.annual_return >= 0 ? '+' : ''}{risk.annual_return}%
            </p>
          </div>

          {/* Metrics grid */}
          <div className="space-y-2">
            <p className="text-gray-400 text-xs font-medium">Key Metrics</p>
            {Object.entries(risk.metrics || {}).map(([key, metric]) => (
              <div key={key} className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-gray-400 text-xs capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-white text-sm font-bold">
                    {metric.value}{metric.unit}
                  </p>
                </div>
                <p className="text-gray-500 text-xs">{metric.description}</p>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  )
}

export default RiskCard