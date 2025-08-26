import mongoose from 'mongoose'

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  body: {
    type: String,
    required: [true, 'Body is required'],
    trim: true,
    maxlength: [10000, 'Body cannot exceed 10000 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  status: {
    type: String,
    enum: {
      values: ['draft', 'published'],
      message: 'Status must be draft or published'
    },
    default: 'draft'
  }
}, {
  timestamps: true
})

// Text indexes for search
articleSchema.index({ 
  title: 'text', 
  body: 'text', 
  tags: 'text' 
}, {
  weights: {
    title: 10,
    tags: 5,
    body: 1
  }
})

// Status and timestamp index
articleSchema.index({ status: 1, updatedAt: -1 })

// Static method for searching articles
articleSchema.statics.search = async function(query, options = {}) {
  const {
    status = 'published',
    limit = 10,
    skip = 0
  } = options

  let filter = { status }
  let sort = { updatedAt: -1 }

  if (query && query.trim()) {
    // Use text search if query provided
    filter.$text = { $search: query.trim() }
    sort = { score: { $meta: 'textScore' }, updatedAt: -1 }
    
    return await this.find(filter)
      .select({ score: { $meta: 'textScore' }, title: 1, body: 1, tags: 1, updatedAt: 1 })
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .lean()
  } else {
    // Return recent articles if no query
    return await this.find(filter)
      .select({ title: 1, body: 1, tags: 1, updatedAt: 1 })
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .lean()
  }
}

// Instance method to get snippet
articleSchema.methods.getSnippet = function(length = 200) {
  return this.body.length > length 
    ? this.body.substring(0, length) + '...'
    : this.body
}

export default mongoose.model('Article', articleSchema)