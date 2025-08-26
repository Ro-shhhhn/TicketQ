import mongoose from 'mongoose'

const replySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.authorType !== 'system'
    }
  },
  authorType: {
    type: String,
    enum: ['user', 'agent', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: [2000, 'Reply cannot exceed 2000 characters']
  },
  metadata: {
    // For system replies - store additional info
    isAutoReply: { type: Boolean, default: false },
    confidence: { type: Number, min: 0, max: 1 },
    articleReferences: [{
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
      title: String
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    enum: {
      values: ['billing', 'tech', 'shipping', 'other'],
      message: 'Category must be billing, tech, shipping, or other'
    },
    default: 'other'
  },
  status: {
    type: String,
    enum: {
      values: ['open', 'triaged', 'waiting_human', 'resolved', 'closed'],
      message: 'Invalid status'
    },
    default: 'open'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  agentSuggestionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgentSuggestion',
    default: null
  },
  replies: [replySchema],
  
  // Track if ticket was auto-resolved
  autoResolved: {
    type: Boolean,
    default: false
  },
  
  // Store resolution details
  resolution: {
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    resolutionType: {
      type: String,
      enum: ['auto', 'agent', 'system'],
      default: 'agent'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  }
}, {
  timestamps: true
})

// Indexes for performance
ticketSchema.index({ createdBy: 1, status: 1 })
ticketSchema.index({ assignee: 1, status: 1 })
ticketSchema.index({ status: 1, createdAt: -1 })
ticketSchema.index({ category: 1, status: 1 })

// Virtual for getting latest reply
ticketSchema.virtual('latestReply').get(function() {
  if (this.replies && this.replies.length > 0) {
    return this.replies[this.replies.length - 1]
  }
  return null
})

// Method to add a reply
ticketSchema.methods.addReply = function(replyData) {
  this.replies.push(replyData)
  return this.save()
}

// Method to resolve ticket
ticketSchema.methods.resolve = function(resolvedBy = null, resolutionType = 'agent', confidence = null) {
  this.status = 'resolved'
  this.resolution = {
    resolvedBy,
    resolvedAt: new Date(),
    resolutionType,
    confidence
  }
  
  if (resolutionType === 'auto') {
    this.autoResolved = true
  }
  
  return this.save()
}

// Method to check if user can access this ticket
ticketSchema.methods.canAccess = function(userId, userRole) {
  if (userRole === 'admin') return true
  
  if (userRole === 'user') {
    return this.createdBy.toString() === userId.toString()
  }
  
  if (userRole === 'agent') {
    return (
      (this.assignee && this.assignee.toString() === userId.toString()) ||
      ['waiting_human', 'triaged'].includes(this.status) ||
      this.createdBy.toString() === userId.toString()
    )
  }
  
  return false
}

// Static method to get tickets for user based on role
ticketSchema.statics.getForUser = function(userId, userRole, filters = {}) {
  let query = {}
  
  if (userRole === 'user') {
    query.createdBy = userId
  } else if (userRole === 'agent') {
    query = {
      $or: [
        { assignee: userId },
        { status: { $in: ['triaged', 'waiting_human'] }, assignee: null }
      ]
    }
  }
  // Admin sees all tickets (no filter)
  
  // Apply additional filters
  if (filters.status) query.status = filters.status
  if (filters.category) query.category = filters.category
  
  return this.find(query)
}

export default mongoose.model('Ticket', ticketSchema)