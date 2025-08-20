import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { kbAPI } from '../../services/kb'
import Navbar from '../../components/common/Navbar'

const KBManagement = () => {
  const { user } = useAuth()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingArticle, setEditingArticle] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchArticles()
  }, [statusFilter])

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const filters = {}
      if (statusFilter !== 'all') filters.status = statusFilter
      if (searchQuery) filters.query = searchQuery

      const response = await kbAPI.getArticles(filters)
      setArticles(response.articles)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load articles')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchArticles()
  }

  const handleArticleCreated = (newArticle) => {
    setArticles(prev => [newArticle, ...prev])
    setShowForm(false)
  }

  const handleArticleUpdated = (updatedArticle) => {
    setArticles(prev => 
      prev.map(article => 
        article._id === updatedArticle._id ? updatedArticle : article
      )
    )
    setEditingArticle(null)
    setShowForm(false)
  }

  const handleDelete = async (articleId) => {
    if (!confirm('Are you sure you want to delete this article?')) return

    try {
      await kbAPI.deleteArticle(articleId)
      setArticles(prev => prev.filter(article => article._id !== articleId))
    } catch (err) {
      setError(err.message || 'Failed to delete article')
    }
  }

  const getStatusColor = (status) => {
    return status === 'published' 
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800'
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="space-y-4">
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
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base Management</h1>
          <p className="mt-2 text-gray-600">Create and manage help articles for support agents</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
          {/* Search and Filter */}
          <div className="flex gap-4 flex-1">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Search
              </button>
            </form>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Create Button */}
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Article
          </button>
        </div>

        {/* Article Form Modal */}
        {showForm && (
          <ArticleForm
            article={editingArticle}
            onClose={() => {
              setShowForm(false)
              setEditingArticle(null)
            }}
            onArticleCreated={handleArticleCreated}
            onArticleUpdated={handleArticleUpdated}
          />
        )}

        {/* Articles List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Articles ({articles.length})
            </h2>
          </div>
          
          {articles.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-600">No articles found</p>
              <p className="text-sm text-gray-500">Create your first knowledge base article</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {articles.map((article) => (
                <div key={article._id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {article.body}
                      </p>
                      
                      {/* Tags */}
                      {article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {article.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(article.status)}`}>
                          {article.status}
                        </span>
                        <span>By {article.createdBy?.name || 'Unknown'}</span>
                        <span>{formatDate(article.createdAt)}</span>
                        {article.lastUpdatedBy && article.updatedAt !== article.createdAt && (
                          <span>Updated {formatDate(article.updatedAt)}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="ml-4 flex gap-2">
                      <button
                        onClick={() => {
                          setEditingArticle(article)
                          setShowForm(true)
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(article._id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
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

// Article Form Component
const ArticleForm = ({ article, onClose, onArticleCreated, onArticleUpdated }) => {
  const [formData, setFormData] = useState({
    title: article?.title || '',
    body: article?.body || '',
    tags: article?.tags?.join(', ') || '',
    status: article?.status || 'draft'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEditing = !!article

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.body.trim()) {
      setError('Title and body are required')
      return
    }

    try {
      setLoading(true)
      setError('')

      let response
      if (isEditing) {
        response = await kbAPI.updateArticle(article._id, formData)
        onArticleUpdated(response.article)
      } else {
        response = await kbAPI.createArticle(formData)
        onArticleCreated(response.article)
      }
    } catch (err) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} article`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            {isEditing ? 'Edit Article' : 'Create New Article'}
          </h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Article title"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body Content *
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Article content"
              maxLength={5000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.body.length}/5000 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="billing, technical, shipping (comma-separated)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple tags with commas
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 
                (isEditing ? 'Updating...' : 'Creating...') : 
                (isEditing ? 'Update Article' : 'Create Article')
              }
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default KBManagement