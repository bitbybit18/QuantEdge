// Dashboard.jsx
import StockSearch from '../components/StockSearch'
import StatCard from '../components/StatCard'

function Dashboard() {
  return (
    <main className="p-6 max-w-7xl mx-auto">

      {/* Page Header */}
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

      {/* Stock Search + Chart */}
      <div className="mb-6">
        <StockSearch />
      </div>

      {/* AI Prediction Panel placeholder */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-4">🤖 AI Prediction</h3>
        <div className="h-32 flex items-center justify-center border border-dashed border-gray-700 rounded-lg">
          <p className="text-gray-500 text-sm">AI predictions load here (Phase 5)</p>
        </div>
      </div>

    </main>
  )
}

export default Dashboard