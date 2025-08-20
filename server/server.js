import dotenv from 'dotenv'
import app from './src/app.js'
import connectDatabase from './src/config/database.js'

// Load environment variables
dotenv.config()

const PORT = process.env.PORT || 5000

// Connect to database
connectDatabase()

// Start server
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`)
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`)
})