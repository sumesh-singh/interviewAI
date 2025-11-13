import { interviewTemplates, type InterviewTemplate } from "@/data/interview-templates"
import { mockQuestions } from "@/data/mock-questions"
import type { InterviewSession, InterviewQuestion, UserQuestionSet, QuestionBankSyncState } from "@/types/interview"

const STORAGE_KEYS = {
  INTERVIEW_SESSIONS: 'interview-sessions',
  CACHED_QUESTIONS: 'cached-questions',
  TEMPLATES: 'interview-templates',
  USER_PREFERENCES: 'user-preferences',
  USER_QUESTION_SETS: 'user-question-sets',
  USER_QUESTION_SET_SYNC_STATE: 'user-question-set-sync-state',
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

export type CachedUserQuestionSet = UserQuestionSet

type UserQuestionSetSyncState = QuestionBankSyncState

type UserQuestionSetLike = Omit<UserQuestionSet, 'tags' | 'questions' | 'createdAt' | 'updatedAt' | 'difficulty'> & {
  tags?: string[]
  questions?: InterviewQuestion[]
  createdAt?: string
  updatedAt?: string
  difficulty?: UserQuestionSet['difficulty']
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

  private normalizeInterviewQuestion(
    question: InterviewQuestion,
    setId?: string,
    fallbackTags: string[] = []
  ): InterviewQuestion {
    const followUpValue = question.followUp
    const normalizedFollowUp = Array.isArray(followUpValue)
      ? followUpValue.filter((item): item is string => typeof item === 'string')
      : typeof followUpValue === 'string'
        ? [followUpValue]
        : []

    const tagsValue = (Array.isArray(question.tags) ? question.tags : fallbackTags)
      .filter((tag): tag is string => typeof tag === 'string')

    return {
      ...question,
      followUp: normalizedFollowUp.length > 0 ? normalizedFollowUp : undefined,
      origin: question.origin ?? (setId ? 'user' : 'default'),
      setId: setId ?? question.setId,
      tags: tagsValue
    }
  }

  private normalizeUserQuestionSet(set: UserQuestionSetLike): CachedUserQuestionSet {
    const tags = Array.isArray(set.tags)
      ? set.tags.filter((tag): tag is string => typeof tag === 'string')
      : []

    const createdAt = set.createdAt ?? new Date().toISOString()
    const updatedAt = set.updatedAt ?? createdAt
    const allowedDifficulties: Array<UserQuestionSet['difficulty']> = ['easy', 'medium', 'hard', 'mixed']
    const difficulty = set.difficulty && allowedDifficulties.includes(set.difficulty)
      ? set.difficulty
      : 'medium'

    const questions = (set.questions ?? []).map(question =>
      this.normalizeInterviewQuestion(question, set.id, tags)
    )

    return {
      id: set.id,
      title: set.title,
      industry: set.industry ?? null,
      tags,
      difficulty,
      createdAt,
      updatedAt,
      questions
    }
  }

  private normalizeSyncState(state?: QuestionBankSyncState | null): UserQuestionSetSyncState {
    if (!state || !state.lastSyncedAt) {
      return { lastSyncedAt: null }
    }

    return { lastSyncedAt: state.lastSyncedAt }
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

    const normalizedIncoming = questions.map(question =>
      this.normalizeInterviewQuestion(question, question.setId)
    )

    normalizedIncoming.forEach(newQuestion => {
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
    if (cached && cached.length > 0) {
      return cached.map(question => this.normalizeInterviewQuestion(question, question.setId))
    }

    return mockQuestions.map(question => this.normalizeInterviewQuestion(question))
  }

  public addQuestionsToCache(questions: InterviewQuestion[]): void {
    this.cacheQuestions(questions)
  }

  // User Question Sets
  public getCachedUserQuestionSets(): CachedUserQuestionSet[] {
    const cached = this.getItem<CachedUserQuestionSet[]>(STORAGE_KEYS.USER_QUESTION_SETS)
    if (!cached) {
      return []
    }

    return cached.map(set => this.normalizeUserQuestionSet(set))
  }

  public syncUserQuestionSets(sets: UserQuestionSetLike[], syncedAt?: string): void {
    const normalized = sets.map(set => this.normalizeUserQuestionSet(set))
    this.setItem(STORAGE_KEYS.USER_QUESTION_SETS, normalized)
    this.markUserQuestionSetsSynced(syncedAt)
  }

  public upsertUserQuestionSets(sets: UserQuestionSetLike[], syncedAt?: string): void {
    if (sets.length === 0) {
      this.markUserQuestionSetsSynced(syncedAt)
      return
    }

    const existing = this.getCachedUserQuestionSets()
    const byId = new Map(existing.map(set => [set.id, set]))

    sets.forEach(set => {
      byId.set(set.id, this.normalizeUserQuestionSet(set))
    })

    const merged = Array.from(byId.values()).sort((a, b) => {
      const updatedA = new Date(a.updatedAt ?? '').getTime() || 0
      const updatedB = new Date(b.updatedAt ?? '').getTime() || 0
      return updatedB - updatedA
    })

    this.setItem(STORAGE_KEYS.USER_QUESTION_SETS, merged)
    this.markUserQuestionSetsSynced(syncedAt)
  }

  public getQuestionsFromUserSetIds(setIds: string[]): InterviewQuestion[] {
    if (!Array.isArray(setIds) || setIds.length === 0) {
      return []
    }

    const uniqueIds = setIds.filter((id, index) => setIds.indexOf(id) === index)
    const sets = this.getCachedUserQuestionSets()
    const setMap = new Map(sets.map(set => [set.id, set]))

    const aggregated: InterviewQuestion[] = []

    uniqueIds.forEach(id => {
      const set = setMap.get(id)
      if (!set) {
        return
      }

      set.questions.forEach(question => {
        aggregated.push(this.normalizeInterviewQuestion(question, set.id, set.tags))
      })
    })

    const seen = new Set<string>()
    const deduped: InterviewQuestion[] = []

    aggregated.forEach(question => {
      if (seen.has(question.id)) {
        return
      }

      seen.add(question.id)
      deduped.push(question)
    })

    return deduped
  }

  public removeUserQuestionSet(id: string): void {
    const sets = this.getCachedUserQuestionSets().filter(set => set.id !== id)
    this.setItem(STORAGE_KEYS.USER_QUESTION_SETS, sets)
  }

  public clearUserQuestionSets(): void {
    this.setItem(STORAGE_KEYS.USER_QUESTION_SETS, [])
    this.setItem(STORAGE_KEYS.USER_QUESTION_SET_SYNC_STATE, this.normalizeSyncState(null))
  }

  public markUserQuestionSetsSynced(syncedAt?: string | null): void {
    if (syncedAt === null) {
      this.setItem(
        STORAGE_KEYS.USER_QUESTION_SET_SYNC_STATE,
        this.normalizeSyncState({ lastSyncedAt: null })
      )
      return
    }

    const timestamp = syncedAt ?? new Date().toISOString()

    this.setItem(
      STORAGE_KEYS.USER_QUESTION_SET_SYNC_STATE,
      this.normalizeSyncState({ lastSyncedAt: timestamp })
    )
  }

  public getUserQuestionSetSyncState(): UserQuestionSetSyncState {
    const state = this.getItem<QuestionBankSyncState>(STORAGE_KEYS.USER_QUESTION_SET_SYNC_STATE)
    return this.normalizeSyncState(state)
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
      templates: this.getCachedTemplates(),
      questions: this.getCachedQuestions(),
      userQuestionSets: this.getCachedUserQuestionSets(),
      userQuestionSetSyncState: this.getUserQuestionSetSyncState(),
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
      
      if (data.templates) {
        this.setItem(STORAGE_KEYS.TEMPLATES, data.templates)
      }
      
      if (data.questions) {
        this.setItem(STORAGE_KEYS.CACHED_QUESTIONS, data.questions)
      }

      if (Array.isArray(data.userQuestionSets)) {
        this.syncUserQuestionSets(data.userQuestionSets)
      }

      if (data.userQuestionSetSyncState) {
        const normalizedState = this.normalizeSyncState(data.userQuestionSetSyncState)
        this.setItem(STORAGE_KEYS.USER_QUESTION_SET_SYNC_STATE, normalizedState)
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

    if (!this.getItem(STORAGE_KEYS.USER_QUESTION_SETS)) {
      this.setItem(STORAGE_KEYS.USER_QUESTION_SETS, [])
    }

    if (!this.getItem(STORAGE_KEYS.USER_QUESTION_SET_SYNC_STATE)) {
      this.setItem(
        STORAGE_KEYS.USER_QUESTION_SET_SYNC_STATE,
        this.normalizeSyncState(null)
      )
    }
  }
}

// Global instance
export const offlineStorage = OfflineStorage.getInstance()

// Initialize offline data when the module loads
if (typeof window !== 'undefined') {
  offlineStorage.initializeOfflineData()
}
