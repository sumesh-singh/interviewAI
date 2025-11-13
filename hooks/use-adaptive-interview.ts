import { useState, useEffect } from 'react'
import { sessionManager } from '@/lib/session-manager'
import type { AdaptiveRecommendation } from '@/lib/adaptive-difficulty-engine'
import type { UserPerformanceSummary } from '@/types/interview'

export function useAdaptiveInterview(userId: string) {
  const [recommendation, setRecommendation] = useState<AdaptiveRecommendation | null>(null)
  const [performance, setPerformance] = useState<UserPerformanceSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load recommendation and performance data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const [rec, perf] = await Promise.all([
          Promise.resolve(sessionManager.getAdaptiveConfig(userId)),
          Promise.resolve(sessionManager.getUserPerformanceSummary(userId))
        ])

        setRecommendation(rec)
        setPerformance(perf)
      } catch (err) {
        console.error('Failed to load adaptive data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      loadData()
    }
  }, [userId])

  // Create adaptive session
  const createAdaptiveSession = async (params: {
    duration?: number
    role?: string
    useRecommendation?: boolean
    userChoice?: {
      type: 'behavioral' | 'technical' | 'mixed'
      difficulty: 'easy' | 'medium' | 'hard'
    }
  }) => {
    try {
      const result = await sessionManager.createAdaptiveSession(userId, params)
      return result
    } catch (err) {
      console.error('Failed to create adaptive session:', err)
      throw err
    }
  }

  // Complete session and update performance
  const completeSession = async (sessionId: string, role?: string) => {
    try {
      const result = sessionManager.completeSession(userId, sessionId, role)
      
      // Reload performance data after completing session
      if (result) {
        const updatedPerformance = sessionManager.getUserPerformanceSummary(userId)
        setPerformance(updatedPerformance)
      }
      
      return result
    } catch (err) {
      console.error('Failed to complete session:', err)
      throw err
    }
  }

  // Get recommendation accuracy
  const getAccuracy = () => {
    return sessionManager.getRecommendationAccuracy(userId)
  }

  return {
    recommendation,
    performance,
    isLoading,
    error,
    createAdaptiveSession,
    completeSession,
    getAccuracy,
    refresh: () => {
      // Trigger a refresh of the data
      setIsLoading(true)
      const loadData = async () => {
        try {
          const [rec, perf] = await Promise.all([
            Promise.resolve(sessionManager.getAdaptiveConfig(userId)),
            Promise.resolve(sessionManager.getUserPerformanceSummary(userId))
          ])

          setRecommendation(rec)
          setPerformance(perf)
        } catch (err) {
          console.error('Failed to refresh adaptive data:', err)
          setError(err instanceof Error ? err.message : 'Failed to refresh data')
        } finally {
          setIsLoading(false)
        }
      }
      loadData()
    }
  }
}