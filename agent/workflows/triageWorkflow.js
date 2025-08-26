import { v4 as uuidv4 } from 'uuid'
import LLMProvider from '../stubs/llmProvider.js'
import AuditLog from '../../server/src/models/AuditLog.js'
import AgentSuggestion from '../../server/src/models/AgentSuggestion.js'
import Ticket from '../../server/src/models/Ticket.js'
import Article from '../../server/src/models/Article.js'
import Config from '../../server/src/models/Config.js'

class TriageWorkflow {
  constructor() {
    this.llm = new LLMProvider()
  }

  async processTicket(ticketId) {
    const traceId = uuidv4()
    
    try {
      console.log(`Starting triage for ticket ${ticketId} with trace ${traceId}`)

      // Step 1: Get ticket and config
      const ticket = await Ticket.findById(ticketId).populate('createdBy', 'name email')
      const config = await Config.getConfig()

      if (!ticket) {
        throw new Error('Ticket not found')
      }

      await this._logAudit(ticketId, traceId, 'system', 'TICKET_CREATED', {
        title: ticket.title,
        category: ticket.category
      })

      // Step 2: Classify the ticket
      const classification = await this._classifyTicket(ticket, traceId)
      
      // Step 3: Retrieve KB articles
      const articles = await this._retrieveKBArticles(ticket, classification, traceId)
      
      // Step 4: Generate draft reply
      const draft = await this._generateDraft(ticket, articles, classification, traceId)
      
      // Step 5: Make decision (auto-close or assign to human)
      const decision = await this._makeDecision(ticket, draft, classification, config, traceId)

      console.log(`Triage completed for ticket ${ticketId}. Decision: ${decision.action}`)
      
      return {
        success: true,
        traceId,
        suggestion: decision.suggestion,
        action: decision.action
      }

    } catch (error) {
      console.error(`Triage failed for ticket ${ticketId}:`, error)
      
      await this._logAudit(ticketId, traceId, 'system', 'TRIAGE_FAILED', {
        error: error.message
      })

      return {
        success: false,
        traceId,
        error: error.message
      }
    }
  }

  async _classifyTicket(ticket, traceId) {
    const text = `${ticket.title} ${ticket.description}`
    const result = await this.llm.classify(text)

    await this._logAudit(ticket._id, traceId, 'system', 'AGENT_CLASSIFIED', {
      predictedCategory: result.predictedCategory,
      confidence: result.confidence,
      originalCategory: ticket.category
    })

    return result
  }

  async _retrieveKBArticles(ticket, classification, traceId) {
    try {
      // Enhanced search query combining category and ticket content
      const searchTerms = [
        classification.predictedCategory,
        ...ticket.title.split(' ').slice(0, 3), // Key words from title
        ...ticket.description.split(' ').slice(0, 5) // Key words from description
      ].filter(term => term && term.length > 2) // Filter meaningful terms

      const searchQuery = searchTerms.join(' ')
      
      const articles = await Article.search(searchQuery, { 
        status: 'published',
        limit: 5
      })

      // If no articles found with search, try category-based search
      if (articles.length === 0 && classification.predictedCategory !== 'other') {
        const categoryArticles = await Article.find({
          status: 'published',
          tags: { $in: [classification.predictedCategory] }
        }).limit(3).lean()
        
        articles.push(...categoryArticles)
      }

      await this._logAudit(ticket._id, traceId, 'system', 'KB_RETRIEVED', {
        articlesFound: articles.length,
        searchQuery,
        articleTitles: articles.map(a => a.title),
        searchTerms: searchTerms
      })

      return articles.slice(0, 3) // Return top 3

    } catch (error) {
      console.error('KB retrieval failed:', error)
      
      await this._logAudit(ticket._id, traceId, 'system', 'KB_RETRIEVED', {
        articlesFound: 0,
        error: error.message
      })

      return []
    }
  }

  async _generateDraft(ticket, articles, classification, traceId) {
    const text = `${ticket.title} ${ticket.description}`
    const result = await this.llm.draft(text, articles)

    await this._logAudit(ticket._id, traceId, 'system', 'DRAFT_GENERATED', {
      draftLength: result.draftReply.length,
      citationsCount: result.citations?.length || articles.length,
      confidence: result.confidence,
      articlesUsed: articles.map(a => ({ id: a._id, title: a.title }))
    })

    return {
      ...result,
      // Ensure we have article references
      citations: result.citations || articles.map(a => a._id.toString()),
      articles: articles // Include full article objects
    }
  }

  async _makeDecision(ticket, draft, classification, config, traceId) {
    const shouldAutoClose = config.autoCloseEnabled && 
                           draft.confidence >= config.confidenceThreshold

    // Create agent suggestion with populated article references
    const suggestion = new AgentSuggestion({
      ticketId: ticket._id,
      predictedCategory: classification.predictedCategory,
      articleIds: draft.articles?.map(a => a._id) || [],
      draftReply: draft.draftReply,
      confidence: draft.confidence,
      autoClosed: shouldAutoClose,
      modelInfo: draft.modelInfo
    })

    await suggestion.save()

    if (shouldAutoClose) {
      // Auto-close the ticket with enhanced reply
      await this._autoCloseTicket(ticket, suggestion, draft.articles, traceId)
      
      return {
        action: 'auto_closed',
        suggestion
      }
    } else {
      // Assign to human
      await this._assignToHuman(ticket, suggestion, traceId)
      
      return {
        action: 'assigned_to_human',
        suggestion
      }
    }
  }

  async _autoCloseTicket(ticket, suggestion, articles, traceId) {
    // Create enhanced system reply with KB article references
    let systemReply = suggestion.draftReply

    // Add KB article references if available
    if (articles && articles.length > 0) {
      systemReply += '\n\n📚 **Helpful Resources:**\n'
      articles.forEach((article, index) => {
        systemReply += `${index + 1}. **${article.title}**\n   ${article.getSnippet ? article.getSnippet(150) : article.body.substring(0, 150)}...\n\n`
      })
      systemReply += 'If you need further assistance, please feel free to create a new ticket.'
    }

    // Add system reply
    ticket.replies.push({
      author: null,
      authorType: 'system',
      content: systemReply,
      metadata: {
        isAutoReply: true,
        confidence: suggestion.confidence,
        articleReferences: articles?.map(a => ({ id: a._id, title: a.title })) || []
      }
    })

    // Update ticket status
    ticket.status = 'resolved'
    ticket.agentSuggestionId = suggestion._id

    await ticket.save()

    await this._logAudit(ticket._id, traceId, 'system', 'AUTO_CLOSED', {
      confidence: suggestion.confidence,
      suggestionId: suggestion._id.toString(),
      articleReferencesAdded: articles?.length || 0
    })
  }

  async _assignToHuman(ticket, suggestion, traceId) {
    // Update ticket status
    ticket.status = 'waiting_human'
    ticket.agentSuggestionId = suggestion._id

    await ticket.save()

    await this._logAudit(ticket._id, traceId, 'system', 'ASSIGNED_TO_HUMAN', {
      confidence: suggestion.confidence,
      suggestionId: suggestion._id.toString()
    })
  }

  async _logAudit(ticketId, traceId, actor, action, meta = {}) {
    try {
      const auditLog = new AuditLog({
        ticketId,
        traceId,
        actor,
        action,
        meta
      })

      await auditLog.save()
    } catch (error) {
      console.error('Failed to log audit:', error)
    }
  }
}

export default TriageWorkflow