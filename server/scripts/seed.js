import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import User from "../src/models/User.js";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/helpdesk'
    await mongoose.connect(mongoURI)
    console.log('✅ MongoDB connected for seeding')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

const seedUsers = async () => {
  try {
    console.log('🌱 Seeding users...')
    
    // Read seed data
    const usersData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../database/seeds/users.json'), 'utf8')
    )

    // Clear existing users (optional - comment out to preserve existing users)
    await User.deleteMany({})
    console.log('🧹 Cleared existing users')

    // Create users WITHOUT manual password hashing
    // Let the User model's pre('save') middleware handle password hashing
    const users = usersData.map(userData => ({
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: userData.password, // Don't hash here - let the model do it
      role: userData.role
    }))

    // Insert users using create() instead of insertMany()
    // This ensures the pre('save') middleware runs
    const createdUsers = []
    for (const userData of users) {
      const user = new User(userData)
      const savedUser = await user.save()
      createdUsers.push(savedUser)
    }

    console.log(`✅ Created ${createdUsers.length} users:`)
    
    createdUsers.forEach(user => {
      console.log(`   ${user.role.toUpperCase()}: ${user.email}`)
    })

    return createdUsers
  } catch (error) {
    console.error('❌ Error seeding users:', error)
    throw error
  }
}

const seedArticles = async () => {
  try {
    console.log('📚 Seeding knowledge base articles...')
    
    // For now, we'll create some basic articles
    // In a full implementation, you'd have an Article model and seed data
    const articles = [
      {
        title: "How to reset your password",
        body: "To reset your password: 1. Go to login page 2. Click 'Forgot Password' 3. Enter your email 4. Check your email for reset link 5. Follow the instructions in the email",
        tags: ["password", "account", "reset"],
        status: "published"
      },
      {
        title: "How to update payment method", 
        body: "To update your payment method: 1. Log into your account 2. Go to Account Settings 3. Select Payment Methods 4. Add new card or update existing 5. Save changes",
        tags: ["billing", "payments", "credit-card"],
        status: "published"
      },
      {
        title: "Troubleshooting login issues",
        body: "If you can't log in: 1. Check your email and password 2. Clear browser cache 3. Try incognito/private mode 4. Reset your password if needed 5. Contact support if issue persists",
        tags: ["login", "troubleshooting", "access"],
        status: "published"
      },
      {
        title: "How to track your order",
        body: "To track your order: 1. Log into your account 2. Go to Order History 3. Find your order 4. Click tracking link 5. View real-time updates",
        tags: ["shipping", "tracking", "orders"],
        status: "published"
      },
      {
        title: "Refund policy and process",
        body: "Our refund policy: Items can be returned within 30 days. Process: 1. Log into account 2. Go to Orders 3. Select item to return 4. Choose reason 5. Print return label 6. Ship item back",
        tags: ["refunds", "returns", "policy"],
        status: "published"
      }
    ]
    
    console.log(`📝 Would create ${articles.length} KB articles (Article model needed)`)
    return articles
  } catch (error) {
    console.error('❌ Error seeding articles:', error)
    throw error
  }
}

const seedConfig = async () => {
  try {
    console.log('⚙️ Seeding system configuration...')
    
    const config = {
      autoCloseEnabled: true,
      confidenceThreshold: 0.75,
      slaHours: 24
    }
    
    console.log('📝 Would create system config (Config model needed)')
    console.log('   Config:', config)
    return config
  } catch (error) {
    console.error('❌ Error seeding config:', error)
    throw error
  }
}

const main = async () => {
  try {
    console.log('🚀 Starting database seeding...')
    console.log('=' .repeat(50))
    
    await connectDB()
    
    // Seed data
    await seedUsers()
    await seedArticles() 
    await seedConfig()
    
    console.log('=' .repeat(50))
    console.log('🎉 Database seeding completed successfully!')
    console.log('')
    console.log('Demo Accounts Created:')
    console.log('📧 Admin: admin@ticketq.com / Admin123!')
    console.log('🎧 Agent: agent@ticketq.com / Agent123!')
    console.log('👤 User:  user@ticketq.com / User123!')
    console.log('')
    console.log('💡 Users can register new accounts (role: user only)')
    console.log('💡 Admin/Agent accounts are seeded and cannot register')
    
  } catch (error) {
    console.error('💥 Seeding failed:', error)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    console.log('📡 Database connection closed')
  }
}

// Run if this file is executed directly
if (process.argv[1] === __filename) {
  main()
}

export default main