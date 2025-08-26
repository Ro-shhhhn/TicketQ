import Config from '../models/Config.js'

// GET /api/config - Get configuration (Admin only)
export const getConfig = async (req, res) => {
  try {
    let config = await Config.findOne()
    
    if (!config) {
      // Create default config if none exists
      config = new Config({
        autoCloseEnabled: true,
        confidenceThreshold: 0.78,
        slaHours: 24
      })
      await config.save()
    }
    
    res.json({ config })
    
  } catch (error) {
    console.error('Get config error:', error)
    res.status(500).json({ 
      message: 'Failed to fetch configuration' 
    })
  }
}

// PUT /api/config - Update configuration (Admin only)
export const updateConfig = async (req, res) => {
  try {
    const { autoCloseEnabled, confidenceThreshold, slaHours } = req.body

    // Validation
    if (confidenceThreshold !== undefined) {
      if (typeof confidenceThreshold !== 'number' || confidenceThreshold < 0 || confidenceThreshold > 1) {
        return res.status(400).json({
          message: 'Confidence threshold must be a number between 0 and 1'
        })
      }
    }

    if (slaHours !== undefined) {
      if (!Number.isInteger(slaHours) || slaHours < 1) {
        return res.status(400).json({
          message: 'SLA hours must be a positive integer'
        })
      }
    }

    if (autoCloseEnabled !== undefined) {
      if (typeof autoCloseEnabled !== 'boolean') {
        return res.status(400).json({
          message: 'Auto close enabled must be a boolean'
        })
      }
    }

    // Find existing config or create new
    let config = await Config.findOne()
    
    if (!config) {
      config = new Config()
    }

    // Update fields
    if (autoCloseEnabled !== undefined) config.autoCloseEnabled = autoCloseEnabled
    if (confidenceThreshold !== undefined) config.confidenceThreshold = confidenceThreshold
    if (slaHours !== undefined) config.slaHours = slaHours

    await config.save()

    res.json({
      message: 'Configuration updated successfully',
      config
    })

  } catch (error) {
    console.error('Update config error:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ message: errors.join(', ') })
    }

    res.status(500).json({ 
      message: 'Failed to update configuration' 
    })
  }
}