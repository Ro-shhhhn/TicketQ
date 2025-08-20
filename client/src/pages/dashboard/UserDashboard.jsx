import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { ticketAPI } from '../../services/tickets'
import Navbar from '../../components/common/Navbar'

const UserDashboard = () => {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [stats, setStats] = useState({
    open: 0,
    resolved: 0,
    total: 0
  })

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await ticketAPI.getMyTickets()
      setTickets(response.tickets)
      
      // Calculate stats
      const statCounts = response.tickets.reduce((acc, ticket) => {
        acc.total++
        if (['open', 'triaged', 'waiting_human'].includes(ticket.status)) {
          acc.open++
        } else if (['resolved', 'closed'].includes(ticket.status)) {
          acc.resolved++
        }
        return acc
      }, { open: 0, resolved: 0, total: 0 })
      
      setStats(statCounts)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  const handleTicketCreated = (newTicket) => {
    setTickets(prev => [newTicket, ...prev])
    setStats(prev => ({ ...prev, open: prev.open + 1, total: prev.total + 1 }))
    setShowCreateForm(false)
  }

  const handleTicketClick = async (ticketId) => {
    try {
      const response = await ticketAPI.getTicketById(ticketId)
      setSelectedTicket(response.ticket)
    } catch (err) {
      setError(err.message || 'Failed to load ticket details')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
      case 'triaged':
        return 'bg-blue-100 text-blue-800'
      case 'waiting_human':
        return 'bg-yellow-100 text-yellow-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Support Tickets</h1>
          <p className="mt-2 text-gray-600">View your support requests and their status</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                <p className="text-2xl font-semibold text-blue-600">{stats.open}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-semibold text-green-600">{stats.resolved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Create Ticket Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create New Ticket</span>
          </button>
        </div>

        {/* Create Ticket Form Modal */}
        {showCreateForm && (
          <CreateTicketForm
            onClose={() => setShowCreateForm(false)}
            onTicketCreated={handleTicketCreated}
          />
        )}

        {/* Ticket Details Modal */}
        {selectedTicket && (
          <TicketDetailModal
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
          />
        )}

        {/* Tickets List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Your Tickets</h2>
          </div>
          
          {tickets.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-600">No tickets found</p>
              <p className="text-sm text-gray-500">Get started by creating your first support ticket</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <div key={ticket._id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer" onClick={() => handleTicketClick(ticket._id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {ticket.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {ticket.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(ticket.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Create Ticket Form Component (Users can only CREATE)
const CreateTicketForm = ({ onClose, onTicketCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required')
      return
    }

    if (formData.title.trim().length < 5) {
      setError('Title must be at least 5 characters long')
      return
    }

    if (formData.description.trim().length < 10) {
      setError('Description must be at least 10 characters long')
      return
    }

    try {
      setLoading(true)
      setError('')
      const response = await ticketAPI.createTicket(formData)
      onTicketCreated(response.ticket)
    } catch (err) {
      setError(err.message || 'Failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Create New Ticket</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief summary of your issue"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="other">Other</option>
              <option value="billing">Billing</option>
              <option value="tech">Technical</option>
              <option value="shipping">Shipping</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detailed description of your issue"
              maxLength={2000}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Ticket Detail Modal (Users can only READ - no edit/delete)
const TicketDetailModal = ({ ticket, onClose }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
      case 'triaged':
        return 'bg-blue-100 text-blue-800'
      case 'waiting_human':
        return 'bg-yellow-100 text-yellow-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Ticket Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Ticket Info */}
          <div className="border-b pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">{ticket.title}</h3>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-gray-500 capitalize">{ticket.category}</span>
                  <span className="text-sm text-gray-500">{formatDate(ticket.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700">Description:</h4>
              <p className="mt-1 text-gray-600">{ticket.description}</p>
            </div>
          </div>

          {/* Replies Section */}
          {ticket.replies && ticket.replies.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Conversation:</h4>
              <div className="space-y-3">
                {ticket.replies.map((reply, index) => (
                  <div key={index} className={`p-3 rounded ${
                    reply.authorType === 'user' ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'
                  }`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium">
                        {reply.authorType === 'system' ? 'System' : reply.author?.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{reply.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserDashboard