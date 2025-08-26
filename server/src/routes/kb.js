import express from 'express'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle
} from '../controllers/kbController.js'

const router = express.Router()

// Public routes (for searching published articles)
router.get('/', getArticles)
router.get('/:id', getArticleById)

// Protected routes - Admin only for CRUD operations
router.use(authenticateToken)
router.post('/', requireAdmin, createArticle)
router.put('/:id', requireAdmin, updateArticle)
router.delete('/:id', requireAdmin, deleteArticle)

export default router