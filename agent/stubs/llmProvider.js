// Deterministic LLM stub for development/demo
class LLMProvider {
  constructor() {
    this.isStubMode = process.env.STUB_MODE === 'true'
    
    // Keywords for classification
    this.categoryKeywords = {
      billing: ['refund', 'invoice', 'payment', 'charge', 'bill', 'subscription', 'pricing', 'cost'],
      tech: ['error', 'bug', 'crash', 'login', 'password', 'broken', 'not working', '500', '404', 'stack trace'],
      shipping: ['delivery', 'shipment', 'package', 'tracking', 'delayed', 'shipping', 'order', 'address']
    }
  }

  async classify(text) {
    const startTime = Date.now()
    
    if (this.isStubMode) {
      return this._stubClassify(text, startTime)
    }
    
    // TODO: Implement real LLM call here
    return this._stubClassify(text, startTime)
  }

  async draft(text, articles = []) {
    const startTime = Date.now()
    
    if (this.isStubMode) {
      return this._stubDraft(text, articles, startTime)
    }
    
    // TODO: Implement real LLM call here
    return this._stubDraft(text, articles, startTime)
  }

  _stubClassify(text, startTime) {
    const textLower = text.toLowerCase()
    let bestCategory = 'other'
    let maxMatches = 0

    // Count keyword matches for each category
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      const matches = keywords.filter(keyword => textLower.includes(keyword)).length
      if (matches > maxMatches) {
        maxMatches = matches
        bestCategory = category
      }
    }

    // Calculate confidence based on keyword matches
    const totalWords = text.split(' ').length
    const confidence = maxMatches > 0 ? 
      Math.min(0.95, 0.4 + (maxMatches / totalWords) * 2) : 
      0.3 + Math.random() * 0.3 // Random low confidence for 'other'

    const latencyMs = Date.now() - startTime

    return {
      predictedCategory: bestCategory,
      confidence: Math.round(confidence * 100) / 100, // Round to 2 decimals
      modelInfo: {
        provider: 'stub',
        model: 'deterministic-v1',
        promptVersion: '1.0',
        latencyMs
      }
    }
  }

  _stubDraft(text, articles, startTime) {
    const classification = this._stubClassify(text)
    const category = classification.predictedCategory

    // Generate response based on category and articles
    let draftReply = this._getBaseResponse(category)
    
    // Add article references if available
    const citations = []
    if (articles && articles.length > 0) {
      draftReply += '\n\nI found these helpful resources:\n'
      articles.slice(0, 3).forEach((article, index) => {
        draftReply += `\n${index + 1}. ${article.title}`
        citations.push(article._id.toString())
      })
      draftReply += '\n\nPlease review these articles and let me know if you need further assistance.'
    } else {
      draftReply += '\n\nI\'ll connect you with a specialist who can help resolve this issue.'
    }

    const latencyMs = Date.now() - startTime

    return {
      draftReply,
      citations,
      confidence: classification.confidence,
      modelInfo: {
        provider: 'stub',
        model: 'deterministic-v1',
        promptVersion: '1.0',
        latencyMs
      }
    }
  }

  _getBaseResponse(category) {
    const responses = {
      billing: 'Thank you for contacting us about your billing inquiry. I understand your concern and I\'m here to help resolve this matter quickly.',
      tech: 'I\'m sorry to hear you\'re experiencing technical difficulties. Let me help you troubleshoot this issue.',
      shipping: 'Thank you for reaching out about your shipment. I\'ll help you track your order and resolve any delivery concerns.',
      other: 'Thank you for contacting our support team. I\'ve received your inquiry and will make sure you get the help you need.'
    }
    
    return responses[category] || responses.other
  }
}

export default LLMProvider