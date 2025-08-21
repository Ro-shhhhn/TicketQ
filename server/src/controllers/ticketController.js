import Ticket from '../models/Ticket.js'
import AgentSuggestion from '../models/AgentSuggestion.js'
import AuditLog from '../models/AuditLog.js'
import TriageWorkflow from '../../../agent/workflows/triageWorkflow.js'

export const createTicket = async (req, res) => {
  try {
    const { title, description, category } = req.body

    // Validation
    if (!title || !description) {
      return res.status(400).json({ 
        message: 'Title and description are required' 
      })
    }

    if (title.trim().length < 5) {
      return res.status(400).json({ 
        message: 'Title must be at least 5 characters long' 
      })
    }

    if (description.trim().length < 10) {
      return res.status(400).json({ 
        message: 'Description must be at least 10 characters long' 
      })
    }

    const ticket = new Ticket({
      title: title.trim(),
      description: description.trim(),
      category: category || 'other',
      createdBy: req.user._id,
      status: 'open'
    })

    await ticket.save()
    
    // Populate the createdBy field for response
    await ticket.populate('createdBy', 'name email role')

    // Trigger agent triage workflow asynchronously
    const triage = new TriageWorkflow()
    triage.processTicket(ticket._id).catch(error => {
      console.error('Triage workflow failed:', error)
    })

    res.status(201).json({
      message: 'Ticket created successfully',
      ticket
    })

  } catch (error) {
    console.error('Create ticket error:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ message: errors.join(', ') })
    }

    res.status(500).json({ 
      message: 'Unable to create ticket. Please try again.' 
    })
  }
}

export const getTickets = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query
    const userId = req.user._id

    // Build filter based on user role
    let filter = {}
    
    if (req.user.role === 'user') {
      // Users can only see their own tickets
      filter.createdBy = userId
    } else if (req.user.role === 'agent') {
      // Agents can see assigned tickets + unassigned triaged tickets
      filter = {
        $or: [
          { assignee: userId },
          { status: { $in: ['triaged', 'waiting_human'] }, assignee: null }
        ]
      }
    }
    // Admins can see all tickets (no additional filter)

    // Add optional filters
    if (status) filter.status = status
    if (category) filter.category = category

    const skip = (page - 1) * limit
    
    const tickets = await Ticket.find(filter)
      .populate('createdBy', 'name email role')
      .populate('assignee', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Ticket.countDocuments(filter)

    res.json({
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get tickets error:', error)
    res.status(500).json({ 
      message: 'Unable to fetch tickets. Please try again.' 
    })
  }
}

export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user._id
    const userRole = req.user.role

    const ticket = await Ticket.findById(id)
      .populate('createdBy', 'name email role')
      .populate('assignee', 'name email')
      .populate('replies.author', 'name email role')

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' })
    }

    // Check access permissions
    if (userRole === 'user' && ticket.createdBy._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' })
    }

    if (userRole === 'agent' && 
        ticket.createdBy._id.toString() !== userId.toString() && 
        (!ticket.assignee || ticket.assignee._id.toString() !== userId.toString())) {
      return res.status(403).json({ message: 'Access denied' })
    }

    res.json({ ticket })

  } catch (error) {
    console.error('Get ticket error:', error)
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid ticket ID' })
    }

    res.status(500).json({ 
      message: 'Unable to fetch ticket. Please try again.' 
    })
  }
}

// GET /api/tickets/agent - Get tickets for agents
export const getAgentTickets = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const agentId = req.user._id

    // Agents see: assigned tickets + unassigned waiting_human tickets
    let filter = {
      $or: [
        { assignee: agentId },
        { status: 'waiting_human', assignee: null }
      ]
    }

    if (status) filter.status = status

    const skip = (page - 1) * limit
    
    const tickets = await Ticket.find(filter)
      .populate('createdBy', 'name email role')
      .populate('assignee', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Ticket.countDocuments(filter)

    res.json({
      tickets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get agent tickets error:', error)
    res.status(500).json({ 
      message: 'Unable to fetch tickets. Please try again.' 
    })
  }
}

// GET /api/agent/suggestion/:ticketId - Get AI suggestion for ticket
export const getSuggestion = async (req, res) => {
  try {
    const { ticketId } = req.params

    const suggestion = await AgentSuggestion.findOne({ ticketId })
      .populate('articleIds', 'title')

    if (!suggestion) {
      return res.status(404).json({ message: 'No AI suggestion found for this ticket' })
    }

    res.json({ suggestion })

  } catch (error) {
    console.error('Get suggestion error:', error)
    res.status(500).json({ 
      message: 'Unable to fetch suggestion. Please try again.' 
    })
  }
}

// POST /api/tickets/:id/reply - Agent sends reply
export const sendReply = async (req, res) => {
  try {
    const { id } = req.params
    const { content, action = 'resolve' } = req.body
    const agentId = req.user._id

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Reply content is required' })
    }

    const ticket = await Ticket.findById(id)
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' })
    }

    // Add agent reply
    ticket.replies.push({
      author: agentId,
      authorType: 'agent',
      content: content.trim()
    })

    // Update status based on action
    if (action === 'resolve') {
      ticket.status = 'resolved'
    }

    // Assign to agent if not already assigned
    if (!ticket.assignee) {
      ticket.assignee = agentId
    }

    await ticket.save()
    await ticket.populate(['createdBy', 'assignee'], 'name email')

    // Log the action
    const auditLog = new AuditLog({
      ticketId: ticket._id,
      traceId: `agent-${Date.now()}`,
      actor: 'agent',
      action: 'REPLY_SENT',
      meta: {
        agentId: agentId.toString(),
        replyLength: content.length,
        newStatus: ticket.status
      }
    })
    await auditLog.save()

    res.json({
      message: 'Reply sent successfully',
      ticket
    })

  } catch (error) {
    console.error('Send reply error:', error)
    res.status(500).json({ 
      message: 'Unable to send reply. Please try again.' 
    })
  }
}

// POST /api/tickets/:id/assign - Assign ticket to agent
export const assignTicket = async (req, res) => {
  try {
    const { id } = req.params
    const { agentId } = req.body

    const ticket = await Ticket.findById(id)
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' })
    }

    ticket.assignee = agentId || req.user._id
    await ticket.save()
    await ticket.populate(['createdBy', 'assignee'], 'name email')

    // Log the action
    const auditLog = new AuditLog({
      ticketId: ticket._id,
      traceId: `assign-${Date.now()}`,
      actor: 'agent',
      action: 'TICKET_ASSIGNED',
      meta: {
        assignedTo: ticket.assignee.toString(),
        assignedBy: req.user._id.toString()
      }
    })
    await auditLog.save()

    res.json({
      message: 'Ticket assigned successfully',
      ticket
    })

  } catch (error) {
    console.error('Assign ticket error:', error)
    res.status(500).json({ 
      message: 'Unable to assign ticket. Please try again.' 
    })
  }
}