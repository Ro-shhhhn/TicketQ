import mongoose from 'mongoose'
import User from '../src/models/User.js'
import Article from '../src/models/Article.js'
import Config from '../src/models/Config.js'

console.log('🚀 Starting direct seed script...')

// Database connection
const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/helpdesk'
  console.log('📡 Connecting to:', mongoURI)
  await mongoose.connect(mongoURI)
  console.log('✅ Database connected')
}

// Main seeding function
const seedData = async () => {
  try {
    console.log('🌱 Starting seeding process...')
    
    // Connect
    await connectDB()
    
    // Find existing users
    const users = await User.find({})
    console.log(`👥 Found ${users.length} existing users`)
    
    let adminUser = await User.findOne({ role: 'admin' })
    let agentUser = await User.findOne({ role: 'agent' })
    let regularUser = await User.findOne({ role: 'user' })
    
    if (!adminUser) {
      console.log('👑 Creating admin user...')
      adminUser = new User({
        name: 'Admin User',
        email: 'admin@ticketq.com',
        password: 'Admin123!',
        role: 'admin'
      })
      await adminUser.save()
      console.log('✅ Admin user created')
    } else {
      console.log('✅ Admin user exists')
    }
    
    if (!agentUser) {
      console.log('🎧 Creating agent user...')
      agentUser = new User({
        name: 'Support Agent', 
        email: 'agent@ticketq.com',
        password: 'Agent123!',
        role: 'agent'
      })
      await agentUser.save()
      console.log('✅ Agent user created')
    } else {
      console.log('✅ Agent user exists')
    }

    if (!regularUser) {
      console.log('👤 Creating regular user...')
      regularUser = new User({
        name: 'Regular User',
        email: 'user@ticketq.com',
        password: 'User123!',
        role: 'user'
      })
      await regularUser.save()
      console.log('✅ Regular user created')
    } else {
      console.log('✅ Regular user exists')
    }
    
    // Clear and create articles
    console.log('📚 Creating KB articles...')
    await Article.deleteMany({})
    console.log('🗑️  Cleared existing articles')
    
    const articlesData = [
      {
        title: 'How to Update Payment Method',
        body: 'Step by step guide to update your payment information:\n\n1. Login to your account\n2. Go to Settings > Billing\n3. Click Update Payment Method\n4. Enter new card details\n5. Save changes\n\nWe accept Visa, MasterCard, and PayPal.',
        tags: ['billing', 'payment', 'credit-card'],
        status: 'published'
      },
      {
        title: 'Troubleshooting Login Issues', 
        body: 'Having trouble logging in? Try these steps:\n\n1. Check your email and password\n2. Clear browser cache\n3. Try incognito mode\n4. Reset your password\n5. Contact support\n\nCommon issues: Caps Lock, wrong email, expired session.',
        tags: ['tech', 'login', 'password'],
        status: 'published'
      },
      {
        title: 'Server Error Solutions',
        body: '500 and 404 error fixes:\n\n**500 Internal Server Error:**\n- Refresh the page\n- Clear cache\n- Try different browser\n- Contact support if persistent\n\n**404 Page Not Found:**\n- Check URL spelling\n- Use navigation menu\n- Search for content',
        tags: ['tech', 'error', '500', '404'],
        status: 'published'
      },
      {
        title: 'Order Tracking Guide',
        body: 'Track your shipment easily:\n\n1. Check your email for tracking number\n2. Visit our tracking page\n3. Enter tracking number\n4. View real-time updates\n\n**Shipping Times:**\n- Standard: 5-7 days\n- Express: 2-3 days\n- Overnight: Next business day',
        tags: ['shipping', 'tracking', 'delivery'],
        status: 'published'
      },
      {
        title: 'Refund and Returns Policy',
        body: 'Easy returns within 30 days:\n\n**Return Process:**\n1. Login to your account\n2. Find your order\n3. Click Return Item\n4. Select reason\n5. Print return label\n6. Ship back to us\n\n**Refund Timeline:**\n- Processing: 3-5 business days\n- Refund to card: 5-7 business days',
        tags: ['billing', 'refund', 'returns'],
        status: 'published'
      },
      {
        title: 'API Rate Limits and Throttling',
        body: 'Understanding API rate limits:\n\n**Rate Limits:**\n- Free tier: 100 requests/hour\n- Pro tier: 1000 requests/hour\n- Enterprise: Custom limits\n\n**When you hit limits:**\n1. Wait for reset window\n2. Implement exponential backoff\n3. Cache responses when possible\n4. Upgrade your plan\n\n**HTTP Status Codes:**\n- 429: Too Many Requests\n- 503: Service Unavailable',
        tags: ['tech', 'api', 'limits'],
        status: 'published'
      }
    ]
    
    console.log(`📝 Creating ${articlesData.length} articles...`)
    for (let i = 0; i < articlesData.length; i++) {
      const article = new Article(articlesData[i])
      await article.save()
      console.log(`   ✅ "${articlesData[i].title}"`)
    }
    
    // Create config
    console.log('⚙️  Setting up configuration...')
    await Config.deleteMany({})
    const config = new Config({
      autoCloseEnabled: true,
      confidenceThreshold: 0.75,
      slaHours: 24
    })
    await config.save()
    console.log('✅ Configuration created')
    
    // Success summary
    console.log('\n🎉 SEEDING COMPLETED SUCCESSFULLY!')
    console.log('=' .repeat(50))
    console.log(`👥 Users ready: ${await User.countDocuments()} total`)
    console.log(`📚 KB Articles: ${await Article.countDocuments()} created`)
    console.log(`⚙️  Config: Auto-close at ${config.confidenceThreshold * 100}% confidence`)
    console.log('\n🔑 Test Accounts:')
    console.log('   Admin: admin@ticketq.com / Admin123!')
    console.log('   Agent: agent@ticketq.com / Agent123!')
    console.log('   User: user@ticketq.com / User123!')
    console.log('\n✨ Ready to test the triage system!')
    
  } catch (error) {
    console.error('\n❌ SEEDING FAILED!')
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('\n📡 Database connection closed')
  }
}

// Run the seed
seedData().catch(error => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})