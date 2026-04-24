// StatCard.jsx
// A reusable card that shows a single metric
// Props = data passed in from parent component

function StatCard({ title, value, change, positive }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">

      {/* Card title */}
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">
        {title}
      </p>

      {/* Main value */}
      <p className="text-white text-2xl font-bold mb-1">
        {value}
      </p>

      {/* Change indicator */}
      <p className={`text-sm font-medium ${positive ? 'text-green-400' : 'text-red-400'}`}>
        {positive ? '▲' : '▼'} {change}
      </p>

    </div>
  )
}

export default StatCard