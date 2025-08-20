const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const authAPI = {
  async login(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed')
    }

    return data
  },

  async register(userData) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed')
    }

    return data
  }
}