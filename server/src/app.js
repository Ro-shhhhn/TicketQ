import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth.js'
import ticketRoutes from './routes/tickets.js'

const app = express()

// Security middleware
app.use(helmet())

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`)
  })
  next()
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/tickets', ticketRoutes)

// Health check endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.get('/api/healthz', (req, res) => {
  res.json({ status: 'OK', service: 'ticketq-api' })
})

app.get('/api/readyz', (req, res) => {
  res.json({ status: 'ready', timestamp: new Date().toISOString() })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error)
  res.status(500).json({ message: 'Internal server error' })
})

export default app