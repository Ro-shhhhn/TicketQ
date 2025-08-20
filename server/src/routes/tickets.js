import express from 'express'
import { createTicket, getTickets, getTicketById } from '../controllers/ticketController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// All ticket routes require authentication
router.use(authenticateToken)

// POST /api/tickets - Create new ticket
router.post('/', createTicket)

// GET /api/tickets - Get user's tickets with filters
router.get('/', getTickets)

// GET /api/tickets/:id - Get specific ticket
router.get('/:id', getTicketById)

export default router