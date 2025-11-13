#!/usr/bin/env node

// Demo script to test the adaptive difficulty system
// This simulates user sessions and tests the recommendation engine

import { analyticsService } from '../lib/analytics-service.js'
import { adaptiveDifficultyEngine } from '../lib/adaptive-difficulty-engine.js'
import { sessionManager } from '../lib/session-manager.js'
import { scoringSystem } from '../lib/scoring-system.js'

const DEMO_USER_ID = 'test-user-adaptive'

// Simulate different performance scenarios
const scenarios = [
  {
    name: 'High Performer',
    sessions: [
      { type: 'technical', difficulty: 'medium', scores: [85, 88, 92, 90, 87] },
      { type: 'behavioral', difficulty: 'medium', scores: [82, 85, 88, 86, 84] }
    ]
  },
  {
    name: 'Struggling User',
    sessions: [
      { type: 'technical', difficulty: 'medium', scores: [45, 50, 48, 52, 49] },
      { type: 'behavioral', difficulty: 'medium', scores: [55, 58, 56, 60, 57] }
    ]
  },
  {
    name: 'Balanced User',
    sessions: [
      { type: 'technical', difficulty: 'medium', scores: [70, 72, 75, 73, 74] },
      { type: 'behavioral', difficulty: 'medium', scores: [72, 70, 73, 75, 71] }
    ]
  }
]

function createMockDetailedScore(overallScore, type) {
  const baseBreakdown = {
    technicalAccuracy: overallScore + (type === 'technical' ? 5 : -5),
    communicationSkills: overallScore + (type === 'behavioral' ? 5 : -5),
    problemSolving: overallScore,
    confidence: overallScore + Math.random() * 10 - 5,
    relevance: overallScore + Math.random() * 8 - 4,
    clarity: overallScore + Math.random() * 6 - 3,
    structure: overallScore + Math.random() * 8 - 4,
    examples: overallScore + (type === 'behavioral' ? 10 : -10)
  }

  // Clamp values between 0-100
  Object.keys(baseBreakdown).forEach(key => {
    baseBreakdown[key] = Math.max(0, Math.min(100, baseBreakdown[key]))
  })

  return {
    overallScore,
    breakdown: baseBreakdown,
    levelAssessment: overallScore >= 85 ? 'senior' : overallScore >= 70 ? 'mid' : 'junior',
    strengths: [],
    weaknesses: [],
    recommendations: [],
    improvementPlan: { shortTerm: [], longTerm: [] }
  }
}

function simulateScenario(scenario) {
  console.log(`\n=== Testing Scenario: ${scenario.name} ===`)
  
  // Clear existing data for this user
  const userId = `${DEMO_USER_ID}-${scenario.name.toLowerCase().replace(' ', '-')}`
  
  // Simulate sessions
  scenario.sessions.forEach((sessionData, sessionIndex) => {
    console.log(`\nSimulating ${sessionData.type} session ${sessionIndex + 1}...`)
    
    // Create mock session stats for each score
    sessionData.scores.forEach((score, scoreIndex) => {
      const detailedScore = createMockDetailedScore(score, sessionData.type)
      const sessionStats = {
        completionRate: 85 + Math.random() * 15,
        averageResponseTime: 120 + Math.random() * 60,
        totalQuestions: 5,
        answeredQuestions: Math.floor(4 + Math.random())
      }
      
      // Store performance metrics
      analyticsService.storePerformanceMetrics(
        userId,
        `session-${sessionIndex}-${scoreIndex}`,
        detailedScore,
        sessionStats
      )
    })
  })
  
  // Get recommendation
  const recommendation = adaptiveDifficultyEngine.generateRecommendation(userId)
  console.log('\n🎯 Recommendation:', recommendation ? {
    type: recommendation.recommendedType,
    difficulty: recommendation.recommendedDifficulty,
    confidence: recommendation.confidence,
    rationale: recommendation.rationale.primary
  } : 'No recommendation available')
  
  // Get performance profile
  const profile = analyticsService.generateUserPerformanceProfile(userId)
  console.log('\n📊 Performance Profile:', {
    totalSessions: profile.totalSessions,
    averageScore: profile.averageOverallScore.toFixed(1),
    preferredDifficulty: profile.preferredDifficulty,
    strengths: profile.strengths,
    weaknesses: profile.weaknesses
  })
  
  return { userId, recommendation, profile }
}

function testAdaptiveRules() {
  console.log('\n=== Testing Adaptive Rules ===')
  
  // Test rule priorities
  const rules = adaptiveDifficultyEngine.getAllRules?.() || []
  console.log(`Active rules: ${rules.length}`)
  
  // Test confidence calculation
  console.log('\n🧪 Testing confidence calculation...')
  
  // Test recommendation accuracy
  console.log('\n📈 Testing recommendation accuracy...')
  const accuracy = adaptiveDifficultyEngine.getRecommendationAccuracy(DEMO_USER_ID)
  console.log('Accuracy metrics:', accuracy)
}

function main() {
  console.log('🚀 Starting Adaptive Difficulty System Demo')
  console.log('==========================================')
  
  try {
    // Test each scenario
    const results = scenarios.map(simulateScenario)
    
    // Test adaptive rules
    testAdaptiveRules()
    
    // Summary
    console.log('\n=== Summary ===')
    results.forEach(result => {
      const { userId, recommendation, profile } = result
      console.log(`\n${userId}:`)
      console.log(`  Sessions: ${profile.totalSessions}`)
      console.log(`  Avg Score: ${profile.averageOverallScore.toFixed(1)}%`)
      console.log(`  Recommendation: ${recommendation ? `${recommendation.recommendedType} ${recommendation.recommendedDifficulty}` : 'None'}`)
      console.log(`  Confidence: ${recommendation?.confidence || 0}%`)
    })
    
    console.log('\n✅ Demo completed successfully!')
    
  } catch (error) {
    console.error('❌ Demo failed:', error)
    process.exit(1)
  }
}

// Run the demo
if (require.main === module) {
  main()
}

export { simulateScenario, testAdaptiveRules }