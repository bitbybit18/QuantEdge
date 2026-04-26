import { useState } from 'react'
import StockSearch from '../components/StockSearch'
import StatCard from '../components/StatCard'
import PredictionCard from '../components/PredictionCard'
import SentimentCard from '../components/SentimentCard'
import TradingSignals from '../components/TradingSignals'

function Dashboard() {
  const [activeTicker, setActiveTicker] = useState('')

  return (
    <main className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Market Dashboard</h2>
        <p className="text-gray-400 mt-1">
          Real-time financial intelligence powered by AI
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Portfolio Value" value="$124,500" change="+2.4%" positive={true} />
        <StatCard title="Today's P&L" value="+$1,840" change="+1.5%" positive={true} />
        <StatCard title="Active Signals" value="7" change="3 Buy / 4 Sell" positive={false} />
        <StatCard title="Risk Score" value="Medium" change="Score: 54/100" positive={true} />
      </div>

      {/* Row 1 — Chart + Prediction */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <StockSearch onTickerChange={setActiveTicker} />
        </div>
        <div className="lg:col-span-1">
          <PredictionCard ticker={activeTicker} />
        </div>
      </div>

      {/* Row 2 — Sentiment + Trading Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SentimentCard ticker={activeTicker} />
        </div>
        <div className="lg:col-span-2">
          <TradingSignals ticker={activeTicker} />
        </div>
      </div>

    </main>
  )
}

export default Dashboard