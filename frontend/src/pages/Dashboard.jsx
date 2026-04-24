// Dashboard.jsx
// The main dashboard page — contains all our widgets

import StockSearch from '../components/StockSearch'
import StatCard from '../components/StatCard'

function Dashboard() {
  return (
    <main className="p-6 max-w-7xl mx-auto">

      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">
          Market Dashboard
        </h2>
        <p className="text-gray-400 mt-1">
          Real-time financial intelligence powered by AI
        </p>
      </div>

      {/* Stock Search */}
      <div className="mb-8">
        <StockSearch />
      </div>

      {/* Stats Row — 4 cards */}
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

      {/* Main content area — Chart + Side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart placeholder — takes 2/3 of width */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Price Chart</h3>
            <div className="flex gap-2">
              {['1D', '1W', '1M', '3M', '1Y'].map((period) => (
                <button
                  key={period}
                  className="text-xs px-3 py-1 rounded-full bg-gray-800 text-gray-400 hover:bg-blue-600 hover:text-white transition-colors"
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          {/* Chart will go here in Phase 3 */}
          <div className="h-64 flex items-center justify-center border border-dashed border-gray-700 rounded-lg">
            <p className="text-gray-500 text-sm">
              📈 Chart loads after stock search (Phase 3)
            </p>
          </div>
        </div>

        {/* Side panel — takes 1/3 of width */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">
            AI Prediction
          </h3>
          {/* Prediction content will come in Phase 5 */}
          <div className="h-64 flex items-center justify-center border border-dashed border-gray-700 rounded-lg">
            <p className="text-gray-500 text-sm text-center">
              🤖 AI predictions load here (Phase 5)
            </p>
          </div>
        </div>

      </div>
    </main>
  )
}

export default Dashboard