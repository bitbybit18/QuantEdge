// PriceChart.jsx
// Displays an interactive line chart of stock price history
// Uses Recharts — most popular React chart library

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

// Custom tooltip that shows on hover
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-white font-bold text-sm">
          ${payload[0].value.toFixed(2)}
        </p>
      </div>
    )
  }
  return null
}

function PriceChart({ data, ticker }) {

  // Show only every 10th date label so they don't overlap
  const formatXAxis = (date) => {
    if (!date) return ''
    return date.slice(5) // show MM-DD only
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
        >
          {/* Gradient fill under the line */}
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />

          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickLine={false}
            interval={9}
          />

          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
            width={60}
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="close"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#priceGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#3b82f6' }}
          />

        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default PriceChart