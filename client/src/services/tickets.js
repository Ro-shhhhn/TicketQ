const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

export const ticketAPI = {
  async createTicket(ticketData) {
    const response = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(ticketData),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create ticket')
    }

    return data
  },

  async getMyTickets(filters = {}) {
    const params = new URLSearchParams(filters)
    const response = await fetch(`${API_URL}/tickets?${params}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch tickets')
    }

    return data
  },

  // Enhanced agent tickets endpoint
  async getAgentTickets(filters = {}) {
    const params = new URLSearchParams(filters)
    const response = await fetch(`${API_URL}/tickets/agent?${params}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch agent tickets')
    }

    return data
  },

  async getTicketById(ticketId) {
    const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch ticket')
    }

    return data
  },

  // Enhanced suggestion endpoint with error handling
  async getSuggestion(ticketId) {
    try {
      const response = await fetch(`${API_URL}/agent/suggestion/${ticketId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      const data = await response.json()
      
      if (!response.ok) {
        // Don't throw error for 404 - just return null
        if (response.status === 404) {
          return { suggestion: null }
        }
        throw new Error(data.message || 'Failed to fetch suggestion')
      }

      return data
    } catch (error) {
      console.warn('Suggestion fetch failed:', error.message)
      return { suggestion: null }
    }
  },

  // Enhanced reply endpoint
  async sendReply(ticketId, replyData) {
    const response = await fetch(`${API_URL}/tickets/${ticketId}/reply`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(replyData),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send reply')
    }

    return data
  },

  async assignTicket(ticketId, agentId) {
    const response = await fetch(`${API_URL}/tickets/${ticketId}/assign`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ agentId }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to assign ticket')
    }

    return data
  },

  async getTicketAuditLog(ticketId) {
    try {
      const response = await fetch(`${API_URL}/tickets/${ticketId}/audit`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      const data = await response.json()
      
      if (!response.ok) {
        // Don't throw error for audit log - just return empty
        if (response.status === 404 || response.status === 403) {
          return { auditLog: [] }
        }
        throw new Error(data.message || 'Failed to fetch audit log')
      }

      return data
    } catch (error) {
      console.warn('Audit log fetch failed:', error.message)
      return { auditLog: [] }
    }
  },

  // Manual triage trigger for agents (testing)
  async triggerTriage(ticketId) {
    try {
      const response = await fetch(`${API_URL}/agent/triage`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ticketId }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to trigger triage')
      }

      return data
    } catch (error) {
      console.warn('Manual triage failed:', error.message)
      throw error
    }
  },

  // Bulk operations for agents
  async bulkAssignTickets(ticketIds, agentId) {
    try {
      const promises = ticketIds.map(id => this.assignTicket(id, agentId))
      const results = await Promise.allSettled(promises)
      
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length
      
      return {
        successful,
        failed,
        total: ticketIds.length
      }
    } catch (error) {
      throw new Error('Bulk assignment failed: ' + error.message)
    }
  },

  // Agent statistics
  async getAgentStats() {
    try {
      const response = await fetch(`${API_URL}/agent/stats`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        // Fallback - calculate from tickets if endpoint doesn't exist
        const ticketsResponse = await this.getAgentTickets()
        const tickets = ticketsResponse.tickets || []
        
        const stats = tickets.reduce((acc, ticket) => {
          acc.total++
          if (['waiting_human', 'triaged'].includes(ticket.status) && !ticket.assignee) {
            acc.queue++
          }
          if (ticket.assignee && ticket.status !== 'resolved') {
            acc.active++
          }
          if (ticket.status === 'resolved') {
            acc.resolved++
          }
          return acc
        }, { total: 0, queue: 0, active: 0, resolved: 0 })
        
        return { stats }
      }

      return await response.json()
    } catch (error) {
      console.warn('Stats fetch failed:', error.message)
      return { stats: { total: 0, queue: 0, active: 0, resolved: 0 } }
    }
  }
}