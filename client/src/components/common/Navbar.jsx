import { useAuth } from '../../context/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">TicketQ</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {user?.name}</span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              user?.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
              user?.role === 'agent' ? 'bg-blue-100 text-blue-800' : 
              'bg-green-100 text-green-800'
            }`}>
              {user?.role}
            </span>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar