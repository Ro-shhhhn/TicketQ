import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  traceId: {
    type: String,
    required: true
  },
  actor: {
    type: String,
    enum: ['system', 'agent', 'user'],
    required: true
  },
  action: {
    type: String,
    enum: [
      'TICKET_CREATED',
      'AGENT_CLASSIFIED',
      'KB_RETRIEVED',
      'DRAFT_GENERATED',
      'AUTO_CLOSED',
      'ASSIGNED_TO_HUMAN',
      'REPLY_SENT',
      'TICKET_REOPENED'
    ],
    required: true
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // We use custom timestamp field
})

// Indexes for performance
auditLogSchema.index({ ticketId: 1, timestamp: -1 })
auditLogSchema.index({ traceId: 1 })

export default mongoose.model('AuditLog', auditLogSchema)