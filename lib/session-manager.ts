import { nanoid } from 'nanoid'
import { offlineStorage, type StoredSession } from './offline-storage'
import { interviewTemplates } from '@/data/interview-templates'
import { openAIService } from './openai'
import { analyticsService } from './analytics-service'
import { adaptiveDifficultyEngine, type AdaptiveRecommendation } from './adaptive-difficulty-engine'
import { scoringSystem, type DetailedScore } from './scoring-system'
import type { InterviewSession, InterviewQuestion } from '@/types/interview'

export interface SessionCreateParams {
  templateId?: string
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
      if (params.templateId) {
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

  // Get adaptive configuration recommendation
  public getAdaptiveConfig(userId: string): AdaptiveRecommendation | null {
    return adaptiveDifficultyEngine.generateRecommendation(userId)
  }

  // Create session with adaptive recommendation
  public async createAdaptiveSession(
    userId: string,
    params: Omit<SessionCreateParams, 'type' | 'difficulty'> & {
      useRecommendation?: boolean
      userChoice?: {
        type: 'behavioral' | 'technical' | 'mixed'
        difficulty: 'easy' | 'medium' | 'hard'
      }
    }
  ): Promise<{ session: InterviewSession; recommendation: AdaptiveRecommendation | null }> {
    const recommendation = this.getAdaptiveConfig(userId)
    
    let type: 'behavioral' | 'technical' | 'mixed'
    let difficulty: 'easy' | 'medium' | 'hard'

    if (params.useRecommendation && recommendation) {
      type = recommendation.recommendedType
      difficulty = recommendation.recommendedDifficulty
    } else if (params.userChoice) {
      type = params.userChoice.type
      difficulty = params.userChoice.difficulty
    } else {
      // Default fallback
      type = 'mixed'
      difficulty = 'medium'
    }

    const session = await this.createSession({
      ...params,
      type,
      difficulty
    })

    // Record user choice if we have a recommendation
    if (recommendation) {
      adaptiveDifficultyEngine.recordUserChoice(userId, recommendation, { type, difficulty })
    }

    return { session, recommendation }
  }

  // Complete session with performance tracking
  public completeSession(
    userId: string,
    sessionId: string,
    role?: string
  ): {
    detailedScore: DetailedScore | null
    sessionStats: ReturnType<typeof this.getSessionStats> | null
  } | null {
    const storedSession = offlineStorage.getSession(sessionId)
    if (!storedSession) return null

    const sessionStats = this.getSessionStats(sessionId)
    if (!sessionStats) return null

    // Calculate detailed scores for each response
    const detailedScores: DetailedScore[] = []
    
    storedSession.responses.forEach((response, index) => {
      if (index < storedSession.session.questions.length) {
        const question = storedSession.session.questions[index]
        const criteria = {
          questionType: question.type,
          role: role || 'General',
          difficulty: question.difficulty,
          expectedDuration: question.timeLimit || 120,
          keywordWeights: {}
        }

        const detailedScore = scoringSystem.calculateDetailedScore(
          question.question,
          response.response,
          response.duration,
          criteria
        )

        detailedScores.push(detailedScore)
      }
    })

    // Calculate overall session score
    const overallDetailedScore: DetailedScore = detailedScores.length > 0 ? {
      overallScore: Math.round(detailedScores.reduce((sum, score) => sum + score.overallScore, 0) / detailedScores.length),
      breakdown: detailedScores.reduce((acc, score) => {
        Object.entries(score.breakdown).forEach(([key, value]) => {
          acc[key as keyof typeof acc] = (acc[key as keyof typeof acc] || 0) + value
        })
        return acc
      }, {
        technicalAccuracy: 0,
        communicationSkills: 0,
        problemSolving: 0,
        confidence: 0,
        relevance: 0,
        clarity: 0,
        structure: 0,
        examples: 0
      }) as DetailedScore['breakdown'],
      levelAssessment: 'mid' as const,
      strengths: [],
      weaknesses: [],
      recommendations: [],
      improvementPlan: { shortTerm: [], longTerm: [] }
    } : null

    // Average the breakdown scores
    if (overallDetailedScore && detailedScores.length > 0) {
      Object.keys(overallDetailedScore.breakdown).forEach(key => {
        overallDetailedScore.breakdown[key as keyof typeof overallDetailedScore.breakdown] = 
          Math.round(overallDetailedScore.breakdown[key as keyof typeof overallDetailedScore.breakdown] / detailedScores.length)
      })
    }

    // Store performance metrics
    if (overallDetailedScore) {
      analyticsService.storePerformanceMetrics(userId, sessionId, overallDetailedScore, sessionStats)
      
      // Update adaptive engine with session outcome
      adaptiveDifficultyEngine.updateSessionOutcome(
        userId,
        storedSession.createdAt,
        {
          overallScore: overallDetailedScore.overallScore,
          completionRate: sessionStats.completionRate
        }
      )
    }

    // Update session status to completed
    this.updateSessionStatus(sessionId, 'completed')

    return {
      detailedScore: overallDetailedScore,
      sessionStats
    }
  }

  // Get user performance summary
  public getUserPerformanceSummary(userId: string) {
    return analyticsService.generateUserPerformanceProfile(userId)
  }

  // Get recommendation accuracy metrics
  public getRecommendationAccuracy(userId: string) {
    return adaptiveDifficultyEngine.getRecommendationAccuracy(userId)
  }
}

// Global instance
export const sessionManager = SessionManager.getInstance()
