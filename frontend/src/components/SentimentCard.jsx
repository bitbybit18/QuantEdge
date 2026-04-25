import { useState, useEffect } from 'react'
import axios from 'axios'

const BASE_URL = 'http://127.0.0.1:8000'

function SentimentCard({ ticker }) {
  const [sentiment, setSentiment] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!ticker) return
    fetchSentiment()
  }, [ticker])

  const fetchSentiment = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.get(`${BASE_URL}/sentiment/${ticker}`)
      setSentiment(response.data)
    } catch (err) {
      setError('Could not load sentiment data')
    } finally {
      setLoading(false)
    }
  }

  const getColor = (s) => {
    if (s === 'positive') return 'text-green-400'
    if (s === 'negative') return 'text-red-400'
    return 'text-yellow-400'
  }

  const getBg = (s) => {
    if (s === 'positive') return 'bg-green-900/20 border-green-700'
    if (s === 'negative') return 'bg-red-900/20 border-red-700'
    return 'bg-yellow-900/20 border-yellow-700'
  }

  if (!ticker) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">News Sentiment</h3>
        <div className="h-32 flex items-center justify-center border border-dashed border-gray-700 rounded-lg">
          <p className="text-gray-500 text-sm">Search a stock to see sentiment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">News Sentiment</h3>
        <span className="text-purple-400 text-xs bg-purple-900/30 px-2 py-1 rounded-full">
          FinBERT AI
        </span>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center h-32 gap-3">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm">Analyzing sentiment...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {sentiment && !loading && (
        <div className="space-y-4">
          <div className={`border rounded-xl p-4 text-center ${getBg(sentiment.overall)}`}>
            <p className={`text-2xl font-bold uppercase ${getColor(sentiment.overall)}`}>
              {sentiment.overall}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Based on {sentiment.total_articles} articles
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-900/20 rounded-lg p-2 text-center">
              <p className="text-green-400 font-bold">{sentiment.breakdown?.positive}</p>
              <p className="text-gray-500 text-xs">Positive</p>
            </div>
            <div className="bg-yellow-900/20 rounded-lg p-2 text-center">
              <p className="text-yellow-400 font-bold">{sentiment.breakdown?.neutral}</p>
              <p className="text-gray-500 text-xs">Neutral</p>
            </div>
            <div className="bg-red-900/20 rounded-lg p-2 text-center">
              <p className="text-red-400 font-bold">{sentiment.breakdown?.negative}</p>
              <p className="text-gray-500 text-xs">Negative</p>
            </div>
          </div>

          <div>
            <p className="text-gray-400 text-xs font-medium mb-2">Recent News</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sentiment.articles?.slice(0, 5).map((article, i) => (
                <div
                  key={i}
                  className="bg-gray-800 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white text-xs leading-relaxed">
                      {article.title}
                    </p>
                    <span className={`text-xs font-bold shrink-0 ${getColor(article.sentiment)}`}>
                      {article.sentiment === 'positive' ? 'POS' : article.sentiment === 'negative' ? 'NEG' : 'NEU'}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">{article.source}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SentimentCard