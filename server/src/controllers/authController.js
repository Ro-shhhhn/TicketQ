import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  })
}

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Name, email, and password are required' 
      })
    }

    // Validate name format
    if (!/^[a-zA-Z\s\-'\.]+$/.test(name.trim()) || name.trim().length < 2) {
      return res.status(400).json({ 
        message: 'Name must contain only letters, spaces, hyphens, and apostrophes, and be at least 2 characters long' 
      })
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        message: 'Please provide a valid email address' 
      })
    }

    // Validate password strength
    const passwordChecks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    }

    const failedChecks = Object.entries(passwordChecks)
      .filter(([, passed]) => !passed)
      .map(([check]) => {
        switch (check) {
          case 'length': return 'at least 8 characters'
          case 'uppercase': return 'one uppercase letter'
          case 'lowercase': return 'one lowercase letter'
          case 'number': return 'one number'
          case 'symbol': return 'one special character'
          default: return check
        }
      })

    if (failedChecks.length > 0) {
      return res.status(400).json({ 
        message: `Password must include: ${failedChecks.join(', ')}` 
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({ 
        message: 'An account with this email already exists' 
      })
    }

    // Create new user - ALWAYS as 'user' role
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      role: 'user' // Hardcoded - only users can register
    })

    await user.save()

    // Generate token
    const token = generateToken(user._id)

    // Remove password from response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: userResponse
    })

  } catch (error) {
    console.error('Register error:', error)
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'An account with this email already exists' 
      })
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ 
        message: errors.join(', ') 
      })
    }

    res.status(500).json({ 
      message: 'Unable to create account. Please try again.' 
    })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      })
    }

    // Find user by email (case insensitive)
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      })
    }

    // Generate token
    const token = generateToken(user._id)

    // Remove password from response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ 
      message: 'Unable to sign in. Please try again.' 
    })
  }
}