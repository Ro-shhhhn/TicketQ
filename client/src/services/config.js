const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

export const configAPI = {
  async getConfig() {
    const response = await fetch(`${API_URL}/config`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch configuration')
    }

    return data
  },

  async updateConfig(configData) {
    const response = await fetch(`${API_URL}/config`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(configData),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update configuration')
    }

    return data
  }
}