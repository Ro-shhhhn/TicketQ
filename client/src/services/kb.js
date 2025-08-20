const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

export const kbAPI = {
  async getArticles(filters = {}) {
    const params = new URLSearchParams(filters)
    const response = await fetch(`${API_URL}/kb?${params}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch articles')
    }

    return data
  },

  async getArticleById(articleId) {
    const response = await fetch(`${API_URL}/kb/${articleId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch article')
    }

    return data
  },

  async createArticle(articleData) {
    const response = await fetch(`${API_URL}/kb`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(articleData),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create article')
    }

    return data
  },

  async updateArticle(articleId, articleData) {
    const response = await fetch(`${API_URL}/kb/${articleId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(articleData),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update article')
    }

    return data
  },

  async deleteArticle(articleId) {
    const response = await fetch(`${API_URL}/kb/${articleId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete article')
    }

    return data
  }
}