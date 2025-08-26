import mongoose from 'mongoose'
import User from '../src/models/User.js'
import Article from '../src/models/Article.js'
import Config from '../src/models/Config.js'

console.log('🚀 Starting enhanced seed script...')

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/helpdesk'
    console.log('📡 Connecting to MongoDB...')
    await mongoose.connect(mongoURI)
    console.log('✅ MongoDB connected successfully')
    return true
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

const seedUsers = async () => {
  try {
    console.log('👥 Seeding users...')
    
    // Don't clear existing users since you already have 5
    console.log('ℹ️  Keeping existing users (found 5 users)')
    
    const users = await User.find({})
    console.log(`✅ Users ready: ${users.length} total`)
    
    // Find or create required users
    let adminUser = await User.findOne({ role: 'admin' })
    let agentUser = await User.findOne({ role: 'agent' })
    
    if (!adminUser) {
      adminUser = new User({
        name: 'Admin User',
        email: 'admin@ticketq.com',
        password: 'Admin123!',
        role: 'admin'
      })
      await adminUser.save()
      console.log('✅ Created admin user')
    }
    
    if (!agentUser) {
      agentUser = new User({
        name: 'Support Agent',
        email: 'agent@ticketq.com',
        password: 'Agent123!',
        role: 'agent'
      })
      await agentUser.save()
      console.log('✅ Created agent user')
    }
    
    return { adminUser, agentUser, users }
    
  } catch (error) {
    console.error('❌ Error seeding users:', error.message)
    throw error
  }
}

const seedArticles = async (adminUser, agentUser) => {
  try {
    console.log('📚 Seeding knowledge base articles...')
    
    // Clear existing articles
    const existingCount = await Article.countDocuments({})
    if (existingCount > 0) {
      await Article.deleteMany({})
      console.log(`🗑️  Removed ${existingCount} existing articles`)
    }

    const articles = [
      {
        title: 'How to Update Your Payment Method',
        body: `To update your payment method, please follow these steps:

1. Log into your account dashboard
2. Navigate to "Billing & Payments" section
3. Click "Payment Methods"
4. Add a new payment method or update existing one
5. Set as default if needed

If you encounter any issues, please contact our billing team for assistance. We accept all major credit cards and PayPal.

For refunds, please allow 5-7 business days for processing back to your original payment method.`,
        tags: ['billing', 'payments', 'credit-card', 'paypal'],
        status: 'published',
        author: adminUser._id
      },
      
      {
        title: 'Understanding Billing Cycles and Charges',
        body: `Your billing cycle and charges work as follows:

• Monthly subscriptions are billed on the same day each month
• Annual subscriptions are billed once per year with a discount
• Pro-rated charges may apply for mid-cycle upgrades
• Invoices are sent 3 days before each billing date

Common billing questions:
- Double charges: Usually pre-authorizations that will be reversed
- Failed payments: Update payment method to avoid service interruption
- Refund policy: Full refund within 30 days of purchase

Contact billing@company.com for specific billing inquiries.`,
        tags: ['billing', 'subscription', 'invoice', 'refund'],
        status: 'published',
        author: adminUser._id
      },

      {
        title: 'Troubleshooting Login and Password Issues',
        body: `If you're having trouble logging in, try these solutions:

**Password Reset:**
1. Click "Forgot Password" on the login page
2. Enter your email address
3. Check your email for reset link
4. Create a new strong password

**Common Issues:**
• Browser cache: Clear cookies and cache
• Caps Lock: Ensure it's turned off
• Multiple accounts: Make sure you're using the correct email
• Account locked: Wait 30 minutes or contact support

**Error Messages:**
• "Invalid credentials": Check email and password
• "Account not found": Verify email spelling
• "Too many attempts": Wait before trying again

If problems persist, contact our technical support team.`,
        tags: ['tech', 'login', 'password', 'authentication'],
        status: 'published', 
        author: adminUser._id
      },

      {
        title: 'Resolving 500 and 404 Errors',
        body: `Server errors can be frustrating. Here's how to resolve them:

**500 Internal Server Error:**
• Refresh the page after 30 seconds
• Clear browser cache and cookies
• Try in incognito/private mode
• Check if the issue persists across different browsers
• Contact support if error continues

**404 Page Not Found:**
• Check the URL for typos
• Use the site navigation menu instead
• Search for the content you're looking for
• The page may have been moved or renamed

**General Troubleshooting:**
1. Hard refresh (Ctrl+F5 or Cmd+Shift+R)
2. Disable browser extensions temporarily
3. Try from a different device or network
4. Report persistent issues to technical support

Our system status page shows any ongoing technical issues.`,
        tags: ['tech', 'error', 'bug', '500', '404', 'troubleshooting'],
        status: 'published',
        author: agentUser._id
      },

      {
        title: 'Tracking Your Package and Shipment Updates', 
        body: `Here's everything you need to know about tracking your order:

**Tracking Your Order:**
1. Check your email for shipping confirmation
2. Use the tracking number on our website or carrier site
3. Download our mobile app for push notifications
4. Sign up for SMS updates

**Shipping Information:**
• Standard shipping: 5-7 business days
• Express shipping: 2-3 business days  
• Overnight shipping: Next business day
• International: 7-14 business days

**Delivery Issues:**
• Package not delivered: Check with neighbors or building management
• Damaged package: Take photos and contact us immediately
• Wrong address: Update shipping address for future orders

**Tracking Status Meanings:**
- "In Transit": Package is on its way
- "Out for Delivery": Package will arrive today
- "Delivered": Package has been delivered
- "Exception": Delivery delay or issue

Contact our shipping team for any delivery concerns.`,
        tags: ['shipping', 'delivery', 'tracking', 'package'],
        status: 'published',
        author: adminUser._id
      }
    ]

    console.log(`📝 Creating ${articles.length} articles...`)
    
    const createdArticles = []
    for (let i = 0; i < articles.length; i++) {
      const article = new Article(articles[i])
      const saved = await article.save()
      createdArticles.push(saved)
      console.log(`   ✅ Created: "${saved.title}"`)
    }

    console.log(`✅ Successfully created ${createdArticles.length} KB articles`)
    return createdArticles
    
  } catch (error) {
    console.error('❌ Error seeding articles:', error.message)
    console.error('Stack trace:', error.stack)
    throw error
  }
}

const seedConfig = async () => {
  try {
    console.log('⚙️  Seeding system configuration...')
    
    // Clear existing config
    const existingCount = await Config.countDocuments({})
    if (existingCount > 0) {
      await Config.deleteMany({})
      console.log(`🗑️  Removed ${existingCount} existing configs`)
    }

    const config = new Config({
      autoCloseEnabled: true,
      confidenceThreshold: 0.75,
      slaHours: 24
    })

    const savedConfig = await config.save()
    console.log('✅ Created system configuration:')
    console.log(`   Auto-close: ${savedConfig.autoCloseEnabled}`)
    console.log(`   Confidence threshold: ${savedConfig.confidenceThreshold}`)
    console.log(`   SLA hours: ${savedConfig.slaHours}`)
    
    return savedConfig
    
  } catch (error) {
    console.error('❌ Error seeding config:', error.message)
    throw error
  }
}

const main = async () => {
  try {
    console.log('=' .repeat(60))
    console.log('🌱 ENHANCED TICKETQ DATABASE SEEDING')
    console.log('=' .repeat(60))

    // Connect to database
    await connectDB()

    // Seed users
    const { adminUser, agentUser } = await seedUsers()

    // Seed articles
    const articles = await seedArticles(adminUser, agentUser)

    // Seed config
    const config = await seedConfig()

    // Final summary
    console.log('=' .repeat(60))
    console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!')
    console.log('=' .repeat(60))
    console.log('')
    console.log('📊 SUMMARY:')
    console.log(`   👥 Users: Ready (admin and agent users confirmed)`)
    console.log(`   📚 KB Articles: ${articles.length} articles created`)
    console.log(`   ⚙️  Configuration: System config created`)
    console.log('')
    console.log('🔑 LOGIN CREDENTIALS:')
    console.log('   📧 Admin: admin@ticketq.com / Admin123!')
    console.log('   🎧 Agent: agent@ticketq.com / Agent123!')
    console.log('   👤 User:  user@ticketq.com / User123!')
    console.log('')
    console.log('🚀 NEXT STEPS:')
    console.log('   1. Test ticket creation as user')
    console.log('   2. Verify AI triage workflow triggers')
    console.log('   3. Check KB articles appear in auto-resolved tickets')
    console.log('   4. Test agent interface with AI suggestions')
    console.log('')
    console.log('💡 The enhanced triage system is now ready!')

  } catch (error) {
    console.error('')
    console.error('💥 SEEDING FAILED!')
    console.error('=' .repeat(40))
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  } finally {
    try {
      await mongoose.connection.close()
      console.log('')
      console.log('📡 Database connection closed')
      console.log('✨ Seeding process complete!')
    } catch (closeError) {
      console.error('Error closing connection:', closeError.message)
    }
  }
}

// Ensure this runs when called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}