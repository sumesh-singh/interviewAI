import type { UserPerformanceProfile, PerformanceTrend, BenchmarkData } from './analytics-service'
import type { DetailedScore } from './scoring-system'
import { analyticsService } from './analytics-service'

export interface AdaptiveRecommendation {
  recommendedDifficulty: 'easy' | 'medium' | 'hard'
  recommendedType: 'behavioral' | 'technical' | 'mixed'
  confidence: number // 0-100
  rationale: {
    primary: string
    supporting: string[]
  }
  alternativeOptions: {
    difficulty: 'easy' | 'medium' | 'hard'
    type: 'behavioral' | 'technical' | 'mixed'
    reason: string
  }[]
  focusAreas: string[]
  estimatedDifficulty: 'challenging' | 'appropriate' | 'comfortable'
}

export interface AdaptiveRule {
  id: string
  name: string
  condition: (profile: UserPerformanceProfile, recentScores: DetailedScore[]) => boolean
  action: (profile: UserPerformanceProfile, recentScores: DetailedScore[]) => Partial<AdaptiveRecommendation>
  priority: number // Higher number = higher priority
}

export interface UserChoiceRecord {
  userId: string
  timestamp: Date
  recommendation: AdaptiveRecommendation
  userChoice: {
    difficulty: 'easy' | 'medium' | 'hard'
    type: 'behavioral' | 'technical' | 'mixed'
  }
  wasRecommendationFollowed: boolean
  sessionOutcome?: {
    overallScore: number
    completionRate: number
  }
}

export class AdaptiveDifficultyEngine {
  private static instance: AdaptiveDifficultyEngine
  private rules: AdaptiveRule[]
  
  private constructor() {
    this.rules = this.initializeRules()
  }
  
  public static getInstance(): AdaptiveDifficultyEngine {
    if (!AdaptiveDifficultyEngine.instance) {
      AdaptiveDifficultyEngine.instance = new AdaptiveDifficultyEngine()
    }
    return AdaptiveDifficultyEngine.instance
  }

  // Main recommendation method
  public generateRecommendation(userId: string): AdaptiveRecommendation | null {
    const profile = analyticsService.generateUserPerformanceProfile(userId)
    
    if (profile.totalSessions === 0) {
      return this.getDefaultRecommendation()
    }

    const recentScores = this.getRecentDetailedScores(userId, 3)
    
    // Apply rules in priority order
    const applicableRules = this.rules
      .filter(rule => rule.condition(profile, recentScores))
      .sort((a, b) => b.priority - a.priority)

    if (applicableRules.length === 0) {
      return this.getDefaultRecommendation()
    }

    const topRule = applicableRules[0]
    const partialRecommendation = topRule.action(profile, recentScores)
    
    return this.completeRecommendation(partialRecommendation, profile, recentScores)
  }

  // Record user's choice for learning
  public recordUserChoice(
    userId: string,
    recommendation: AdaptiveRecommendation,
    userChoice: { difficulty: 'easy' | 'medium' | 'hard'; type: 'behavioral' | 'technical' | 'mixed' }
  ): void {
    const record: UserChoiceRecord = {
      userId,
      timestamp: new Date(),
      recommendation,
      userChoice,
      wasRecommendationFollowed: 
        recommendation.recommendedDifficulty === userChoice.difficulty &&
        recommendation.recommendedType === userChoice.type
    }

    const existingRecords = this.getUserChoiceRecords(userId)
    existingRecords.push(record)
    
    // Keep only last 100 records
    if (existingRecords.length > 100) {
      existingRecords.splice(0, existingRecords.length - 100)
    }

    this.setItem(`user-choices-${userId}`, existingRecords)
  }

  // Update recommendation after session completion
  public updateSessionOutcome(
    userId: string,
    sessionTimestamp: Date,
    outcome: { overallScore: number; completionRate: number }
  ): void {
    const records = this.getUserChoiceRecords(userId)
    const record = records.find(r => 
      Math.abs(new Date(r.timestamp).getTime() - sessionTimestamp.getTime()) < 60000 // Within 1 minute
    )

    if (record) {
      record.sessionOutcome = outcome
      this.setItem(`user-choices-${userId}`, records)
    }
  }

  // Get user choice history
  public getUserChoiceRecords(userId: string): UserChoiceRecord[] {
    return this.getItem<UserChoiceRecord[]>(`user-choices-${userId}`) || []
  }

  // Calculate recommendation accuracy
  public getRecommendationAccuracy(userId: string): {
    overallAccuracy: number
    difficultyAccuracy: number
    typeAccuracy: number
    totalRecommendations: number
  } {
    const records = this.getUserChoiceRecords(userId)
      .filter(r => r.sessionOutcome !== undefined)

    if (records.length === 0) {
      return { overallAccuracy: 0, difficultyAccuracy: 0, typeAccuracy: 0, totalRecommendations: 0 }
    }

    const followedRecommendations = records.filter(r => r.wasRecommendationFollowed)
    const successfulRecommendations = followedRecommendations.filter(r => 
      r.sessionOutcome && r.sessionOutcome.overallScore >= 70
    )

    const difficultyMatches = records.filter(r => 
      r.recommendation.recommendedDifficulty === r.userChoice.difficulty
    )
    const typeMatches = records.filter(r => 
      r.recommendation.recommendedType === r.userChoice.type
    )

    return {
      overallAccuracy: (successfulRecommendations.length / records.length) * 100,
      difficultyAccuracy: (difficultyMatches.length / records.length) * 100,
      typeAccuracy: (typeMatches.length / records.length) * 100,
      totalRecommendations: records.length
    }
  }

  // Private methods
  private initializeRules(): AdaptiveRule[] {
    return [
      {
        id: 'high-performer-advance',
        name: 'Advance high performers',
        priority: 100,
        condition: (profile, recentScores) => {
          return profile.totalSessions >= 3 && 
                 profile.averageOverallScore >= 85 &&
                 this.getRecentAverage(recentScores, 'overallScore') >= 85
        },
        action: (profile, recentScores) => ({
          recommendedDifficulty: this.getNextDifficulty(profile.preferredDifficulty, 'increase'),
          rationale: {
            primary: "You're consistently performing at a high level",
            supporting: [
              `Average score: ${profile.averageOverallScore.toFixed(1)}%`,
              'Ready for more challenging questions'
            ]
          },
          estimatedDifficulty: 'challenging'
        })
      },
      {
        id: 'struggling-simplify',
        name: 'Simplify for struggling users',
        priority: 90,
        condition: (profile, recentScores) => {
          return profile.totalSessions >= 2 && 
                 (profile.averageOverallScore < 60 || 
                  this.getRecentAverage(recentScores, 'overallScore') < 60)
        },
        action: (profile, recentScores) => ({
          recommendedDifficulty: this.getNextDifficulty(profile.preferredDifficulty, 'decrease'),
          rationale: {
            primary: "Let's build confidence with more appropriate questions",
            supporting: [
              `Recent scores need improvement`,
              'Focus on mastering fundamentals'
            ]
          },
          estimatedDifficulty: 'comfortable'
        })
      },
      {
        id: 'technical-weakness-focus',
        name: 'Focus on technical weaknesses',
        priority: 80,
        condition: (profile, recentScores) => {
          return profile.weaknesses.includes('Technical Accuracy') ||
                 profile.weaknesses.includes('Problem Solving')
        },
        action: (profile, recentScores) => ({
          recommendedType: 'technical',
          focusAreas: profile.weaknesses.filter(w => 
            w.includes('Technical') || w.includes('Problem Solving')
          ),
          rationale: {
            primary: "Let's strengthen your technical skills",
            supporting: profile.weaknesses.map(w => `Improve ${w}`)
          }
        })
      },
      {
        id: 'communication-weakness-focus',
        name: 'Focus on communication weaknesses',
        priority: 75,
        condition: (profile, recentScores) => {
          return profile.weaknesses.some(w => 
            w.includes('Communication') || 
            w.includes('Clarity') || 
            w.includes('Confidence')
          )
        },
        action: (profile, recentScores) => ({
          recommendedType: 'behavioral',
          focusAreas: profile.weaknesses.filter(w => 
            w.includes('Communication') || w.includes('Clarity') || w.includes('Confidence')
          ),
          rationale: {
            primary: "Let's work on your communication skills",
            supporting: profile.weaknesss.map(w => `Strengthen ${w}`)
          }
        })
      },
      {
        id: 'balanced-approach',
        name: 'Balanced approach',
        priority: 50,
        condition: (profile, recentScores) => {
          return profile.totalSessions >= 5 && 
                 Math.abs(profile.performanceByType.behavioral.averageScore - 
                         profile.performanceByType.technical.averageScore) < 10
        },
        action: (profile, recentScores) => ({
          recommendedType: 'mixed',
          rationale: {
            primary: "You have balanced skills, let's practice both areas",
            supporting: [
              'Similar performance in behavioral and technical questions',
              'Mixed interviews provide comprehensive practice'
            ]
          }
        })
      },
      {
        id: 'type-specialization',
        name: 'Specialize in stronger area',
        priority: 40,
        condition: (profile, recentScores) => {
          const behavioral = profile.performanceByType.behavioral
          const technical = profile.performanceByType.technical
          
          return (behavioral.sessionCount >= 3 && technical.sessionCount >= 3) &&
                 Math.abs(behavioral.averageScore - technical.averageScore) > 15
        },
        action: (profile, recentScores) => {
          const behavioral = profile.performanceByType.behavioral
          const technical = profile.performanceByType.technical
          
          const strongerType = behavioral.averageScore > technical.averageScore ? 'behavioral' : 'technical'
          const strongerScore = strongerType === 'behavioral' ? behavioral : technical
          
          return {
            recommendedType: strongerType,
            rationale: {
              primary: `Focus on your stronger area: ${strongerType} questions`,
              supporting: [
                `You excel at ${strongerType} questions (${strongerScore.averageScore.toFixed(1)}% average)`,
                'Build confidence before addressing weaker areas'
              ]
            }
          }
        }
      }
    ]
  }

  private completeRecommendation(
    partial: Partial<AdaptiveRecommendation>,
    profile: UserPerformanceProfile,
    recentScores: DetailedScore[]
  ): AdaptiveRecommendation {
    const benchmark = analyticsService.getBenchmarkData(
      partial.recommendedDifficulty || profile.preferredDifficulty,
      partial.recommendedType || 'mixed'
    )

    const recommendation: AdaptiveRecommendation = {
      recommendedDifficulty: partial.recommendedDifficulty || profile.preferredDifficulty,
      recommendedType: partial.recommendedType || 'mixed',
      confidence: this.calculateConfidence(profile, recentScores, partial),
      rationale: partial.rationale || {
        primary: "Recommended based on your performance",
        supporting: [`Current skill level suggests ${profile.preferredDifficulty} difficulty`]
      },
      alternativeOptions: this.generateAlternatives(partial, profile),
      focusAreas: partial.focusAreas || profile.weaknesses.slice(0, 2),
      estimatedDifficulty: partial.estimatedDifficulty || 'appropriate'
    }

    return recommendation
  }

  private getDefaultRecommendation(): AdaptiveRecommendation {
    return {
      recommendedDifficulty: 'medium',
      recommendedType: 'mixed',
      confidence: 50,
      rationale: {
        primary: "Starting with a balanced approach",
        supporting: [
          'Medium difficulty provides a good baseline',
          'Mixed type covers both technical and behavioral skills'
        ]
      },
      alternativeOptions: [
        { difficulty: 'easy', type: 'behavioral', reason: 'Build confidence with behavioral questions' },
        { difficulty: 'easy', type: 'technical', reason: 'Practice technical fundamentals' }
      ],
      focusAreas: [],
      estimatedDifficulty: 'appropriate'
    }
  }

  private generateAlternatives(
    partial: Partial<AdaptiveRecommendation>,
    profile: UserPerformanceProfile
  ): AdaptiveRecommendation['alternativeOptions'] {
    const primaryDifficulty = partial.recommendedDifficulty || profile.preferredDifficulty
    const primaryType = partial.recommendedType || 'mixed'

    const alternatives: AdaptiveRecommendation['alternativeOptions'][] = []

    // Same difficulty, different type
    if (primaryType !== 'behavioral') {
      alternatives.push({
        difficulty: primaryDifficulty,
        type: 'behavioral',
        reason: 'Focus on communication and soft skills'
      })
    }
    if (primaryType !== 'technical') {
      alternatives.push({
        difficulty: primaryDifficulty,
        type: 'technical',
        reason: 'Focus on technical problem-solving'
      })
    }

    // Same type, different difficulty
    if (primaryDifficulty !== 'easy') {
      alternatives.push({
        difficulty: 'easy',
        type: primaryType,
        reason: 'Build confidence with easier questions'
      })
    }
    if (primaryDifficulty !== 'hard') {
      alternatives.push({
        difficulty: 'hard',
        type: primaryType,
        reason: 'Challenge yourself with harder questions'
      })
    }

    return alternatives.slice(0, 2)
  }

  private calculateConfidence(
    profile: UserPerformanceProfile,
    recentScores: DetailedScore[],
    partial: Partial<AdaptiveRecommendation>
  ): number {
    let confidence = 50 // Base confidence

    // More sessions = higher confidence
    confidence += Math.min(20, profile.totalSessions * 2)

    // Consistent performance = higher confidence
    if (recentScores.length >= 2) {
      const variance = this.calculateVariance(recentScores.map(s => s.overallScore))
      confidence += Math.max(0, 15 - variance * 2)
    }

    // Strong rationale = higher confidence
    if (partial.rationale && partial.rationale.supporting.length >= 2) {
      confidence += 10
    }

    return Math.min(100, Math.max(0, confidence))
  }

  private getNextDifficulty(
    current: 'easy' | 'medium' | 'hard',
    direction: 'increase' | 'decrease'
  ): 'easy' | 'medium' | 'hard' {
    const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard']
    const currentIndex = difficulties.indexOf(current)
    
    if (direction === 'increase') {
      return difficulties[Math.min(currentIndex + 1, difficulties.length - 1)]
    } else {
      return difficulties[Math.max(currentIndex - 1, 0)]
    }
  }

  private getRecentAverage(recentScores: DetailedScore[], metric: keyof DetailedScore | 'overallScore'): number {
    if (recentScores.length === 0) return 0
    
    if (metric === 'overallScore') {
      return recentScores.reduce((sum, score) => sum + score.overallScore, 0) / recentScores.length
    }
    
    return recentScores.reduce((sum, score) => sum + score.breakdown[metric as keyof DetailedScore['breakdown']], 0) / recentScores.length
  }

  private getRecentDetailedScores(userId: string, count: number): DetailedScore[] {
    const metrics = analyticsService.getRecentPerformanceMetrics(userId, count)
    return metrics.map(m => ({
      overallScore: m.overallScore,
      breakdown: m.breakdown
    } as DetailedScore))
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length
  }

  // Storage helpers
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
}

export const adaptiveDifficultyEngine = AdaptiveDifficultyEngine.getInstance()