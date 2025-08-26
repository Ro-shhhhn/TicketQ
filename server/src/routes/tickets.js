import express from 'express'
import {
  createTicket,
  getTickets,
  getTicketById,
  getAgentTickets,
  sendReply,
  assignTicket,
  getTicketAuditLog
} from '../controllers/ticketController.js'
import { authenticateToken, requireAgent } from '../middleware/auth.js'

const router = express.Router()

// All ticket routes require authentication
router.use(authenticateToken)

// User/general ticket routes
router.post('/', createTicket)
router.get('/', getTickets)

// Agent-specific routes (MUST come before /:id routes)
router.get('/agent', requireAgent, getAgentTickets)

// Individual ticket routes
router.get('/:id', getTicketById)
router.get('/:id/audit', getTicketAuditLog)
router.post('/:id/reply', requireAgent, sendReply)
router.post('/:id/assign', requireAgent, assignTicket)

export default router