import express from 'express'
import { 
  getArticles, 
  getArticleById, 
  createArticle, 
  updateArticle, 
  deleteArticle 
} from '../controllers/kbController.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// Public search (for agents/users)
router.get('/', authenticateToken, getArticles)
router.get('/:id', authenticateToken, getArticleById)

// Admin only routes
router.post('/', authenticateToken, requireAdmin, createArticle)
router.put('/:id', authenticateToken, requireAdmin, updateArticle)
router.delete('/:id', authenticateToken, requireAdmin, deleteArticle)

export default router