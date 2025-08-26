import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ticketAPI } from '../../services/tickets'
import Navbar from '../../components/common/Navbar'

const AgentDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [stats, setStats] = useState({
    triageQueue: 0,
    assigned: 0,
    resolved: 0,
    total: 0
  })

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await ticketAPI.getAgentTickets()
      setTickets(response.tickets)
      
      // Enhanced stats calculation
      const statCounts = response.tickets.reduce((acc, ticket) => {
        acc.total++
        
        // Triage queue: tickets needing agent review
        if (['waiting_human', 'triaged'].includes(ticket.status) && !ticket.assignee) {
          acc.triageQueue++
        }
        
        // Assigned to current agent
        if (ticket.assignee && ticket.assignee._id === user.id) {
          acc.assigned++
        }
        
        // Resolved by current agent
        if (ticket.status === 'resolved' && ticket.assignee && ticket.assignee._id === user.id) {
          acc.resolved++
        }
        
        return acc
      }, { triageQueue: 0, assigned: 0, resolved: 0, total: 0 })
      
      setStats(statCounts)
    } catch (err) {
      setError(err.message || 'Failed to load tickets')
      console.error('Fetch tickets error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTicketClick = (ticketId) => {
    navigate(`/tickets/${ticketId}`)
  }

  const getFilteredTickets = () => {
    switch (activeFilter) {
      case 'queue':
        return tickets.filter(ticket => 
          ['waiting_human', 'triaged'].includes(ticket.status) && !ticket.assignee
        )
      case 'assigned':
        return tickets.filter(ticket => 
          ticket.assignee && ticket.assignee._id === user.id
        )
      case 'resolved':
        return tickets.filter(ticket => 
          ticket.status === 'resolved' && ticket.assignee && ticket.assignee._id === user.id
        )
      default:
        return tickets
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting_human':
        return 'bg-yellow-100 text-yellow-800'
      case 'triaged':
        return 'bg-purple-100 text-purple-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getPriorityLabel = (ticket) => {
    if (ticket.status === 'waiting_human' && !ticket.assignee) {
      return { label: 'Needs Review', color: 'bg-red-100 text-red-800' }
    }
    if (ticket.status === 'triaged' && !ticket.assignee) {
      return { label: 'AI Triaged', color: 'bg-blue-100 text-blue-800' }
    }
    if (ticket.assignee && ticket.assignee._id === user.id) {
      return { label: 'Assigned to You', color: 'bg-green-100 text-green-800' }
    }
    return { label: 'In Progress', color: 'bg-gray-100 text-gray-800' }
  }

  const getUrgencyIndicator = (ticket) => {
    const hoursOld = (new Date() - new Date(ticket.createdAt)) / (1000 * 60 * 60)
    if (hoursOld > 24) {
      return { icon: '🔴', text: 'Urgent - Over 24h old' }
    }
    if (hoursOld > 12) {
      return { icon: '🟡', text: 'High - Over 12h old' }
    }
    if (ticket.status === 'waiting_human') {
      return { icon: '🟢', text: 'New - Needs review' }
    }
    return null
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const filteredTickets = getFilteredTickets()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="mt-2 text-gray-600">Review AI triage suggestions and help customers</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Triage Queue</p>
                <p className="text-2xl font-semibold text-yellow-600">{stats.triageQueue}</p>
                <p className="text-xs text-gray-500">Needs review</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Assigned to Me</p>
                <p className="text-2xl font-semibold text-blue-600">{stats.assigned}</p>
                <p className="text-xs text-gray-500">Active tickets</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                <p className="text-2xl font-semibold text-green-600">{stats.resolved}</p>
                <p className="text-xs text-gray-500">Great work!</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Visible</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">All tickets</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { key: 'all', label: 'All Tickets', count: tickets.length },
              { key: 'queue', label: 'Triage Queue', count: stats.triageQueue },
              { key: 'assigned', label: 'My Tickets', count: stats.assigned },
              { key: 'resolved', label: 'Resolved', count: stats.resolved }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeFilter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Tickets List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {activeFilter === 'queue' ? 'Tickets Needing Review' :
               activeFilter === 'assigned' ? 'Your Assigned Tickets' :
               activeFilter === 'resolved' ? 'Recently Resolved' :
               'All Accessible Tickets'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {activeFilter === 'queue' ? 'AI has triaged these tickets and they need human review' :
               activeFilter === 'assigned' ? 'Tickets currently assigned to you' :
               activeFilter === 'resolved' ? 'Tickets you\'ve successfully resolved' :
               'All tickets you can access as an agent'}
            </p>
          </div>
          
          {filteredTickets.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="mt-4 text-gray-600">
                {activeFilter === 'queue' ? 'No tickets in triage queue' :
                 activeFilter === 'assigned' ? 'No tickets assigned to you' :
                 activeFilter === 'resolved' ? 'No resolved tickets yet' :
                 'No tickets available'}
              </p>
              <p className="text-sm text-gray-500">
                {activeFilter === 'queue' ? 'All tickets are either assigned or resolved' :
                 activeFilter === 'assigned' ? 'Check the triage queue for new tickets to review' :
                 'Keep up the great work helping customers!'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTickets.map((ticket) => {
                const priority = getPriorityLabel(ticket)
                const urgency = getUrgencyIndicator(ticket)
                
                return (
                  <div
                    key={ticket._id}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                    onClick={() => handleTicketClick(ticket._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {urgency && (
                            <span className="text-lg" title={urgency.text}>
                              {urgency.icon}
                            </span>
                          )}
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {ticket.title}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${priority.color}`}>
                            {priority.label}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                          {ticket.description}
                        </p>
                        
                        <div className="flex items-center space-x-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">
                            📁 {ticket.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            👤 {ticket.createdBy?.name || 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-500">
                            🕒 {formatDate(ticket.createdAt)}
                          </span>
                          {ticket.assignee && (
                            <span className="text-xs text-blue-600">
                              🎧 {ticket.assignee.name}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                        {ticket.status === 'waiting_human' && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            🤖 AI Ready
                          </span>
                        )}
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {stats.triageQueue > 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-blue-900">🚨 Action Required</h3>
                <p className="text-blue-700">
                  You have <strong>{stats.triageQueue}</strong> ticket{stats.triageQueue > 1 ? 's' : ''} waiting for review. 
                  AI has analyzed these tickets and prepared suggestions for you.
                </p>
              </div>
              <button
                onClick={() => setActiveFilter('queue')}
                className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Review Queue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AgentDashboard