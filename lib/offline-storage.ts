import { interviewTemplates, type InterviewTemplate } from "@/data/interview-templates"
import { mockQuestions } from "@/data/mock-questions"
import type { InterviewSession, InterviewQuestion, ScoringWeights } from "@/types/interview"

const STORAGE_KEYS = {
  INTERVIEW_SESSIONS: 'interview-sessions',
  CACHED_QUESTIONS: 'cached-questions',
  TEMPLATES: 'interview-templates',
  USER_PREFERENCES: 'user-preferences',
  SCORING_WEIGHTS: 'scoring-weights',
} as const

export interface StoredSession {
  id: string
  session: InterviewSession
  responses: Array<{
    questionId: string
    response: string
    timestamp: Date
    duration: number
  }>
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  preferredVoice: string
  speechRate: number
  speechPitch: number
  autoSpeak: boolean
  theme: 'light' | 'dark' | 'system'
}

export class OfflineStorage {
  private static instance: OfflineStorage
  
  private constructor() {}
  
  public static getInstance(): OfflineStorage {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage()
    }
    return OfflineStorage.instance
  }

  // Generic storage methods
  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Failed to save to localStorage: ${key}`, error)
    }
  }

  private getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error(`Failed to get from localStorage: ${key}`, error)
      return null
    }
  }

  // Interview Sessions
  public saveSession(session: StoredSession): void {
    const sessions = this.getAllSessions()
    const existingIndex = sessions.findIndex(s => s.id === session.id)
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = { ...session, updatedAt: new Date() }
    } else {
      sessions.push(session)
    }
    
    this.setItem(STORAGE_KEYS.INTERVIEW_SESSIONS, sessions)
  }

  public getAllSessions(): StoredSession[] {
    return this.getItem<StoredSession[]>(STORAGE_KEYS.INTERVIEW_SESSIONS) || []
  }

  public getSession(id: string): StoredSession | null {
    const sessions = this.getAllSessions()
    return sessions.find(s => s.id === id) || null
  }

  public deleteSession(id: string): void {
    const sessions = this.getAllSessions()
    const filteredSessions = sessions.filter(s => s.id !== id)
    this.setItem(STORAGE_KEYS.INTERVIEW_SESSIONS, filteredSessions)
  }

  // Interview Templates
  public cacheTemplates(): void {
    this.setItem(STORAGE_KEYS.TEMPLATES, interviewTemplates)
  }

  public getCachedTemplates(): InterviewTemplate[] {
    const cached = this.getItem<InterviewTemplate[]>(STORAGE_KEYS.TEMPLATES)
    return cached || interviewTemplates
  }

  // Questions
  public cacheQuestions(questions: InterviewQuestion[]): void {
    const existing = this.getCachedQuestions()
    const merged = [...existing]
    
    questions.forEach(newQuestion => {
      const existingIndex = merged.findIndex(q => q.id === newQuestion.id)
      if (existingIndex >= 0) {
        merged[existingIndex] = newQuestion
      } else {
        merged.push(newQuestion)
      }
    })
    
    this.setItem(STORAGE_KEYS.CACHED_QUESTIONS, merged)
  }

  public getCachedQuestions(): InterviewQuestion[] {
    const cached = this.getItem<InterviewQuestion[]>(STORAGE_KEYS.CACHED_QUESTIONS)
    return cached || mockQuestions
  }

  public addQuestionsToCache(questions: InterviewQuestion[]): void {
    this.cacheQuestions(questions)
  }

  // User Preferences
  public savePreferences(preferences: Partial<UserPreferences>): void {
    const existing = this.getPreferences()
    const updated = { ...existing, ...preferences }
    this.setItem(STORAGE_KEYS.USER_PREFERENCES, updated)
  }

  public getPreferences(): UserPreferences {
    const defaultPreferences: UserPreferences = {
      preferredVoice: '',
      speechRate: 1,
      speechPitch: 1,
      autoSpeak: true,
      theme: 'system'
    }
    
    const stored = this.getItem<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES)
    return { ...defaultPreferences, ...stored }
  }

  // Scoring Weights
  public saveScoringWeights(weights: ScoringWeights): void {
    this.setItem(STORAGE_KEYS.SCORING_WEIGHTS, weights)
  }

  public getScoringWeights(): ScoringWeights {
    const defaultWeights: ScoringWeights = {
      technicalAccuracy: 0.15,
      communicationSkills: 0.20,
      problemSolving: 0.15,
      confidence: 0.10,
      relevance: 0.15,
      clarity: 0.10,
      structure: 0.10,
      examples: 0.05
    }

    const stored = this.getItem<ScoringWeights>(STORAGE_KEYS.SCORING_WEIGHTS)
    return { ...defaultWeights, ...stored }
  }

  // Utility methods
  public clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  }

  public getStorageInfo(): { totalSessions: number; storageUsed: string } {
    const sessions = this.getAllSessions()
    let totalSize = 0
    
    Object.values(STORAGE_KEYS).forEach(key => {
      const item = localStorage.getItem(key)
      if (item) {
        totalSize += item.length
      }
    })
    
    return {
      totalSessions: sessions.length,
      storageUsed: `${(totalSize / 1024).toFixed(2)} KB`
    }
  }

  // Export/Import functionality
  public exportData(): string {
    const data = {
      sessions: this.getAllSessions(),
      preferences: this.getPreferences(),
      scoringWeights: this.getScoringWeights(),
      templates: this.getCachedTemplates(),
      questions: this.getCachedQuestions(),
      exportedAt: new Date().toISOString(),
    }
    
    return JSON.stringify(data, null, 2)
  }

  public importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      
      if (data.sessions) {
        this.setItem(STORAGE_KEYS.INTERVIEW_SESSIONS, data.sessions)
      }
      
      if (data.preferences) {
        this.setItem(STORAGE_KEYS.USER_PREFERENCES, data.preferences)
      }

      if (data.scoringWeights) {
        this.setItem(STORAGE_KEYS.SCORING_WEIGHTS, data.scoringWeights)
      }
      
      if (data.templates) {
        this.setItem(STORAGE_KEYS.TEMPLATES, data.templates)
      }
      
      if (data.questions) {
        this.setItem(STORAGE_KEYS.CACHED_QUESTIONS, data.questions)
      }
      
      return true
    } catch (error) {
      console.error('Failed to import data:', error)
      return false
    }
  }

  // Initialize default data for offline use
  public initializeOfflineData(): void {
    // Cache templates if not already cached
    if (!this.getItem(STORAGE_KEYS.TEMPLATES)) {
      this.cacheTemplates()
    }
    
    // Cache default questions if not already cached
    if (!this.getItem(STORAGE_KEYS.CACHED_QUESTIONS)) {
      this.addQuestionsToCache(mockQuestions)
    }
  }
}

// Global instance
export const offlineStorage = OfflineStorage.getInstance()

// Initialize offline data when the module loads
if (typeof window !== 'undefined') {
  offlineStorage.initializeOfflineData()
}
