import type { StoredSession } from './offline-storage'
import type { DetailedScore } from './scoring-system'
import { offlineStorage } from './offline-storage'

export interface PerformanceMetrics {
  userId: string
  sessionId: string
  timestamp: Date
  difficulty: 'easy' | 'medium' | 'hard'
  interviewType: 'behavioral' | 'technical' | 'mixed'
  overallScore: number
  breakdown: DetailedScore['breakdown']
  completionRate: number
  averageResponseTime: number
  totalQuestions: number
  answeredQuestions: number
}

export interface PerformanceTrend {
  metric: keyof DetailedScore['breakdown'] | 'overallScore'
  current: number
  previous: number
  trend: 'improving' | 'declining' | 'stable'
  changePercentage: number
}

export interface BenchmarkData {
  difficulty: 'easy' | 'medium' | 'hard'
  interviewType: 'behavioral' | 'technical' | 'mixed'
  averageScores: DetailedScore['breakdown']
  averageOverallScore: number
  sampleSize: number
  percentiles: {
    '25th': number
    '50th': number
    '75th': number
    '90th': number
  }
}

export interface UserPerformanceProfile {
  userId: string
  totalSessions: number
  averageOverallScore: number
  strengths: string[]
  weaknesses: string[]
  preferredDifficulty: 'easy' | 'medium' | 'hard'
  performanceByType: Record<'behavioral' | 'technical' | 'mixed', {
    averageScore: number
    sessionCount: number
    bestScore: number
  }>
  recentTrends: PerformanceTrend[]
  lastUpdated: Date
}

export class AnalyticsService {
  private static instance: AnalyticsService
  
  private constructor() {}
  
  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  // Store performance metrics for a session
  public storePerformanceMetrics(
    userId: string,
    sessionId: string,
    detailedScore: DetailedScore,
    sessionStats: {
      completionRate: number
      averageResponseTime: number
      totalQuestions: number
      answeredQuestions: number
    }
  ): void {
    const storedSession = offlineStorage.getSession(sessionId)
    if (!storedSession) return

    const metrics: PerformanceMetrics = {
      userId,
      sessionId,
      timestamp: new Date(),
      difficulty: storedSession.session.difficulty,
      interviewType: storedSession.session.type,
      overallScore: detailedScore.overallScore,
      breakdown: detailedScore.breakdown,
      completionRate: sessionStats.completionRate,
      averageResponseTime: sessionStats.averageResponseTime,
      totalQuestions: sessionStats.totalQuestions,
      answeredQuestions: sessionStats.answeredQuestions
    }

    // Store in localStorage for now (in production, this would go to a database)
    const existingMetrics = this.getAllPerformanceMetrics(userId)
    existingMetrics.push(metrics)
    
    // Keep only last 50 sessions to manage storage
    if (existingMetrics.length > 50) {
      existingMetrics.splice(0, existingMetrics.length - 50)
    }
    
    this.setItem(`performance-metrics-${userId}`, existingMetrics)
  }

  // Get all performance metrics for a user
  public getAllPerformanceMetrics(userId: string): PerformanceMetrics[] {
    return this.getItem<PerformanceMetrics[]>(`performance-metrics-${userId}`) || []
  }

  // Get recent performance metrics (last N sessions)
  public getRecentPerformanceMetrics(userId: string, sessionCount: number = 5): PerformanceMetrics[] {
    const allMetrics = this.getAllPerformanceMetrics(userId)
    return allMetrics
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, sessionCount)
  }

  // Calculate performance trends
  public calculatePerformanceTrends(userId: string): PerformanceTrend[] {
    const recentMetrics = this.getRecentPerformanceMetrics(userId, 10)
    if (recentMetrics.length < 2) return []

    const trends: PerformanceTrend[] = []
    const current = recentMetrics[0]
    const previous = recentMetrics[1]

    // Overall score trend
    trends.push(this.calculateTrend('overallScore', current.overallScore, previous.overallScore))

    // Breakdown trends
    Object.keys(current.breakdown).forEach(metric => {
      const key = metric as keyof DetailedScore['breakdown']
      trends.push(this.calculateTrend(
        key,
        current.breakdown[key],
        previous.breakdown[key]
      ))
    })

    return trends
  }

  // Generate user performance profile
  public generateUserPerformanceProfile(userId: string): UserPerformanceProfile {
    const allMetrics = this.getAllPerformanceMetrics(userId)
    const recentMetrics = this.getRecentPerformanceMetrics(userId, 10)

    if (allMetrics.length === 0) {
      return this.createDefaultProfile(userId)
    }

    const averageOverallScore = allMetrics.reduce((sum, m) => sum + m.overallScore, 0) / allMetrics.length
    
    // Calculate performance by interview type
    const performanceByType = {
      behavioral: this.calculateTypePerformance(allMetrics, 'behavioral'),
      technical: this.calculateTypePerformance(allMetrics, 'technical'),
      mixed: this.calculateTypePerformance(allMetrics, 'mixed')
    }

    // Identify strengths and weaknesses
    const recentBreakdowns = recentMetrics.map(m => m.breakdown)
    const strengths = this.identifyStrengths(recentBreakdowns)
    const weaknesses = this.identifyWeaknesses(recentBreakdowns)

    // Determine preferred difficulty based on performance
    const preferredDifficulty = this.determinePreferredDifficulty(allMetrics)

    // Calculate recent trends
    const recentTrends = this.calculatePerformanceTrends(userId)

    return {
      userId,
      totalSessions: allMetrics.length,
      averageOverallScore,
      strengths,
      weaknesses,
      preferredDifficulty,
      performanceByType,
      recentTrends,
      lastUpdated: new Date()
    }
  }

  // Get benchmark data for comparison
  public getBenchmarkData(
    difficulty: 'easy' | 'medium' | 'hard',
    interviewType: 'behavioral' | 'technical' | 'mixed'
  ): BenchmarkData {
    // In a real implementation, this would come from aggregated user data
    // For now, we'll use static benchmark data
    const benchmarks: Record<string, BenchmarkData> = {
      'easy-behavioral': {
        difficulty: 'easy',
        interviewType: 'behavioral',
        averageScores: {
          technicalAccuracy: 75,
          communicationSkills: 80,
          problemSolving: 70,
          confidence: 75,
          relevance: 85,
          clarity: 80,
          structure: 75,
          examples: 70
        },
        averageOverallScore: 76,
        sampleSize: 1000,
        percentiles: { '25th': 65, '50th': 76, '75th': 85, '90th': 92 }
      },
      'easy-technical': {
        difficulty: 'easy',
        interviewType: 'technical',
        averageScores: {
          technicalAccuracy: 70,
          communicationSkills: 75,
          problemSolving: 65,
          confidence: 70,
          relevance: 80,
          clarity: 75,
          structure: 70,
          examples: 65
        },
        averageOverallScore: 71,
        sampleSize: 1000,
        percentiles: { '25th': 60, '50th': 71, '75th': 80, '90th': 88 }
      },
      'medium-behavioral': {
        difficulty: 'medium',
        interviewType: 'behavioral',
        averageScores: {
          technicalAccuracy: 75,
          communicationSkills: 75,
          problemSolving: 70,
          confidence: 70,
          relevance: 80,
          clarity: 75,
          structure: 70,
          examples: 75
        },
        averageOverallScore: 74,
        sampleSize: 1000,
        percentiles: { '25th': 65, '50th': 74, '75th': 83, '90th': 90 }
      },
      'medium-technical': {
        difficulty: 'medium',
        interviewType: 'technical',
        averageScores: {
          technicalAccuracy: 70,
          communicationSkills: 70,
          problemSolving: 65,
          confidence: 65,
          relevance: 75,
          clarity: 70,
          structure: 65,
          examples: 70
        },
        averageOverallScore: 69,
        sampleSize: 1000,
        percentiles: { '25th': 58, '50th': 69, '75th': 78, '90th': 86 }
      },
      'hard-behavioral': {
        difficulty: 'hard',
        interviewType: 'behavioral',
        averageScores: {
          technicalAccuracy: 70,
          communicationSkills: 70,
          problemSolving: 65,
          confidence: 65,
          relevance: 75,
          clarity: 70,
          structure: 65,
          examples: 70
        },
        averageOverallScore: 69,
        sampleSize: 1000,
        percentiles: { '25th': 58, '50th': 69, '75th': 78, '90th': 86 }
      },
      'hard-technical': {
        difficulty: 'hard',
        interviewType: 'technical',
        averageScores: {
          technicalAccuracy: 65,
          communicationSkills: 65,
          problemSolving: 60,
          confidence: 60,
          relevance: 70,
          clarity: 65,
          structure: 60,
          examples: 65
        },
        averageOverallScore: 64,
        sampleSize: 1000,
        percentiles: { '25th': 52, '50th': 64, '75th': 73, '90th': 82 }
      }
    }

    const key = `${difficulty}-${interviewType}`
    return benchmarks[key] || benchmarks['medium-behavioral']
  }

  // Private helper methods
  private calculateTrend(
    metric: keyof DetailedScore['breakdown'] | 'overallScore',
    current: number,
    previous: number
  ): PerformanceTrend {
    const change = current - previous
    const changePercentage = previous > 0 ? (change / previous) * 100 : 0
    
    let trend: 'improving' | 'declining' | 'stable'
    if (changePercentage > 5) {
      trend = 'improving'
    } else if (changePercentage < -5) {
      trend = 'declining'
    } else {
      trend = 'stable'
    }

    return { metric, current, previous, trend, changePercentage }
  }

  private calculateTypePerformance(
    metrics: PerformanceMetrics[],
    type: 'behavioral' | 'technical' | 'mixed'
  ) {
    const typeMetrics = metrics.filter(m => m.interviewType === type)
    if (typeMetrics.length === 0) {
      return { averageScore: 0, sessionCount: 0, bestScore: 0 }
    }

    const averageScore = typeMetrics.reduce((sum, m) => sum + m.overallScore, 0) / typeMetrics.length
    const bestScore = Math.max(...typeMetrics.map(m => m.overallScore))

    return {
      averageScore,
      sessionCount: typeMetrics.length,
      bestScore
    }
  }

  private identifyStrengths(breakdowns: DetailedScore['breakdown'][]): string[] {
    const averages = this.calculateAverages(breakdowns)
    return Object.entries(averages)
      .filter(([, score]) => score >= 80)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([metric]) => this.formatMetricName(metric))
  }

  private identifyWeaknesses(breakdowns: DetailedScore['breakdown'][]): string[] {
    const averages = this.calculateAverages(breakdowns)
    return Object.entries(averages)
      .filter(([, score]) => score < 65)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 3)
      .map(([metric]) => this.formatMetricName(metric))
  }

  private calculateAverages(breakdowns: DetailedScore['breakdown'][]): DetailedScore['breakdown'] {
    if (breakdowns.length === 0) {
      return {
        technicalAccuracy: 0,
        communicationSkills: 0,
        problemSolving: 0,
        confidence: 0,
        relevance: 0,
        clarity: 0,
        structure: 0,
        examples: 0
      }
    }

    const sum = breakdowns.reduce((acc, breakdown) => {
      Object.entries(breakdown).forEach(([key, value]) => {
        acc[key as keyof DetailedScore['breakdown']] += value
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
    })

    const count = breakdowns.length
    return {
      technicalAccuracy: sum.technicalAccuracy / count,
      communicationSkills: sum.communicationSkills / count,
      problemSolving: sum.problemSolving / count,
      confidence: sum.confidence / count,
      relevance: sum.relevance / count,
      clarity: sum.clarity / count,
      structure: sum.structure / count,
      examples: sum.examples / count
    }
  }

  private formatMetricName(metric: string): string {
    const formatted: Record<string, string> = {
      technicalAccuracy: 'Technical Accuracy',
      communicationSkills: 'Communication Skills',
      problemSolving: 'Problem Solving',
      confidence: 'Confidence',
      relevance: 'Relevance',
      clarity: 'Clarity',
      structure: 'Structure',
      examples: 'Use of Examples'
    }
    return formatted[metric] || metric
  }

  private determinePreferredDifficulty(metrics: PerformanceMetrics[]): 'easy' | 'medium' | 'hard' {
    if (metrics.length < 3) return 'medium'

    const recentMetrics = metrics.slice(-5)
    const averageScore = recentMetrics.reduce((sum, m) => sum + m.overallScore, 0) / recentMetrics.length

    if (averageScore >= 85) return 'hard'
    if (averageScore >= 70) return 'medium'
    return 'easy'
  }

  private createDefaultProfile(userId: string): UserPerformanceProfile {
    return {
      userId,
      totalSessions: 0,
      averageOverallScore: 0,
      strengths: [],
      weaknesses: [],
      preferredDifficulty: 'medium',
      performanceByType: {
        behavioral: { averageScore: 0, sessionCount: 0, bestScore: 0 },
        technical: { averageScore: 0, sessionCount: 0, bestScore: 0 },
        mixed: { averageScore: 0, sessionCount: 0, bestScore: 0 }
      },
      recentTrends: [],
      lastUpdated: new Date()
    }
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

export const analyticsService = AnalyticsService.getInstance()