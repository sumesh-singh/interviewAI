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

export interface JobRecommendation {
  id: string
  company: string
  role: string
  location: string
  remote: "remote" | "hybrid" | "on-site"
  seniority: "entry" | "mid" | "senior" | "lead"
  tags: string[]
  description: string
  applyUrl: string
  postedDate: string
  matchScore: number
}

export interface JobsResponse {
  jobs: JobRecommendation[]
  total: number
}

export interface JobFilters {
  location?: string
  remote?: "remote" | "hybrid" | "on-site" | "all"
  seniority?: "entry" | "mid" | "senior" | "lead" | "all"
}
