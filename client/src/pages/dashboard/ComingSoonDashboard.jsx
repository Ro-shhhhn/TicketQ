import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/common/Navbar'

const ComingSoonDashboard = ({ role }) => {
  const { user } = useAuth()

  const getRoleFeatures = () => {
    switch (role) {
      case 'admin':
        return [
          'Knowledge Base Management',
          'User & Agent Management', 
          'System Configuration',
          'Analytics & Reports',
          'Agent Performance Metrics'
        ]
      case 'agent':
        return [
          'Ticket Triage Queue',
          'Assigned Tickets',
          'Knowledge Base Search',
          'Reply Templates',
          'Performance Dashboard'
        ]
      default:
        return ['Dashboard Features']
    }
  }

  const getRoleIcon = () => {
    switch (role) {
      case 'admin':
        return (
          <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      case 'agent':
        return (
          <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5zm0 0v19.5" />
          </svg>
        )
      default:
        return (
          <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {getRoleIcon()}
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {role.charAt(0).toUpperCase() + role.slice(1)} Dashboard
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Coming Soon!
          </p>

          {/* Features Preview */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              What's Coming for {role.charAt(0).toUpperCase() + role.slice(1)}s
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getRoleFeatures().map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center p-4 bg-gray-50 rounded-lg"
                >
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-blue-800">
                The {role} dashboard is currently under development. 
                <br />
                <span className="text-sm">Full functionality will be available soon!</span>
              </p>
            </div>
          </div>

          {/* Development Note */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Currently, only the <strong>User</strong> dashboard is fully functional.
              <br />
              Please log in with a user account to explore all features.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ComingSoonDashboard