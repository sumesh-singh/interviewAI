import { createClient } from '@/lib/supabase/client'
import type { ScoringWeights } from '@/types/interview'
import { ScoringSystem } from './scoring-system'
import { offlineStorage } from './offline-storage'

export class ScoringWeightsService {
  private static instance: ScoringWeightsService

  private constructor() {}

  public static getInstance(): ScoringWeightsService {
    if (!ScoringWeightsService.instance) {
      ScoringWeightsService.instance = new ScoringWeightsService()
    }
    return ScoringWeightsService.instance
  }

  async fetchUserScoringWeights(userId: string): Promise<ScoringWeights> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_scoring_weights')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.warn('Failed to fetch user scoring weights, using defaults:', error)
        return ScoringSystem.getDefaultWeights()
      }

      if (data) {
        const weights: ScoringWeights = {
          technicalAccuracy: data.technical_accuracy || 0.15,
          communicationSkills: data.communication_skills || 0.20,
          problemSolving: data.problem_solving || 0.15,
          confidence: data.confidence || 0.10,
          relevance: data.relevance || 0.15,
          clarity: data.clarity || 0.10,
          structure: data.structure || 0.10,
          examples: data.examples || 0.05,
        }
        offlineStorage.saveScoringWeights(weights)
        return weights
      }

      return ScoringSystem.getDefaultWeights()
    } catch (error) {
      console.error('Error fetching user scoring weights:', error)
      return ScoringSystem.getDefaultWeights()
    }
  }

  async saveScoringWeights(userId: string, weights: ScoringWeights, presetName?: string): Promise<boolean> {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('user_scoring_weights')
        .upsert({
          user_id: userId,
          technical_accuracy: weights.technicalAccuracy,
          communication_skills: weights.communicationSkills,
          problem_solving: weights.problemSolving,
          confidence: weights.confidence,
          relevance: weights.relevance,
          clarity: weights.clarity,
          structure: weights.structure,
          examples: weights.examples,
          preset_name: presetName,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Failed to save scoring weights:', error)
        return false
      }

      offlineStorage.saveScoringWeights(weights)
      return true
    } catch (error) {
      console.error('Error saving scoring weights:', error)
      return false
    }
  }

  getLocalScoringWeights(): ScoringWeights {
    return offlineStorage.getScoringWeights()
  }

  getPresetWeights(presetName: string): ScoringWeights | null {
    return ScoringSystem.getPresetWeights(presetName)
  }

  getDefaultWeights(): ScoringWeights {
    return ScoringSystem.getDefaultWeights()
  }

  getAllPresets(): Record<string, ScoringWeights> {
    return {
      default: ScoringSystem.getDefaultWeights(),
      technical: ScoringSystem.getPresetWeights('technical') || ScoringSystem.getDefaultWeights(),
      behavioral: ScoringSystem.getPresetWeights('behavioral') || ScoringSystem.getDefaultWeights(),
      'product-manager': ScoringSystem.getPresetWeights('product-manager') || ScoringSystem.getDefaultWeights(),
      leadership: ScoringSystem.getPresetWeights('leadership') || ScoringSystem.getDefaultWeights(),
    }
  }
}

export const scoringWeightsService = ScoringWeightsService.getInstance()
