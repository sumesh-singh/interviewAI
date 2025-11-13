export interface InterviewQuestion {
  id: string
  type: "behavioral" | "technical" | "situational"
  difficulty: "easy" | "medium" | "hard"
  question: string
  followUp?: string[]
  timeLimit?: number // in seconds
}

export interface ScoringWeights {
  technicalAccuracy: number
  communicationSkills: number
  problemSolving: number
  confidence: number
  relevance: number
  clarity: number
  structure: number
  examples: number
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
  scoringWeights?: ScoringWeights
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

export interface AdaptiveConfig {
  userId: string
  recommendedDifficulty: "easy" | "medium" | "hard"
  recommendedType: "behavioral" | "technical" | "mixed"
  confidence: number
  rationale: {
    primary: string
    supporting: string[]
  }
  alternativeOptions: {
    difficulty: "easy" | "medium" | "hard"
    type: "behavioral" | "technical" | "mixed"
    reason: string
  }[]
  focusAreas: string[]
  estimatedDifficulty: "challenging" | "appropriate" | "comfortable"
}

export interface UserPerformanceSummary {
  userId: string
  totalSessions: number
  averageOverallScore: number
  strengths: string[]
  weaknesses: string[]
  preferredDifficulty: "easy" | "medium" | "hard"
  performanceByType: Record<"behavioral" | "technical" | "mixed", {
    averageScore: number
    sessionCount: number
    bestScore: number
  }>
  recentTrends: Array<{
    metric: string
    current: number
    previous: number
    trend: "improving" | "declining" | "stable"
    changePercentage: number
  }>
  lastUpdated: Date
}
