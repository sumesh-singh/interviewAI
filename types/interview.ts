export type QuestionOrigin = "default" | "template" | "ai" | "user"

export interface InterviewQuestion {
  id: string
  type: "behavioral" | "technical" | "situational"
  difficulty: "easy" | "medium" | "hard"
  question: string
  followUp?: string[]
  timeLimit?: number
  origin?: QuestionOrigin
  setId?: string
  tags?: string[]
}

export interface QuestionSourceMetadata {
  templateId?: string
  userSetIds?: string[]
  includedDefault?: boolean
  aiGenerated?: boolean
}

export interface InterviewSession {
  id: string
  type: "behavioral" | "technical" | "mixed"
  duration: number // in minutes
  difficulty: "easy" | "medium" | "hard"
  questions: InterviewQuestion[]
  currentQuestionIndex: number
  startTime?: Date
  endTime?: Date
  status: "setup" | "active" | "paused" | "completed"
  questionSources?: QuestionSourceMetadata
}

export interface VoiceState {
  isRecording: boolean
  isListening: boolean
  audioLevel: number
  hasPermission: boolean
  error?: string
}

export interface SessionControls {
  isPaused: boolean
  timeRemaining: number
  currentQuestion: number
  totalQuestions: number
}

export interface UserQuestionSet {
  id: string
  title: string
  industry?: string | null
  tags: string[]
  difficulty: "easy" | "medium" | "hard" | "mixed"
  createdAt: string
  updatedAt: string
  questions: InterviewQuestion[]
}

export interface QuestionBankSyncState {
  lastSyncedAt: string | null
}
