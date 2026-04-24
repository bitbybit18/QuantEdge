// App.jsx
// This is the ROOT component — everything renders from here
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    // Main wrapper — dark background for fintech feel
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <Dashboard />
    </div>
  )
}

export default App