import mongoose from 'mongoose'

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
  replies: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
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
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
})

// Indexes for performance
ticketSchema.index({ createdBy: 1, status: 1 })
ticketSchema.index({ assignee: 1, status: 1 })
ticketSchema.index({ status: 1, createdAt: -1 })

export default mongoose.model('Ticket', ticketSchema)