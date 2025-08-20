import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/common/Navbar'
import KBManagement from './KBManagement'

const AdminDashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('kb')

  const tabs = [
    { id: 'kb', label: 'Knowledge Base', icon: '📚' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'users', label: 'Users', icon: '👥' }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'kb':
        return <KBManagement />
      case 'settings':
        return <ComingSoonContent title="System Settings" />
      case 'users':
        return <ComingSoonContent title="User Management" />
      default:
        return <KBManagement />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {activeTab === 'kb' ? (
        // KB Management handles its own navbar
        renderContent()
      ) : (
        <>
          <Navbar />
          
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-2 text-gray-600">Manage your helpdesk system</p>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Content */}
            {renderContent()}
          </div>
        </>
      )}
    </div>
  )
}

// Coming Soon Component for other tabs
const ComingSoonContent = ({ title }) => (
  <div className="bg-white rounded-lg shadow p-8 text-center">
    <div className="mb-6">
      <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
      </svg>
    </div>
    
    <h2 className="text-2xl font-semibold text-gray-900 mb-4">{title}</h2>
    <p className="text-gray-600 mb-6">This feature is coming soon!</p>
    
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p className="text-blue-800 text-sm">
        Focus on <strong>Knowledge Base Management</strong> for now - 
        it's essential for the AI triage system to work properly.
      </p>
    </div>
  </div>
)

export default AdminDashboard