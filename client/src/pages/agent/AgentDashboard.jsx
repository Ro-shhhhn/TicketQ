import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { ticketAPI } from '../../services/tickets'
import Navbar from '../../components/common/Navbar'

const AgentDashboard = () => {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [stats, setStats] = useState({
    triageQueue: 0,
    assigned: 0,
    total: 0
  })

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await ticketAPI.getAgentTickets()
      setTickets(response.tickets)
      
      // Calculate stats
      const statCounts = response.tickets.reduce((acc, ticket) => {
        acc.total++
        if (ticket.status === 'waiting_human' && !ticket.assignee) {
          acc.triageQueue++
        } else if (ticket.assignee && ticket.assignee._id === user.id) {
          acc.assigned++
        }
        return acc
      }, { triageQueue: 0, assigned: 0, total: 0 })
      
      setStats(statCounts)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load tickets')
      console.error('Fetch tickets error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTicketClick = async (ticketId) => {
    try {
      const response = await ticketAPI.getTicketById(ticketId)
      setSelectedTicket(response.ticket)
    } catch (err) {
      setError(err.message || 'Failed to load ticket details')
    }
  }

  const handleTicketUpdated = (updatedTicket) => {
    setTickets(prev => 
      prev.map(ticket => 
        ticket._id === updatedTicket._id ? updatedTicket : ticket
      )
    )
    setSelectedTicket(null)
    fetchTickets() // Refresh to update stats
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting_human':
        return 'bg-yellow-100 text-yellow-800'
      case 'triaged':
        return 'bg-blue-100 text-blue-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityLabel = (ticket) => {
    if (ticket.status === 'waiting_human' && !ticket.assignee) {
      return 'Needs Review'
    }
    if (ticket.assignee && ticket.assignee._id === user.id) {
      return 'Assigned to You'
    }
    return 'In Progress'
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="mt-2 text-gray-600">Review triage suggestions and help customers</p>
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
                <p className="text-sm font-medium text-gray-600">Triage Queue</p>
                <p className="text-2xl font-semibold text-yellow-600">{stats.triageQueue}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Assigned to Me</p>
                <p className="text-2xl font-semibold text-blue-600">{stats.assigned}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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

        {/* Ticket Review Modal */}
        {selectedTicket && (
          <TicketReviewModal
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onTicketUpdated={handleTicketUpdated}
          />
        )}

        {/* Tickets List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Tickets Requiring Attention</h2>
          </div>
          
          {tickets.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="mt-4 text-gray-600">All caught up!</p>
              <p className="text-sm text-gray-500">No tickets need your attention right now</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <div 
                  key={ticket._id} 
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleTicketClick(ticket._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {ticket.title}
                        </h3>
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                          {getPriorityLabel(ticket)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                        {ticket.description}
                      </p>
                      
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {ticket.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          by {ticket.createdBy?.name || 'Unknown'}
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

// Ticket Review Modal Component
const TicketReviewModal = ({ ticket, onClose, onTicketUpdated }) => {
  const { user } = useAuth()
  const [suggestion, setSuggestion] = useState(null)
  const [draftReply, setDraftReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSuggestion()
  }, [ticket._id])

  const fetchSuggestion = async () => {
    try {
      setLoading(true)
      const response = await ticketAPI.getSuggestion(ticket._id)
      setSuggestion(response.suggestion)
      setDraftReply(response.suggestion?.draftReply || '')
    } catch (err) {
      console.error('Fetch suggestion error:', err)
      setError(err.message || 'Failed to load AI suggestion')
    } finally {
      setLoading(false)
    }
  }

  const handleSendReply = async () => {
    if (!draftReply.trim()) {
      setError('Reply content is required')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      
      const response = await ticketAPI.sendReply(ticket._id, {
        content: draftReply,
        action: 'resolve'
      })
      
      onTicketUpdated(response.ticket)
    } catch (err) {
      setError(err.message || 'Failed to send reply')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAssignToSelf = async () => {
    try {
      setSubmitting(true)
      const response = await ticketAPI.assignTicket(ticket._id, user.id)
      onTicketUpdated(response.ticket)
    } catch (err) {
      setError(err.message || 'Failed to assign ticket')
    } finally {
      setSubmitting(false)
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Review Ticket</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Ticket Info */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{ticket.title}</h3>
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">
                {ticket.category}
              </span>
              <span className="text-sm text-gray-500">
                by {ticket.createdBy?.name || 'Unknown'}
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(ticket.createdAt)}
              </span>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-medium text-gray-700 mb-2">Customer Issue:</h4>
              <p className="text-gray-600">{ticket.description}</p>
            </div>
          </div>

          {/* AI Suggestion */}
          {loading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ) : suggestion ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-700">AI Suggested Reply:</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    Confidence: {Math.round(suggestion.confidence * 100)}%
                  </span>
                  <span className="text-xs text-gray-500">
                    Category: {suggestion.predictedCategory}
                  </span>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded">
                <textarea
                  value={draftReply}
                  onChange={(e) => setDraftReply(e.target.value)}
                  rows={8}
                  className="w-full p-4 border-0 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Edit the AI-generated reply..."
                />
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
              <p className="text-yellow-800">No AI suggestion available for this ticket.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {!ticket.assignee && (
              <button
                onClick={handleAssignToSelf}
                disabled={submitting}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
              >
                {submitting ? 'Assigning...' : 'Assign to Me'}
              </button>
            )}
            
            <button
              onClick={handleSendReply}
              disabled={submitting || !draftReply.trim()}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Send Reply & Resolve'}
            </button>
            
            <button
              onClick={onClose}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgentDashboard