import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
    validate: {
      validator: function(v) {
        return /^[a-zA-Z\s\-'\.]+$/.test(v)
      },
      message: 'Name can only contain letters, spaces, hyphens, and apostrophes'
    }
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      },
      message: 'Please provide a valid email address'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    validate: {
      validator: function(v) {
        // Only validate during creation/update, not when loading from DB
        if (this.isNew || this.isModified('password')) {
          // FIXED: Added missing dots in lookahead assertions
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(v)
        }
        return true
      },
      message: 'Password must include: at least 8 characters, one uppercase letter, one lowercase letter, one number, one special character'
    }
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'agent', 'admin'],
      message: 'Role must be either user, agent, or admin'
    },
    default: 'user'
  }
}, {
  timestamps: true
})

// Index for faster email lookups
userSchema.index({ email: 1 })

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified (or new)
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!candidatePassword || !this.password) {
    return false
  }
  return bcrypt.compare(candidatePassword, this.password)
}

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject()
  delete userObject.password
  return userObject
}

// Static method to find by email (case insensitive)
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() })
}

export default mongoose.model('User', userSchema)