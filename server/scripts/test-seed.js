console.log('🚀 Script started...')

// Test 1: Basic imports
try {
  console.log('📦 Testing imports...')
  
  const mongoose = await import('mongoose')
  console.log('✅ Mongoose imported')
  
  const User = (await import('../src/models/User.js')).default
  console.log('✅ User model imported')
  
  const Article = (await import('../src/models/Article.js')).default
  console.log('✅ Article model imported')
  
  const Config = (await import('../src/models/Config.js')).default
  console.log('✅ Config model imported')
  
} catch (error) {
  console.error('❌ Import error:', error.message)
  process.exit(1)
}

// Test 2: Database connection
try {
  console.log('🔌 Testing database connection...')
  
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/helpdesk'
  console.log('📡 Connecting to:', mongoURI)
  
  const mongoose = (await import('mongoose')).default
  await mongoose.connect(mongoURI)
  console.log('✅ Database connected')
  
  // Quick count test
  const User = (await import('../src/models/User.js')).default
  const userCount = await User.countDocuments()
  console.log(`👥 Found ${userCount} users`)
  
  await mongoose.connection.close()
  console.log('📡 Database disconnected')
  
} catch (error) {
  console.error('❌ Database error:', error.message)
  console.error('Stack:', error.stack)
  process.exit(1)
}

console.log('✅ All tests passed! Basic functionality works.')
console.log('💡 The issue might be in the main seed logic.')