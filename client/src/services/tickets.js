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

  async getAgentTickets(filters = {}) {
    const params = new URLSearchParams(filters)
    const response = await fetch(`${API_URL}/tickets/agent?${params}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch tickets')
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

  async getSuggestion(ticketId) {
    const response = await fetch(`${API_URL}/agent/suggestion/${ticketId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch suggestion')
    }

    return data
  },

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
  }
}