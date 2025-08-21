import express from 'express'
import { 
  createTicket, 
  getTickets, 
  getTicketById, 
  getAgentTickets,
  sendReply,
  assignTicket
} from '../controllers/ticketController.js'
import { authenticateToken, requireAgent } from '../middleware/auth.js'

const router = express.Router()

// All ticket routes require authentication
router.use(authenticateToken)

// IMPORTANT: Agent routes must come BEFORE generic routes
// Agent-specific routes (must be before /:id route)
router.get('/agent', requireAgent, getAgentTickets)

// User routes
router.post('/', createTicket)
router.get('/', getTickets)

// Agent action routes (must be before /:id route)
router.post('/:id/reply', requireAgent, sendReply)
router.post('/:id/assign', requireAgent, assignTicket)

// Generic route (must be last)
router.get('/:id', getTicketById)

export default router