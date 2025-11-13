import type { InterviewQuestion } from "./interview"

export interface QuestionBank {
  id: string
  user_id: string
  name: string
  description?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  question_bank_id: string
  type: "behavioral" | "technical" | "situational"
  difficulty: "easy" | "medium" | "hard"
  question: string
  follow_up?: string[]
  tags?: string[]
  time_limit?: number
  created_at: string
  updated_at: string
}

export interface QuestionBankWithQuestions extends QuestionBank {
  questions: Question[]
}

export interface QuestionBankStats {
  id: string
  name: string
  description?: string
  questionCount: number
  tags: string[]
  lastUpdated: string
}

export interface ImportQuestion {
  type: "behavioral" | "technical" | "situational"
  difficulty: "easy" | "medium" | "hard"
  question: string
  follow_up?: string[]
  tags?: string[]
  time_limit?: number
}

export interface PendingQuestionBankChange {
  id: string
  type: "create" | "update" | "delete"
  timestamp: Date
  data: Partial<QuestionBank> | Partial<Question>
  bankId?: string
  questionId?: string
}
