import Article from '../models/Article.js'

// GET /api/kb - Search/list articles
export const getArticles = async (req, res) => {
  try {
    const { 
      query, 
      status, 
      page = 1, 
      limit = 10 
    } = req.query

    const skip = (page - 1) * limit
    let articles

    if (query) {
      // Search articles
      articles = await Article.search(query, { 
        status: status || 'published',
        limit: parseInt(limit)
      })
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .skip(skip)
    } else {
      // List all articles
      const filter = status ? { status } : {}
      
      articles = await Article.find(filter)
        .populate('createdBy', 'name email')
        .populate('lastUpdatedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
    }

    const total = await Article.countDocuments(
      status ? { status } : {}
    )

    res.json({
      articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get articles error:', error)
    res.status(500).json({ 
      message: 'Failed to fetch articles' 
    })
  }
}

// GET /api/kb/:id - Get single article
export const getArticleById = async (req, res) => {
  try {
    const { id } = req.params

    const article = await Article.findById(id)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')

    if (!article) {
      return res.status(404).json({ message: 'Article not found' })
    }

    res.json({ article })

  } catch (error) {
    console.error('Get article error:', error)
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid article ID' })
    }

    res.status(500).json({ 
      message: 'Failed to fetch article' 
    })
  }
}

// POST /api/kb - Create article (Admin only)
export const createArticle = async (req, res) => {
  try {
    const { title, body, tags, status } = req.body

    // Validation
    if (!title || !body) {
      return res.status(400).json({ 
        message: 'Title and body are required' 
      })
    }

    if (title.trim().length < 5) {
      return res.status(400).json({ 
        message: 'Title must be at least 5 characters' 
      })
    }

    if (body.trim().length < 20) {
      return res.status(400).json({ 
        message: 'Body must be at least 20 characters' 
      })
    }

    // Process tags
    const processedTags = tags ? 
      tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0) :
      []

    const article = new Article({
      title: title.trim(),
      body: body.trim(),
      tags: processedTags,
      status: status || 'draft',
      createdBy: req.user._id,
      lastUpdatedBy: req.user._id
    })

    await article.save()
    await article.populate('createdBy', 'name email')

    res.status(201).json({
      message: 'Article created successfully',
      article
    })

  } catch (error) {
    console.error('Create article error:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ message: errors.join(', ') })
    }

    res.status(500).json({ 
      message: 'Failed to create article' 
    })
  }
}

// PUT /api/kb/:id - Update article (Admin only)
export const updateArticle = async (req, res) => {
  try {
    const { id } = req.params
    const { title, body, tags, status } = req.body

    const article = await Article.findById(id)
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' })
    }

    // Validation
    if (title && title.trim().length < 5) {
      return res.status(400).json({ 
        message: 'Title must be at least 5 characters' 
      })
    }

    if (body && body.trim().length < 20) {
      return res.status(400).json({ 
        message: 'Body must be at least 20 characters' 
      })
    }

    // Update fields
    if (title) article.title = title.trim()
    if (body) article.body = body.trim()
    if (status) article.status = status
    if (tags !== undefined) {
      article.tags = tags ? 
        tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0) :
        []
    }
    
    article.lastUpdatedBy = req.user._id

    await article.save()
    await article.populate(['createdBy', 'lastUpdatedBy'], 'name email')

    res.json({
      message: 'Article updated successfully',
      article
    })

  } catch (error) {
    console.error('Update article error:', error)
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid article ID' })
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ message: errors.join(', ') })
    }

    res.status(500).json({ 
      message: 'Failed to update article' 
    })
  }
}

// DELETE /api/kb/:id - Delete article (Admin only)
export const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params

    const article = await Article.findByIdAndDelete(id)
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' })
    }

    res.json({ message: 'Article deleted successfully' })

  } catch (error) {
    console.error('Delete article error:', error)
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid article ID' })
    }

    res.status(500).json({ 
      message: 'Failed to delete article' 
    })
  }
}