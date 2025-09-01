export interface UserStats {
  sessionsCompleted: number
  averageScore: number
  totalPracticeTime: number
  improvementRate: number
}

export interface RecentSession {
  id: string
  type: string
  score: number
  duration: number
  date: string
  status: "completed" | "in-progress" | "scheduled"
}

export interface ProfileData {
  basicInfo: {
    name: string
    experienceLevel: "entry" | "mid" | "senior" | "executive"
    targetRole: string
  }
  background: {
    industry: string
    currentRole: string
    yearsExperience: number
  }
  preferences: {
    interviewTypes: string[]
    difficulty: "beginner" | "intermediate" | "advanced"
    focusAreas: string[]
  }
  goals: {
    improvements: string[]
    targetCompanies: string[]
  }
}
