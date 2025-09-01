import type { InterviewFeedback } from './openai'

export interface DetailedScore {
  overallScore: number
  breakdown: {
    technicalAccuracy: number
    communicationSkills: number
    problemSolving: number
    confidence: number
    relevance: number
    clarity: number
    structure: number
    examples: number
  }
  levelAssessment: 'junior' | 'mid' | 'senior' | 'lead'
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  improvementPlan: {
    shortTerm: string[]
    longTerm: string[]
  }
}

export interface ScoringCriteria {
  questionType: 'behavioral' | 'technical' | 'situational'
  role: string
  difficulty: 'easy' | 'medium' | 'hard'
  expectedDuration: number
  keywordWeights: Record<string, number>
}

export class ScoringSystem {
  private static instance: ScoringSystem
  
  private constructor() {}
  
  public static getInstance(): ScoringSystem {
    if (!ScoringSystem.instance) {
      ScoringSystem.instance = new ScoringSystem()
    }
    return ScoringSystem.instance
  }

  // Main scoring method
  public calculateDetailedScore(
    question: string,
    response: string,
    duration: number,
    criteria: ScoringCriteria,
    aiFeedback?: InterviewFeedback
  ): DetailedScore {
    const breakdown = this.calculateBreakdownScores(
      question, 
      response, 
      duration, 
      criteria,
      aiFeedback
    )

    const overallScore = this.calculateOverallScore(breakdown)
    const levelAssessment = this.assessLevel(breakdown, criteria.role)
    
    return {
      overallScore,
      breakdown,
      levelAssessment,
      strengths: this.identifyStrengths(breakdown, response),
      weaknesses: this.identifyWeaknesses(breakdown, response),
      recommendations: this.generateRecommendations(breakdown, criteria),
      improvementPlan: this.createImprovementPlan(breakdown, criteria)
    }
  }

  private calculateBreakdownScores(
    question: string,
    response: string,
    duration: number,
    criteria: ScoringCriteria,
    aiFeedback?: InterviewFeedback
  ): DetailedScore['breakdown'] {
    const responseWords = response.split(/\s+/).length
    const responseLength = response.length

    // Use AI feedback if available, otherwise calculate heuristically
    if (aiFeedback) {
      return {
        technicalAccuracy: aiFeedback.technicalAccuracy,
        communicationSkills: aiFeedback.communication,
        problemSolving: this.calculateProblemSolvingScore(response, criteria),
        confidence: aiFeedback.confidence,
        relevance: aiFeedback.relevance,
        clarity: this.calculateClarityScore(response, duration),
        structure: this.calculateStructureScore(response),
        examples: this.calculateExamplesScore(response, criteria.questionType)
      }
    }

    // Fallback scoring without AI
    return {
      technicalAccuracy: this.calculateTechnicalScore(response, criteria),
      communicationSkills: this.calculateCommunicationScore(response, duration),
      problemSolving: this.calculateProblemSolvingScore(response, criteria),
      confidence: this.calculateConfidenceScore(response, duration),
      relevance: this.calculateRelevanceScore(response, question),
      clarity: this.calculateClarityScore(response, duration),
      structure: this.calculateStructureScore(response),
      examples: this.calculateExamplesScore(response, criteria.questionType)
    }
  }

  private calculateTechnicalScore(response: string, criteria: ScoringCriteria): number {
    if (criteria.questionType !== 'technical') return 100 // N/A for non-technical

    const technicalKeywords = this.getTechnicalKeywords(criteria.role)
    const responseText = response.toLowerCase()
    
    let keywordScore = 0
    let totalWeight = 0
    
    for (const [keyword, weight] of Object.entries(technicalKeywords)) {
      totalWeight += weight
      if (responseText.includes(keyword.toLowerCase())) {
        keywordScore += weight
      }
    }

    const keywordPercentage = totalWeight > 0 ? (keywordScore / totalWeight) * 100 : 50

    // Bonus for detailed explanations
    const detailBonus = response.length > 200 ? 10 : 0
    
    return Math.min(100, keywordPercentage + detailBonus)
  }

  private calculateCommunicationScore(response: string, duration: number): number {
    const words = response.split(/\s+/).length
    const wordsPerSecond = words / duration

    // Optimal speaking rate: 2-3 words per second
    const rateScore = wordsPerSecond >= 1.5 && wordsPerSecond <= 4 ? 100 : 
                     wordsPerSecond >= 1 && wordsPerSecond <= 5 ? 80 :
                     wordsPerSecond >= 0.5 && wordsPerSecond <= 6 ? 60 : 40

    // Grammar and coherence (simple heuristics)
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const avgSentenceLength = words / sentences.length
    const coherenceScore = avgSentenceLength >= 5 && avgSentenceLength <= 20 ? 100 : 70

    // Filler words penalty
    const fillerWords = ['um', 'uh', 'like', 'you know', 'basically']
    let fillerCount = 0
    const responseText = response.toLowerCase()
    fillerWords.forEach(filler => {
      fillerCount += (responseText.match(new RegExp(`\\b${filler}\\b`, 'g')) || []).length
    })
    const fillerPenalty = Math.min(30, fillerCount * 5)

    return Math.max(20, (rateScore + coherenceScore) / 2 - fillerPenalty)
  }

  private calculateProblemSolvingScore(response: string, criteria: ScoringCriteria): number {
    const responseText = response.toLowerCase()
    
    // Look for problem-solving indicators
    const problemSolvingKeywords = [
      'analyze', 'approach', 'solution', 'strategy', 'consider', 'evaluate',
      'pros and cons', 'trade-off', 'alternative', 'implement', 'test',
      'first', 'then', 'next', 'finally', 'because', 'therefore'
    ]

    let keywordCount = 0
    problemSolvingKeywords.forEach(keyword => {
      if (responseText.includes(keyword)) keywordCount++
    })

    const keywordScore = Math.min(100, (keywordCount / problemSolvingKeywords.length) * 150)

    // Look for structured thinking (numbered lists, clear steps)
    const structureIndicators = /\b(first|second|third|1\.|2\.|3\.|step|phase)\b/gi
    const structureMatches = responseText.match(structureIndicators) || []
    const structureBonus = Math.min(20, structureMatches.length * 5)

    return Math.min(100, keywordScore + structureBonus)
  }

  private calculateConfidenceScore(response: string, duration: number): number {
    const responseText = response.toLowerCase()
    
    // Confident language indicators
    const confidentPhrases = ['i believe', 'i think', 'in my experience', 'i would', 'i will']
    const uncertainPhrases = ['maybe', 'perhaps', 'i guess', 'not sure', 'probably']
    
    let confidentCount = 0
    let uncertainCount = 0
    
    confidentPhrases.forEach(phrase => {
      confidentCount += (responseText.match(new RegExp(`\\b${phrase}\\b`, 'g')) || []).length
    })
    
    uncertainPhrases.forEach(phrase => {
      uncertainCount += (responseText.match(new RegExp(`\\b${phrase}\\b`, 'g')) || []).length
    })

    // Response completeness (good indicator of confidence)
    const completenessScore = response.length > 100 ? 20 : response.length > 50 ? 10 : 0
    
    // Speaking pace consistency (confident speakers maintain steady pace)
    const words = response.split(/\s+/).length
    const paceScore = words > 0 && duration > 0 ? Math.min(30, (words / duration) * 10) : 0

    const baseScore = 50
    const confidentBonus = confidentCount * 10
    const uncertainPenalty = uncertainCount * 8
    
    return Math.max(20, Math.min(100, baseScore + confidentBonus - uncertainPenalty + completenessScore + paceScore))
  }

  private calculateRelevanceScore(response: string, question: string): number {
    const questionWords = question.toLowerCase().split(/\s+/)
    const responseText = response.toLowerCase()
    
    // Remove common words
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with']
    const relevantQuestionWords = questionWords.filter(word => 
      word.length > 3 && !commonWords.includes(word)
    )
    
    let relevantWordCount = 0
    relevantQuestionWords.forEach(word => {
      if (responseText.includes(word)) {
        relevantWordCount++
      }
    })

    const relevancePercentage = relevantQuestionWords.length > 0 ? 
      (relevantWordCount / relevantQuestionWords.length) * 100 : 50

    // Bonus for directly addressing the question
    const directAddressing = responseText.includes('question') || 
                            responseText.includes('answer') ||
                            responseText.includes('experience') ? 10 : 0

    return Math.min(100, relevancePercentage + directAddressing)
  }

  private calculateClarityScore(response: string, duration: number): number {
    const words = response.split(/\s+/)
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    // Average sentence length (clear communication has moderate sentence length)
    const avgSentenceLength = words.length / sentences.length
    const sentenceLengthScore = avgSentenceLength >= 8 && avgSentenceLength <= 25 ? 100 : 
                               avgSentenceLength >= 5 && avgSentenceLength <= 30 ? 80 : 60

    // Vocabulary diversity
    const uniqueWords = new Set(words.map(w => w.toLowerCase()))
    const vocabularyScore = Math.min(100, (uniqueWords.size / words.length) * 200)

    // Coherence indicators
    const transitionWords = ['however', 'therefore', 'furthermore', 'additionally', 'consequently']
    const transitionCount = transitionWords.reduce((count, word) => {
      return count + (response.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length
    }, 0)
    const transitionBonus = Math.min(20, transitionCount * 5)

    return (sentenceLengthScore + vocabularyScore) / 2 + transitionBonus
  }

  private calculateStructureScore(response: string): number {
    const responseText = response.toLowerCase()
    
    // STAR method indicators (Situation, Task, Action, Result)
    const starIndicators = {
      situation: ['situation', 'context', 'background', 'when', 'where'],
      task: ['task', 'challenge', 'problem', 'goal', 'objective'],
      action: ['action', 'did', 'implemented', 'decided', 'approach'],
      result: ['result', 'outcome', 'achieved', 'success', 'learned']
    }

    let starScore = 0
    for (const [category, keywords] of Object.entries(starIndicators)) {
      const hasCategory = keywords.some(keyword => responseText.includes(keyword))
      if (hasCategory) starScore += 25
    }

    // Logical flow indicators
    const flowWords = ['first', 'then', 'next', 'finally', 'because', 'so', 'therefore']
    const flowCount = flowWords.reduce((count, word) => {
      return count + (responseText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length
    }, 0)
    const flowBonus = Math.min(20, flowCount * 3)

    return Math.min(100, starScore + flowBonus)
  }

  private calculateExamplesScore(response: string, questionType: string): number {
    const responseText = response.toLowerCase()
    
    // Example indicators
    const exampleIndicators = [
      'for example', 'for instance', 'such as', 'like when', 'in my experience',
      'at my previous job', 'when i worked', 'in one project', 'recently'
    ]

    let exampleCount = 0
    exampleIndicators.forEach(indicator => {
      if (responseText.includes(indicator)) exampleCount++
    })

    // Specificity indicators (dates, numbers, specific technologies/companies)
    const specificityIndicators = /\b(19|20)\d{2}\b|\b\d+\s?(months?|years?|weeks?)\b|[A-Z][a-zA-Z]+\s+(Company|Corp|Inc|Ltd)/g
    const specificityMatches = responseText.match(specificityIndicators) || []

    const baseScore = Math.min(80, exampleCount * 20)
    const specificityBonus = Math.min(20, specificityMatches.length * 5)

    // Behavioral questions weight examples more heavily
    const typeMultiplier = questionType === 'behavioral' ? 1.2 : 1.0

    return Math.min(100, (baseScore + specificityBonus) * typeMultiplier)
  }

  private calculateOverallScore(breakdown: DetailedScore['breakdown']): number {
    // Weighted average based on importance
    const weights = {
      technicalAccuracy: 0.15,
      communicationSkills: 0.20,
      problemSolving: 0.15,
      confidence: 0.10,
      relevance: 0.15,
      clarity: 0.10,
      structure: 0.10,
      examples: 0.05
    }

    let weightedSum = 0
    let totalWeight = 0

    for (const [category, score] of Object.entries(breakdown)) {
      const weight = weights[category as keyof typeof weights] || 0
      weightedSum += score * weight
      totalWeight += weight
    }

    return Math.round(weightedSum / totalWeight)
  }

  private assessLevel(breakdown: DetailedScore['breakdown'], role: string): DetailedScore['levelAssessment'] {
    const avgScore = this.calculateOverallScore(breakdown)

    // Adjust thresholds based on role complexity
    const roleComplexity = this.getRoleComplexity(role)
    const thresholds = {
      senior: 85 - roleComplexity,
      mid: 70 - roleComplexity,
      junior: 50 - roleComplexity
    }

    if (avgScore >= thresholds.senior) return 'senior'
    if (avgScore >= thresholds.mid) return 'mid'
    if (avgScore >= thresholds.junior) return 'junior'
    return 'junior' // Entry level
  }

  private identifyStrengths(breakdown: DetailedScore['breakdown'], response: string): string[] {
    const strengths: string[] = []
    const sortedScores = Object.entries(breakdown).sort(([,a], [,b]) => b - a)

    // Top 3 scoring categories
    const topCategories = sortedScores.slice(0, 3)

    topCategories.forEach(([category, score]) => {
      if (score >= 80) {
        strengths.push(this.getStrengthDescription(category, score))
      }
    })

    // Response-specific strengths
    if (response.length > 300) {
      strengths.push('Provides comprehensive and detailed responses')
    }

    if (response.toLowerCase().includes('example') || response.toLowerCase().includes('experience')) {
      strengths.push('Supports answers with concrete examples')
    }

    return strengths.slice(0, 5) // Limit to top 5 strengths
  }

  private identifyWeaknesses(breakdown: DetailedScore['breakdown'], response: string): string[] {
    const weaknesses: string[] = []
    const sortedScores = Object.entries(breakdown).sort(([,a], [,b]) => a - b)

    // Bottom scoring categories
    const bottomCategories = sortedScores.slice(0, 3)

    bottomCategories.forEach(([category, score]) => {
      if (score < 60) {
        weaknesses.push(this.getWeaknessDescription(category, score))
      }
    })

    // Response-specific weaknesses
    if (response.length < 50) {
      weaknesses.push('Responses are too brief and lack detail')
    }

    return weaknesses.slice(0, 5) // Limit to top 5 weaknesses
  }

  private generateRecommendations(breakdown: DetailedScore['breakdown'], criteria: ScoringCriteria): string[] {
    const recommendations: string[] = []
    const weakAreas = Object.entries(breakdown).filter(([, score]) => score < 70)

    weakAreas.forEach(([category, score]) => {
      recommendations.push(this.getRecommendation(category, criteria.questionType))
    })

    return recommendations.slice(0, 5)
  }

  private createImprovementPlan(breakdown: DetailedScore['breakdown'], criteria: ScoringCriteria): DetailedScore['improvementPlan'] {
    const weakAreas = Object.entries(breakdown)
      .filter(([, score]) => score < 70)
      .sort(([,a], [,b]) => a - b)

    const shortTerm: string[] = []
    const longTerm: string[] = []

    weakAreas.slice(0, 2).forEach(([category]) => {
      shortTerm.push(this.getShortTermImprovement(category))
    })

    weakAreas.forEach(([category]) => {
      longTerm.push(this.getLongTermImprovement(category))
    })

    return { shortTerm: shortTerm.slice(0, 3), longTerm: longTerm.slice(0, 3) }
  }

  // Helper methods for descriptions and recommendations
  private getTechnicalKeywords(role: string): Record<string, number> {
    const keywordSets: Record<string, Record<string, number>> = {
      'Frontend Engineer': {
        'react': 3, 'javascript': 3, 'css': 2, 'html': 2, 'typescript': 3,
        'responsive': 2, 'performance': 3, 'accessibility': 2, 'webpack': 2
      },
      'Backend Engineer': {
        'api': 3, 'database': 3, 'sql': 2, 'python': 2, 'java': 2,
        'microservices': 3, 'scalability': 3, 'security': 3, 'docker': 2
      },
      'Full Stack Engineer': {
        'full stack': 3, 'frontend': 2, 'backend': 2, 'database': 3,
        'api': 3, 'deployment': 2, 'architecture': 3, 'cloud': 2
      },
      'Product Manager': {
        'user experience': 3, 'metrics': 3, 'roadmap': 3, 'stakeholders': 3,
        'agile': 2, 'requirements': 2, 'market': 3, 'analytics': 3
      }
    }

    return keywordSets[role] || {}
  }

  private getRoleComplexity(role: string): number {
    const complexityMap: Record<string, number> = {
      'Senior': 10,
      'Lead': 15,
      'Principal': 20,
      'Staff': 15,
      'Manager': 10
    }

    for (const [key, complexity] of Object.entries(complexityMap)) {
      if (role.includes(key)) return complexity
    }

    return 0
  }

  private getStrengthDescription(category: string, score: number): string {
    const descriptions: Record<string, string> = {
      technicalAccuracy: 'Demonstrates strong technical knowledge and accuracy',
      communicationSkills: 'Excellent communication and articulation skills',
      problemSolving: 'Shows strong analytical and problem-solving abilities',
      confidence: 'Displays confidence and conviction in responses',
      relevance: 'Provides highly relevant and on-topic answers',
      clarity: 'Communicates with exceptional clarity and precision',
      structure: 'Uses well-structured and organized response format',
      examples: 'Effectively uses concrete examples to illustrate points'
    }

    return descriptions[category] || 'Shows strength in this area'
  }

  private getWeaknessDescription(category: string, score: number): string {
    const descriptions: Record<string, string> = {
      technicalAccuracy: 'Could improve technical depth and accuracy',
      communicationSkills: 'Needs to work on communication clarity and flow',
      problemSolving: 'Should develop stronger problem-solving approach',
      confidence: 'Could benefit from more confident delivery',
      relevance: 'Should focus more on directly addressing the question',
      clarity: 'Needs improvement in clear and concise communication',
      structure: 'Could use better organization and structure in responses',
      examples: 'Should include more specific examples and evidence'
    }

    return descriptions[category] || 'Needs improvement in this area'
  }

  private getRecommendation(category: string, questionType: string): string {
    const recommendations: Record<string, string> = {
      technicalAccuracy: 'Study core technical concepts and practice explaining complex topics clearly',
      communicationSkills: 'Practice speaking aloud and focus on pace, clarity, and eliminating filler words',
      problemSolving: 'Use structured problem-solving frameworks like "Define-Analyze-Solve-Validate"',
      confidence: 'Practice responses out loud and work on positive body language and tone',
      relevance: 'Listen carefully to questions and create mental outlines before responding',
      clarity: 'Use the PREP method: Point, Reason, Example, Point to organize thoughts',
      structure: 'Practice STAR method (Situation, Task, Action, Result) for behavioral questions',
      examples: 'Prepare 3-5 detailed stories that demonstrate different skills and experiences'
    }

    return recommendations[category] || 'Focus on practicing this specific area'
  }

  private getShortTermImprovement(category: string): string {
    const improvements: Record<string, string> = {
      technicalAccuracy: 'Review fundamental concepts for 30 minutes daily',
      communicationSkills: 'Practice speaking responses aloud for 15 minutes daily',
      problemSolving: 'Solve one practice problem using structured approach daily',
      confidence: 'Record yourself answering questions and review for improvement',
      relevance: 'Practice listening to questions twice before responding',
      clarity: 'Write out key points before speaking in practice sessions',
      structure: 'Practice STAR method with 3 different scenarios this week',
      examples: 'Prepare and practice 2-3 detailed stories from your experience'
    }

    return improvements[category] || 'Focus practice sessions on this area'
  }

  private getLongTermImprovement(category: string): string {
    const improvements: Record<string, string> = {
      technicalAccuracy: 'Take advanced courses or certifications in your field',
      communicationSkills: 'Join Toastmasters or take a public speaking course',
      problemSolving: 'Practice whiteboard problems and case studies regularly',
      confidence: 'Seek speaking opportunities and practice presentations',
      relevance: 'Study job descriptions and common interview questions for your role',
      clarity: 'Work with a communication coach or mentor',
      structure: 'Practice different response frameworks for various question types',
      examples: 'Build a portfolio of diverse professional experiences and stories'
    }

    return improvements[category] || 'Develop long-term practice plan for this skill'
  }
}

export const scoringSystem = ScoringSystem.getInstance()
