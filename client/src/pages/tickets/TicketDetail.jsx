import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ticketAPI } from '../../services/tickets'
import Navbar from '../../components/common/Navbar'

const TicketDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [ticket, setTicket] = useState(null)
  const [auditLog, setAuditLog] = useState([])
  const [suggestion, setSuggestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Agent reply functionality
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [draftReply, setDraftReply] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchTicketDetails()
  }, [id])

  const fetchTicketDetails = async () => {
    try {
      setLoading(true)
      setError('')
      
      const promises = [
        ticketAPI.getTicketById(id),
        ticketAPI.getTicketAuditLog(id)
      ]
      
      // Only fetch suggestion if user is agent/admin
      if (['agent', 'admin'].includes(user?.role)) {
        promises.push(ticketAPI.getSuggestion(id))
      }
      
      const responses = await Promise.allSettled(promises)
      
      const ticketResponse = responses[0]
      const auditResponse = responses[1]
      const suggestionResponse = responses[2]
      
      if (ticketResponse.status === 'fulfilled') {
        setTicket(ticketResponse.value.ticket)
      } else {
        throw new Error(ticketResponse.reason.message || 'Failed to load ticket')
      }
      
      if (auditResponse.status === 'fulfilled') {
        setAuditLog(auditResponse.value.auditLog || [])
      }
      
      if (suggestionResponse && suggestionResponse.status === 'fulfilled') {
        const suggestionData = suggestionResponse.value.suggestion
        setSuggestion(suggestionData)
        setDraftReply(suggestionData?.draftReply || '')
      }
      
    } catch (err) {
      setError(err.message || 'Failed to load ticket details')
      console.error('Fetch ticket details error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignToSelf = async () => {
    try {
      setSubmitting(true)
      const response = await ticketAPI.assignTicket(id, user.id)
      setTicket(response.ticket)
      await fetchTicketDetails()
    } catch (err) {
      setError(err.message || 'Failed to assign ticket')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendReply = async (action = 'resolve') => {
    if (!draftReply.trim()) {
      setError('Reply content is required')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      
      const response = await ticketAPI.sendReply(id, {
        content: draftReply,
        action
      })
      
      setTicket(response.ticket)
      setDraftReply('')
      setShowReplyForm(false)
      await fetchTicketDetails()
    } catch (err) {
      setError(err.message || 'Failed to send reply')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800'
      case 'triaged':
        return 'bg-purple-100 text-purple-800'
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

  const getActionIcon = (action) => {
    switch (action) {
      case 'TICKET_CREATED':
        return '🎫'
      case 'AGENT_CLASSIFIED':
        return '🤖'
      case 'KB_RETRIEVED':
        return '📚'
      case 'DRAFT_GENERATED':
        return '✍️'
      case 'AUTO_CLOSED':
        return '✅'
      case 'ASSIGNED_TO_HUMAN':
        return '👨‍💼'
      case 'REPLY_SENT':
        return '💬'
      case 'TICKET_ASSIGNED':
        return '📋'
      default:
        return '📋'
    }
  }

  const getActionDescription = (logEntry) => {
    const { action, actor, meta } = logEntry
    
    switch (action) {
      case 'TICKET_CREATED':
        return 'Ticket was created'
      case 'AGENT_CLASSIFIED':
        return `AI classified as "${meta?.predictedCategory}" (${Math.round((meta?.confidence || 0) * 100)}% confidence)`
      case 'KB_RETRIEVED':
        return `Found ${meta?.articlesFound || 0} knowledge base articles`
      case 'DRAFT_GENERATED':
        return `AI generated a draft reply (${meta?.citationsCount || 0} citations)`
      case 'AUTO_CLOSED':
        return `Ticket auto-resolved by AI (confidence: ${Math.round((meta?.confidence || 0) * 100)}%)`
      case 'ASSIGNED_TO_HUMAN':
        return `Assigned to human agent for review (confidence too low)`
      case 'REPLY_SENT':
        return `${actor === 'agent' ? 'Agent' : 'System'} sent a reply`
      case 'TICKET_ASSIGNED':
        return 'Ticket was assigned to an agent'
      default:
        return action.replace('_', ' ').toLowerCase()
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

  const formatRelativeTime = (date) => {
    const now = new Date()
    const diff = now - new Date(date)
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const canReply = () => {
    return ['agent', 'admin'].includes(user?.role) && 
           ['waiting_human', 'triaged'].includes(ticket?.status)
  }

  const canAssign = () => {
    return ['agent', 'admin'].includes(user?.role) && 
           !ticket?.assignee &&
           ['waiting_human', 'triaged'].includes(ticket?.status)
  }

  // Helper to extract KB articles from system replies
  const getKBArticlesFromReply = (reply) => {
    if (reply.authorType === 'system' && reply.metadata?.articleReferences) {
      return reply.metadata.articleReferences
    }
    return []
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto py-6 px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="bg-white rounded-lg p-6 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !ticket) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto py-6 px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-red-800 font-medium">Error Loading Ticket</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto py-6 px-4">
          <div className="text-center">
            <p className="text-gray-600">Ticket not found</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ticket Details</h1>
              <p className="text-gray-600">
                {user?.role === 'agent' ? 'Review and respond to customer inquiry' : 'Track your support request progress'}
              </p>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(ticket.status)}`}>
              {ticket.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-6">
            {/* Ticket Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{ticket.title}</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Category:</span>
                  <span className="ml-2 capitalize font-medium">{ticket.category}</span>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 font-medium">{formatDate(ticket.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Last Updated:</span>
                  <span className="ml-2 font-medium">{formatDate(ticket.updatedAt)}</span>
                </div>
                {ticket.assignee && (
                  <div>
                    <span className="text-gray-500">Assigned to:</span>
                    <span className="ml-2 font-medium">{ticket.assignee.name}</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-700 mb-2">Description:</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>

            {/* AI Suggestion (Agent Only) */}
            {suggestion && ['agent', 'admin'].includes(user?.role) && (
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-blue-900">🤖 AI Analysis</h3>
                  <div className="flex items-center gap-3 text-xs text-blue-700">
                    <span>Confidence: {Math.round(suggestion.confidence * 100)}%</span>
                    <span>Category: {suggestion.predictedCategory}</span>
                  </div>
                </div>
                
                <div className="bg-white rounded p-4 border border-blue-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Reply:</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{suggestion.draftReply}</p>
                  
                  {suggestion.articles && suggestion.articles.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500 mb-2">Based on knowledge base articles:</p>
                      <div className="space-y-2">
                        {suggestion.articles.map((article, index) => (
                          <div key={article._id || index} className="text-xs bg-blue-100 text-blue-800 p-2 rounded">
                            <div className="font-medium">{article.title}</div>
                            {article.body && (
                              <div className="text-blue-600 mt-1">
                                {article.body.substring(0, 150)}...
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Agent Actions */}
            {['agent', 'admin'].includes(user?.role) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-medium text-gray-900 mb-4">Agent Actions</h3>
                
                <div className="flex gap-3 flex-wrap">
                  {canAssign() && (
                    <button
                      onClick={handleAssignToSelf}
                      disabled={submitting}
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
                    >
                      {submitting ? 'Assigning...' : 'Assign to Me'}
                    </button>
                  )}
                  
                  {canReply() && !showReplyForm && (
                    <button
                      onClick={() => setShowReplyForm(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Reply to Customer
                    </button>
                  )}
                  
                  {showReplyForm && (
                    <button
                      onClick={() => {
                        setShowReplyForm(false)
                        setDraftReply(suggestion?.draftReply || '')
                        setError('')
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                    >
                      Cancel Reply
                    </button>
                  )}
                </div>

                {/* Reply Form */}
                {showReplyForm && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Reply:
                      </label>
                      <textarea
                        value={draftReply}
                        onChange={(e) => setDraftReply(e.target.value)}
                        rows={6}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Type your reply to the customer..."
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleSendReply('resolve')}
                        disabled={submitting || !draftReply.trim()}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {submitting ? 'Sending...' : 'Send Reply & Resolve'}
                      </button>
                      
                      <button
                        onClick={() => handleSendReply('keep_open')}
                        disabled={submitting || !draftReply.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {submitting ? 'Sending...' : 'Send Reply & Keep Open'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Conversation */}
            {ticket.replies && ticket.replies.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Conversation</h3>
                </div>
                <div className="p-6 space-y-4">
                  {ticket.replies.map((reply, index) => {
                    const kbArticles = getKBArticlesFromReply(reply)
                    
                    return (
                      <div key={index} className={`flex ${reply.authorType === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                          reply.authorType === 'user'
                            ? 'bg-blue-600 text-white'
                            : reply.authorType === 'system'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium opacity-75">
                              {reply.authorType === 'system' ? 'AI Assistant' :
                               reply.authorType === 'user' ? 'Customer' :
                               reply.author?.name || 'Agent'}
                            </span>
                            <span className="text-xs opacity-75">
                              {formatRelativeTime(reply.createdAt)}
                            </span>
                          </div>
                          
                          <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                          
                          {/* Show KB articles if this was an auto-reply */}
                          {kbArticles.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-300">
                              <p className="text-xs opacity-75 mb-2">📚 Knowledge Base References:</p>
                              <div className="space-y-1">
                                {kbArticles.map((article, idx) => (
                                  <div key={idx} className="text-xs bg-black bg-opacity-10 p-2 rounded">
                                    <div className="font-medium">{article.title}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {reply.metadata?.isAutoReply && (
                            <div className="mt-2 text-xs opacity-75 italic">
                              Auto-resolved with {Math.round((reply.metadata.confidence || 0) * 100)}% confidence
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Timeline Sidebar */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Activity Timeline</h3>
              </div>
              <div className="p-4">
                {auditLog.length > 0 ? (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {auditLog.map((entry, index) => (
                        <li key={entry._id || index}>
                          <div className="relative pb-8">
                            {index !== auditLog.length - 1 && (
                              <span
                                className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                aria-hidden="true"
                              />
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                                  {getActionIcon(entry.action)}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div>
                                  <p className="text-sm text-gray-900">
                                    {getActionDescription(entry)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatRelativeTime(entry.timestamp)}
                                  </p>
                                  {entry.traceId && user?.role === 'admin' && (
                                    <p className="text-xs text-gray-400 font-mono">
                                      {entry.traceId.substring(0, 8)}...
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No activity recorded</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicketDetail