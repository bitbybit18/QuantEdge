// Navbar.jsx
// The top navigation bar — shown on every page

function Navbar() {
  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      
      {/* Left side — Logo and name */}
      <div className="flex items-center gap-3">
        {/* Logo icon */}
        <div className="bg-blue-600 rounded-lg p-2">
          <span className="text-white font-bold text-lg">Q</span>
        </div>
        {/* App name */}
        <div>
          <h1 className="text-white font-bold text-xl tracking-tight">
            QuantEdge
          </h1>
          <p className="text-gray-400 text-xs">
            AI Financial Intelligence
          </p>
        </div>
      </div>

      {/* Center — Navigation links */}
      <div className="hidden md:flex items-center gap-8">
        <a href="#" className="text-blue-400 font-medium text-sm">
          Dashboard
        </a>
        <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
          Markets
        </a>
        <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
          Predictions
        </a>
        <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
          Signals
        </a>
      </div>

      {/* Right side — Status indicator */}
      <div className="flex items-center gap-3">
        {/* Live market indicator */}
        <div className="flex items-center gap-2 bg-gray-800 rounded-full px-3 py-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-gray-300 text-xs font-medium">Live</span>
        </div>
        {/* User avatar placeholder */}
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">U</span>
        </div>
      </div>

    </nav>
  )
}

export default Navbar