import express from 'express'
import { getSuggestion } from '../controllers/ticketController.js'
import { authenticateToken, requireAgent } from '../middleware/auth.js'

const router = express.Router()

// All agent routes require authentication and agent role
router.use(authenticateToken)
router.use(requireAgent)

// Get AI suggestion for a ticket
router.get('/suggestion/:ticketId', getSuggestion)

// Trigger manual triage (optional - for testing)
router.post('/triage', async (req, res) => {
  try {
    const { ticketId } = req.body
    
    if (!ticketId) {
      return res.status(400).json({ message: 'Ticket ID is required' })
    }

    // Import here to avoid circular dependency
    const TriageWorkflow = (await import('../../../agent/workflows/triageWorkflow.js')).default
    const triage = new TriageWorkflow()
    
    const result = await triage.processTicket(ticketId)
    
    res.json({
      message: 'Triage completed',
      result
    })

  } catch (error) {
    console.error('Manual triage error:', error)
    res.status(500).json({ 
      message: 'Failed to process triage',
      error: error.message 
    })
  }
})

export default router