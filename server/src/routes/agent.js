import express from 'express'
import { getSuggestion } from '../controllers/ticketController.js'
import { authenticateToken, requireAgent } from '../middleware/auth.js'

const router = express.Router()

// All agent routes require authentication and agent/admin role
router.use(authenticateToken)
router.use(requireAgent)

// GET /api/agent/suggestion/:ticketId
router.get('/suggestion/:ticketId', getSuggestion)

export default router