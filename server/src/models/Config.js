import mongoose from 'mongoose'

const configSchema = new mongoose.Schema({
  autoCloseEnabled: {
    type: Boolean,
    default: true
  },
  confidenceThreshold: {
    type: Number,
    default: 0.78,
    min: 0,
    max: 1
  },
  slaHours: {
    type: Number,
    default: 24,
    min: 1
  }
}, {
  timestamps: true
})

// Ensure only one config document
configSchema.statics.getConfig = async function() {
  let config = await this.findOne()
  if (!config) {
    config = await this.create({})
  }
  return config
}

export default mongoose.model('Config', configSchema)