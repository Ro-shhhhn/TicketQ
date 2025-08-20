import Ticket from '../models/Ticket.js'
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