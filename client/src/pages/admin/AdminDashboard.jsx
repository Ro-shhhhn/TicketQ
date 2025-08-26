import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/common/Navbar'
import KBManagementEmbedded from './KBManagementEmbedded'
import Settings from './Settings'

const AdminDashboard = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('kb')

  const tabs = [
    { id: 'kb', label: 'Knowledge Base', icon: '📚' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'kb':
        return (
          <div className="bg-white rounded-lg shadow">
            <KBManagementEmbedded />
          </div>
        )
      case 'settings':
        return <Settings />
      default:
        return (
          <div className="bg-white rounded-lg shadow">
            <KBManagementEmbedded />
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
    </div>
  )
}

export default AdminDashboard