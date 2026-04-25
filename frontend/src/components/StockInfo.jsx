// StockInfo.jsx
// Shows current price, change, volume for searched stock

function StockInfo({ quote }) {

  const isPositive = parseFloat(quote.change) >= 0

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">

      {/* Current Price */}
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-xs mb-1">Current Price</p>
        <p className="text-white text-2xl font-bold">${quote.price}</p>
      </div>

      {/* Change */}
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-xs mb-1">Today's Change</p>
        <p className={`text-xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{quote.change}
        </p>
        <p className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {quote.changePercent}
        </p>
      </div>

      {/* Day High/Low */}
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-xs mb-1">Day Range</p>
        <p className="text-white text-sm font-semibold">H: ${quote.high}</p>
        <p className="text-white text-sm font-semibold">L: ${quote.low}</p>
      </div>

      {/* Volume */}
      <div className="bg-gray-800 rounded-xl p-4">
        <p className="text-gray-400 text-xs mb-1">Volume</p>
        <p className="text-white text-lg font-bold">{quote.volume}</p>
      </div>

    </div>
  )
}

export default StockInfo