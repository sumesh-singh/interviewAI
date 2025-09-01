export interface InterviewQuestion {
  id: string
  type: "behavioral" | "technical" | "situational"
  difficulty: "easy" | "medium" | "hard"
  question: string
  followUp?: string[]
  timeLimit?: number // in seconds
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
