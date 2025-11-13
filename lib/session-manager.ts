import { nanoid } from 'nanoid'
import { offlineStorage, type StoredSession } from './offline-storage'
import { interviewTemplates } from '@/data/interview-templates'
import { openAIService } from './openai'
import type { InterviewSession, InterviewQuestion } from '@/types/interview'

export interface SessionCreateParams {
  templateId?: string
  role?: string
  type: 'behavioral' | 'technical' | 'mixed'
  difficulty: 'easy' | 'medium' | 'hard'
  duration: number
  customQuestions?: InterviewQuestion[]
  questionBankId?: string
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
      if (params.questionBankId) {
        // Use questions from question bank
        questions = await this.fetchQuestionsFromBank(params.questionBankId)
      } else if (params.templateId) {
        // Use template questions
        const template = interviewTemplates.find(t => t.id === params.templateId)
        if (template) {
          questions = template.questions
        }
      } else if (params.customQuestions) {
        // Use custom questions
        questions = params.customQuestions
      } else {
        // Generate AI questions if online, fallback to cached questions if offline
        if (navigator.onLine && params.role) {
          try {
            const generatedQuestions = await openAIService.generateQuestions({
              role: params.role,
              type: params.type,
              difficulty: params.difficulty,
              count: Math.floor(params.duration / 10), // Rough estimate of questions per duration
            })

            questions = generatedQuestions.map((q, index) => ({
              id: `generated-${sessionId}-${index}`,
              type: q.type as 'behavioral' | 'technical' | 'situational',
              difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
              question: q.question,
              followUp: q.followUp,
              timeLimit: q.timeLimit
            }))

            // Cache the generated questions for offline use
            offlineStorage.addQuestionsToCache(questions)
          } catch (error) {
            console.warn('Failed to generate AI questions, using cached questions:', error)
            questions = this.getCachedQuestionsByType(params.type, params.difficulty)
          }
        } else {
          // Use cached questions when offline
          questions = this.getCachedQuestionsByType(params.type, params.difficulty)
        }
      }

      const session: InterviewSession = {
        id: sessionId,
        type: params.type,
        duration: params.duration,
        difficulty: params.difficulty,
        questions,
        currentQuestionIndex: 0,
        status: 'setup'
      }

      // Save to offline storage
      const storedSession: StoredSession = {
        id: sessionId,
        session,
        responses: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      offlineStorage.saveSession(storedSession)
      
      return session
    } catch (error) {
      console.error('Failed to create session:', error)
      throw error
    }
  }

  // Fetch questions from question bank
  private async fetchQuestionsFromBank(bankId: string): Promise<InterviewQuestion[]> {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('question_bank_id', bankId)
      
      if (error) throw error
      
      return data.map(q => ({
        id: q.id,
        type: q.type as 'behavioral' | 'technical' | 'situational',
        difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
        question: q.question,
        followUp: q.follow_up,
        timeLimit: q.time_limit
      }))
    } catch (error) {
      console.error('Failed to fetch questions from bank:', error)
      return []
    }
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
