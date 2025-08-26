import express from 'express'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import { getConfig, updateConfig } from '../controllers/configController.js'

const router = express.Router()

// All config routes require admin authentication
router.use(authenticateToken)
router.use(requireAdmin)

router
  .route('/')
  .get(getConfig)
  .put(updateConfig)

export default router