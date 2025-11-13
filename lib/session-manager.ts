import { nanoid } from 'nanoid'
import { offlineStorage, type StoredSession } from './offline-storage'
import { interviewTemplates } from '@/data/interview-templates'
import { openAIService } from './openai'
import type { InterviewSession, InterviewQuestion, QuestionSourceMetadata } from '@/types/interview'

export interface SessionCreateParams {
  templateId?: string
  userQuestionSetIds?: string[]
  includeDefaultQuestions?: boolean
  role?: string
  type: 'behavioral' | 'technical' | 'mixed'
  difficulty: 'easy' | 'medium' | 'hard'
  duration: number
  customQuestions?: InterviewQuestion[]
}

export class SessionManager {
  private static instance: SessionManager
  
  private constructor() {}
  
  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  // Create new interview session
  public async createSession(params: SessionCreateParams): Promise<InterviewSession> {
    const sessionId = nanoid()
    let questions: InterviewQuestion[] = []

    try {
      const questionSources: QuestionSourceMetadata = {}
      const selectedUserSetIds = params.userQuestionSetIds?.filter(id => !!id) ?? []
      const includeDefault = params.includeDefaultQuestions ?? false

      let userQuestions: InterviewQuestion[] = []
      if (selectedUserSetIds.length > 0) {
        userQuestions = offlineStorage.getQuestionsFromUserSetIds(selectedUserSetIds)
        if (userQuestions.length > 0) {
          questionSources.userSetIds = Array.from(new Set(selectedUserSetIds))
        }
      }

      const selectedTemplate = params.templateId
        ? interviewTemplates.find(t => t.id === params.templateId)
        : undefined
      const templateQuestions = selectedTemplate
        ? selectedTemplate.questions.map(question => ({
            ...question,
            origin: question.origin ?? 'template',
          }))
        : []
      let templateUsed = false

      if (userQuestions.length > 0) {
        questions = [...userQuestions]

        if (includeDefault) {
          const fallbackPool = templateQuestions.length > 0
            ? templateQuestions
            : this.getCachedQuestionsByType(params.type, params.difficulty)

          if (fallbackPool.length > 0) {
            questions = this.mergeQuestionCollections(questions, fallbackPool)
            questionSources.includedDefault = true

            if (templateQuestions.length > 0) {
              templateUsed = true
            }
          }
        }
      } else if (templateQuestions.length > 0) {
        questions = [...templateQuestions]
        templateUsed = true
      }

      if (questions.length === 0 && params.customQuestions) {
        questions = params.customQuestions
      }

      if (questions.length === 0) {
        if (typeof navigator !== 'undefined' && navigator.onLine && params.role) {
          try {
            const generatedQuestions = await openAIService.generateQuestions({
              role: params.role,
              type: params.type,
              difficulty: params.difficulty,
              count: Math.max(1, Math.floor(params.duration / 10)),
            })

            questions = generatedQuestions.map((q, index) => ({
              id: `generated-${sessionId}-${index}`,
              type: q.type as 'behavioral' | 'technical' | 'situational',
              difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
              question: q.question,
              followUp: q.followUp,
              timeLimit: q.timeLimit,
              origin: 'ai',
            }))

            questionSources.aiGenerated = true

            // Cache the generated questions for offline use
            offlineStorage.addQuestionsToCache(questions)
          } catch (error) {
            console.warn('Failed to generate AI questions, using cached questions:', error)
            questions = this.getCachedQuestionsByType(params.type, params.difficulty)
          }
        } else {
          // Use cached questions when offline or role information is missing
          questions = this.getCachedQuestionsByType(params.type, params.difficulty)
        }
      }

      if (questions.length === 0) {
        questions = this.getCachedQuestionsByType(params.type, params.difficulty)
      }

      if (templateUsed && selectedTemplate) {
        questionSources.templateId = selectedTemplate.id
      }

      const session: InterviewSession = {
        id: sessionId,
        type: params.type,
        duration: params.duration,
        difficulty: params.difficulty,
        questions,
        currentQuestionIndex: 0,
        status: 'setup',
        ...(Object.keys(questionSources).length > 0 ? { questionSources } : {}),
      }

      // Save to offline storage
      const storedSession: StoredSession = {
        id: sessionId,
        session,
        responses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      offlineStorage.saveSession(storedSession)

      return session
    } catch (error) {
      console.error('Failed to create session:', error)
      throw error
    }
  }

  private mergeQuestionCollections(
    primary: InterviewQuestion[],
    secondary: InterviewQuestion[]
  ): InterviewQuestion[] {
    const seen = new Set<string>()
    const merged: InterviewQuestion[] = []

    primary.forEach(question => {
      if (!seen.has(question.id)) {
        merged.push(question)
        seen.add(question.id)
      }
    })

    secondary.forEach(question => {
      if (!seen.has(question.id)) {
        merged.push(question)
        seen.add(question.id)
      }
    })

    return merged
  }

  // Get cached questions by type and difficulty
  private getCachedQuestionsByType(
    type: 'behavioral' | 'technical' | 'mixed', 
    difficulty: 'easy' | 'medium' | 'hard'
  ): InterviewQuestion[] {
    const allCachedQuestions = offlineStorage.getCachedQuestions()
    
    if (type === 'mixed') {
      return allCachedQuestions
        .filter(q => q.difficulty === difficulty)
        .slice(0, 5) // Limit to 5 questions for mixed interviews
    }
    
    return allCachedQuestions
      .filter(q => q.type === type && q.difficulty === difficulty)
      .slice(0, Math.min(8, allCachedQuestions.length))
  }

  // Save session response
  public saveResponse(
    sessionId: string, 
    questionId: string, 
    response: string, 
    duration: number
  ): void {
    const storedSession = offlineStorage.getSession(sessionId)
    if (!storedSession) {
      console.error('Session not found:', sessionId)
      return
    }

    // Add or update response
    const existingResponseIndex = storedSession.responses.findIndex(r => r.questionId === questionId)
    const responseData = {
      questionId,
      response,
      timestamp: new Date(),
      duration
    }

    if (existingResponseIndex >= 0) {
      storedSession.responses[existingResponseIndex] = responseData
    } else {
      storedSession.responses.push(responseData)
    }

    offlineStorage.saveSession(storedSession)
  }

  // Update session status
  public updateSessionStatus(sessionId: string, status: InterviewSession['status']): void {
    const storedSession = offlineStorage.getSession(sessionId)
    if (storedSession) {
      storedSession.session.status = status
      
      if (status === 'active' && !storedSession.session.startTime) {
        storedSession.session.startTime = new Date()
      } else if (status === 'completed' && !storedSession.session.endTime) {
        storedSession.session.endTime = new Date()
      }
      
      offlineStorage.saveSession(storedSession)
    }
  }

  // Get session with responses
  public getSessionWithResponses(sessionId: string): StoredSession | null {
    return offlineStorage.getSession(sessionId)
  }

  // Get all user sessions
  public getAllUserSessions(): StoredSession[] {
    return offlineStorage.getAllSessions()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // Calculate session statistics
  public getSessionStats(sessionId: string): {
    totalQuestions: number
    answeredQuestions: number
    averageResponseTime: number
    completionRate: number
  } | null {
    const storedSession = offlineStorage.getSession(sessionId)
    if (!storedSession) return null

    const totalQuestions = storedSession.session.questions.length
    const answeredQuestions = storedSession.responses.length
    const totalResponseTime = storedSession.responses.reduce((sum, r) => sum + r.duration, 0)
    const averageResponseTime = answeredQuestions > 0 ? totalResponseTime / answeredQuestions : 0
    const completionRate = (answeredQuestions / totalQuestions) * 100

    return {
      totalQuestions,
      answeredQuestions,
      averageResponseTime,
      completionRate
    }
  }

  // Export session data
  public exportSession(sessionId: string): string | null {
    const storedSession = offlineStorage.getSession(sessionId)
    if (!storedSession) return null

    return JSON.stringify({
      session: storedSession.session,
      responses: storedSession.responses,
      stats: this.getSessionStats(sessionId),
      exportedAt: new Date().toISOString()
    }, null, 2)
  }

  // Delete session
  public deleteSession(sessionId: string): boolean {
    try {
      offlineStorage.deleteSession(sessionId)
      return true
    } catch (error) {
      console.error('Failed to delete session:', error)
      return false
    }
  }
}

// Global instance
export const sessionManager = SessionManager.getInstance()
