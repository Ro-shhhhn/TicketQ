import { useState, useEffect } from 'react'
import { configAPI } from '../../services/config'

const Settings = () => {
  const [config, setConfig] = useState({
    autoCloseEnabled: true,
    confidenceThreshold: 0.78,
    slaHours: 24
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await configAPI.getConfig()
      setConfig(response.config)
    } catch (err) {
      setError(err.message || 'Failed to load configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError('')
      setMessage('')

      const response = await configAPI.updateConfig(config)
      setConfig(response.config)
      setMessage('Configuration updated successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleReset = () => {
    loadConfig()
    setMessage('')
    setError('')
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/4"></div>
          <div className="space-y-6">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
        <p className="mt-1 text-sm text-gray-600">
          Configure AI triage behavior and system parameters
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Messages */}
        {message && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{message}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Auto Close Setting */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            AI Auto-Resolution
          </label>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => handleInputChange('autoCloseEnabled', !config.autoCloseEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                config.autoCloseEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.autoCloseEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-600">
              {config.autoCloseEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            When enabled, tickets with high confidence scores will be automatically resolved
          </p>
        </div>

        {/* Confidence Threshold */}
        <div className="space-y-2">
          <label htmlFor="confidenceThreshold" className="text-sm font-medium text-gray-700">
            Confidence Threshold
          </label>
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <input
                type="range"
                id="confidenceThreshold"
                min="0"
                max="1"
                step="0.01"
                value={config.confidenceThreshold}
                onChange={(e) => handleInputChange('confidenceThreshold', parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="w-16 px-3 py-1 text-sm bg-gray-100 rounded border text-center">
                {(config.confidenceThreshold * 100).toFixed(0)}%
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>0% (Low confidence)</span>
              <span>50% (Medium confidence)</span>
              <span>100% (High confidence)</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Only tickets above this confidence level will be auto-resolved when auto-resolution is enabled
          </p>
        </div>

        {/* SLA Hours */}
        <div className="space-y-2">
          <label htmlFor="slaHours" className="text-sm font-medium text-gray-700">
            SLA Response Time (Hours)
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="number"
              id="slaHours"
              min="1"
              max="168"
              value={config.slaHours}
              onChange={(e) => handleInputChange('slaHours', parseInt(e.target.value))}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-sm text-gray-600">hours</span>
          </div>
          <p className="text-sm text-gray-500">
            Expected response time for tickets. Used for SLA breach detection.
          </p>
        </div>

        {/* Configuration Preview */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Current Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Auto-resolution:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                config.autoCloseEnabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {config.autoCloseEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
            <div>
              <span className="font-medium">Threshold:</span>
              <span className="ml-2 font-mono">{(config.confidenceThreshold * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="font-medium">SLA:</span>
              <span className="ml-2 font-mono">{config.slaHours}h</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Reset Changes
          </button>
          
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Save Configuration'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Settings