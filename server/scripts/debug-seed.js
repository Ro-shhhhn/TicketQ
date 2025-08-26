import mongoose from 'mongoose'

console.log('🚀 Starting debug seed script...')

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/helpdesk'
    console.log('📡 Connecting to:', mongoURI)
    await mongoose.connect(mongoURI)
    console.log('✅ MongoDB connected for seeding')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

const testImports = async () => {
  try {
    console.log('📦 Testing imports...')
    
    // Test User model import
    try {
      const User = (await import('../src/models/User.js')).default
      console.log('✅ User model imported successfully')
      const userCount = await User.countDocuments({})
      console.log(`   Current users: ${userCount}`)
    } catch (error) {
      console.error('❌ User model import failed:', error.message)
    }

    // Test Article model import
    try {
      const Article = (await import('../src/models/Article.js')).default
      console.log('✅ Article model imported successfully')
      const articleCount = await Article.countDocuments({})
      console.log(`   Current articles: ${articleCount}`)
    } catch (error) {
      console.error('❌ Article model import failed:', error.message)
      console.log('💡 You need to create/update the Article model')
    }

    // Test Config model import
    try {
      const Config = (await import('../src/models/Config.js')).default
      console.log('✅ Config model imported successfully')
      const configCount = await Config.countDocuments({})
      console.log(`   Current configs: ${configCount}`)
    } catch (error) {
      console.error('❌ Config model import failed:', error.message)
      console.log('💡 You need to create the Config model')
    }

  } catch (error) {
    console.error('❌ Import test failed:', error)
  }
}

const main = async () => {
  try {
    await connectDB()
    await testImports()
    console.log('🎉 Debug complete!')
  } catch (error) {
    console.error('💥 Debug failed:', error)
  } finally {
    await mongoose.connection.close()
    console.log('📡 Database connection closed')
  }
}

main()