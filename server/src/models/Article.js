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
    required: [true, 'Body content is required'],
    trim: true,
    maxlength: [5000, 'Body cannot exceed 5000 characters']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  status: {
    type: String,
    enum: {
      values: ['draft', 'published'],
      message: 'Status must be draft or published'
    },
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Indexes for search performance
articleSchema.index({ status: 1, createdAt: -1 })
articleSchema.index({ tags: 1, status: 1 })
articleSchema.index({ 
  title: 'text', 
  body: 'text', 
  tags: 'text' 
}, {
  weights: { title: 3, tags: 2, body: 1 }
})

// Static method for searching articles
articleSchema.statics.search = function(query, options = {}) {
  const { status = 'published', limit = 10 } = options
  
  if (!query) {
    return this.find({ status }).limit(limit).sort({ createdAt: -1 })
  }
  
  return this.find(
    { 
      status,
      $text: { $search: query } 
    },
    { score: { $meta: 'textScore' } }
  )
  .sort({ score: { $meta: 'textScore' } })
  .limit(limit)
}

export default mongoose.model('Article', articleSchema)