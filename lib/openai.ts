import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for development - use proper server-side implementation in production
})

export interface QuestionGenerationParams {
  role: string
  difficulty: 'easy' | 'medium' | 'hard'
  type: 'behavioral' | 'technical' | 'situational'
  count: number
  existingQuestions?: string[]
}

export interface ResponseEvaluationParams {
  question: string
  response: string
  role: string
  duration: number
}

export interface InterviewFeedback {
  overallScore: number
  technicalAccuracy: number
  communication: number
  confidence: number
  relevance: number
  strengths: string[]
  improvements: string[]
  detailedFeedback: string
}

export class OpenAIService {
  async generateQuestions(params: QuestionGenerationParams): Promise<Array<{
    question: string
    type: string
    difficulty: string
    followUp: string[]
    timeLimit: number
  }>> {
    try {
      const prompt = `Generate ${params.count} ${params.difficulty} ${params.type} interview questions for a ${params.role} position.
      
Requirements:
- Each question should be realistic and commonly asked
- Include 2-3 relevant follow-up questions for each
- Set appropriate time limits (60-300 seconds based on complexity)
- Avoid these questions if provided: ${params.existingQuestions?.join(', ') || 'none'}

Return as JSON array with this structure:
{
  "question": "main question",
  "type": "${params.type}",
  "difficulty": "${params.difficulty}",
  "followUp": ["follow-up 1", "follow-up 2"],
  "timeLimit": 180
}`

      const completion = await client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview coach. Generate high-quality interview questions that help assess candidates effectively.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'gpt-4o-mini',
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })

      const result = JSON.parse(completion.choices[0].message.content || '{"questions": []}')
      return result.questions || []
    } catch (error) {
      console.error('Error generating questions:', error)
      throw new Error('Failed to generate interview questions')
    }
  }

  async evaluateResponse(params: ResponseEvaluationParams): Promise<InterviewFeedback> {
    try {
      const prompt = `Evaluate this interview response for a ${params.role} position:

Question: "${params.question}"
Response: "${params.response}"
Response Duration: ${params.duration} seconds

Provide detailed feedback with scores (0-100) for:
1. Overall Score
2. Technical Accuracy (if applicable)
3. Communication Skills
4. Confidence Level
5. Relevance to Question

Also provide:
- 3 key strengths
- 3 areas for improvement
- Detailed constructive feedback (2-3 sentences)

Return as JSON with this structure:
{
  "overallScore": 85,
  "technicalAccuracy": 80,
  "communication": 90,
  "confidence": 85,
  "relevance": 88,
  "strengths": ["Clear explanation", "Good examples", "Confident delivery"],
  "improvements": ["More technical depth", "Better structure", "Shorter response"],
  "detailedFeedback": "Your response demonstrated strong communication skills..."
}`

      const completion = await client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview coach. Provide constructive, detailed feedback that helps candidates improve their interview performance.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'gpt-4o-mini',
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })

      const result = JSON.parse(completion.choices[0].message.content || '{}')
      return result as InterviewFeedback
    } catch (error) {
      console.error('Error evaluating response:', error)
      throw new Error('Failed to evaluate interview response')
    }
  }

  async generateFollowUp(question: string, response: string, role: string): Promise<string> {
    try {
      const prompt = `Based on this interview exchange for a ${role} position, generate a relevant follow-up question:

Original Question: "${question}"
Candidate Response: "${response}"

Generate ONE thoughtful follow-up question that:
- Digs deeper into their response
- Tests their knowledge further
- Explores practical application
- Is natural and conversational

Return only the follow-up question, no additional text.`

      const completion = await client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an experienced interviewer. Generate natural, insightful follow-up questions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'gpt-4o-mini',
        temperature: 0.6,
        max_tokens: 100
      })

      return completion.choices[0].message.content?.trim() || ''
    } catch (error) {
      console.error('Error generating follow-up:', error)
      return ''
    }
  }
}

export const openAIService = new OpenAIService()
