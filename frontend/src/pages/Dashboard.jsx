// Dashboard.jsx
// Main dashboard page — assembles all components together

import { useState } from 'react'
import StockSearch from '../components/StockSearch'
import StatCard from '../components/StatCard'
import PredictionCard from '../components/PredictionCard'
import SentimentCard from '../components/SentimentCard'

function Dashboard() {
  // Track which ticker is currently searched
  // so PredictionCard and SentimentCard know what to show
  const [activeTicker, setActiveTicker] = useState('')

  return (
    <main className="p-6 max-w-7xl mx-auto">

      {/* ── Page Header ── */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">
          Market Dashboard
        </h2>
        <p className="text-gray-400 mt-1">
          Real-time financial intelligence powered by AI
        </p>
      </div>

      {/* ── Stats Row — 4 cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Portfolio Value"
          value="$124,500"
          change="+2.4%"
          positive={true}
        />
        <StatCard
          title="Today's P&L"
          value="+$1,840"
          change="+1.5%"
          positive={true}
        />
        <StatCard
          title="Active Signals"
          value="7"
          change="3 Buy / 4 Sell"
          positive={false}
        />
        <StatCard
          title="Risk Score"
          value="Medium"
          change="Score: 54/100"
          positive={true}
        />
      </div>

      {/* ── Main Grid — Chart + AI Prediction ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Stock Search + Chart — takes 2/3 width */}
        <div className="lg:col-span-2">
          <StockSearch onTickerChange={setActiveTicker} />
        </div>

        {/* AI Prediction Panel — takes 1/3 width */}
        <div className="lg:col-span-1">
          <PredictionCard ticker={activeTicker} />
        </div>

      </div>

      {/* ── Bottom Row — Sentiment + Trading Signals ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Sentiment Card — 1/3 width */}
        <div className="lg:col-span-1">
          <SentimentCard ticker={activeTicker} />
        </div>

        {/* Trading Signals placeholder — 2/3 width */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">
            📊 Trading Signals
          </h3>
          <div className="h-32 flex items-center justify-center border border-dashed border-gray-700 rounded-lg">
            <p className="text-gray-500 text-sm">
              SMA / RSI signals coming in Phase 7
            </p>
          </div>
        </div>

      </div>

    </main>
  )
}

export default Dashboard