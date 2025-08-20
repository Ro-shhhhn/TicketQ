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
      
      // Step 3: Retrieve KB articles (stub for now)
      const articles = await this._retrieveKBArticles(ticket, classification, traceId)
      
      // Step 4: Generate draft reply
      const draft = await this._generateDraft(ticket, articles, traceId)
      
      // Step 5: Make decision (auto-close or assign to human)
      const decision = await this._makeDecision(ticket, draft, config, traceId)

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
      // Search for relevant articles based on predicted category and ticket content
      const searchQuery = `${classification.predictedCategory} ${ticket.title}`
      
      const articles = await Article.search(searchQuery, { 
        status: 'published',
        limit: 3
      })

      await this._logAudit(ticket._id, traceId, 'system', 'KB_RETRIEVED', {
        articlesFound: articles.length,
        searchQuery,
        articleTitles: articles.map(a => a.title)
      })

      return articles

    } catch (error) {
      console.error('KB retrieval failed:', error)
      
      await this._logAudit(ticket._id, traceId, 'system', 'KB_RETRIEVED', {
        articlesFound: 0,
        error: error.message
      })

      return []
    }
  }

  async _generateDraft(ticket, articles, traceId) {
    const text = `${ticket.title} ${ticket.description}`
    const result = await this.llm.draft(text, articles)

    await this._logAudit(ticket._id, traceId, 'system', 'DRAFT_GENERATED', {
      draftLength: result.draftReply.length,
      citationsCount: result.citations.length,
      confidence: result.confidence
    })

    return result
  }

  async _makeDecision(ticket, draft, config, traceId) {
    const shouldAutoClose = config.autoCloseEnabled && 
                           draft.confidence >= config.confidenceThreshold

    // Create agent suggestion
    const suggestion = new AgentSuggestion({
      ticketId: ticket._id,
      predictedCategory: draft.predictedCategory || 'other',
      articleIds: draft.citations || [],
      draftReply: draft.draftReply,
      confidence: draft.confidence,
      autoClosed: shouldAutoClose,
      modelInfo: draft.modelInfo
    })

    await suggestion.save()

    if (shouldAutoClose) {
      // Auto-close the ticket
      await this._autoCloseTicket(ticket, suggestion, traceId)
      
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

  async _autoCloseTicket(ticket, suggestion, traceId) {
    // Add system reply
    ticket.replies.push({
      author: null,
      authorType: 'system',
      content: suggestion.draftReply
    })

    // Update ticket status
    ticket.status = 'resolved'
    ticket.agentSuggestionId = suggestion._id

    await ticket.save()

    await this._logAudit(ticket._id, traceId, 'system', 'AUTO_CLOSED', {
      confidence: suggestion.confidence,
      suggestionId: suggestion._id.toString()
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