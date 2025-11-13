# InterviewAI Implementation Guide

This document provides step-by-step implementation guides for the highest priority recommendations.

---

## 1. Backend API Integration for AI Services

### Objective
Move OpenAI API calls from frontend to backend for security and scalability.

### Step 1: Create Backend API Routes

**File: `app/api/ai/generate-questions/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'

// Validation schema
const GenerateQuestionsSchema = z.object({
  role: z.string().min(1).max(100),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  type: z.enum(['behavioral', 'technical', 'situational']),
  count: z.number().min(1).max(10),
  existingQuestions: z.array(z.string()).optional(),
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  // NOT using dangerouslyAllowBrowser on server
})

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await rateLimit(ip, 'generate-questions', 100) // 100 calls per minute
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Validate request
    const body = await request.json()
    const validatedData = GenerateQuestionsSchema.parse(body)

    // Call OpenAI
    const prompt = `Generate ${validatedData.count} ${validatedData.difficulty} ${validatedData.type} interview questions for a ${validatedData.role} position.

Requirements:
- Each question should be realistic and commonly asked
- Include 2-3 relevant follow-up questions for each
- Set appropriate time limits (60-300 seconds based on complexity)
- Avoid these questions if provided: ${validatedData.existingQuestions?.join(', ') || 'none'}

Return as JSON array with this structure:
[{
  "question": "main question",
  "type": "${validatedData.type}",
  "difficulty": "${validatedData.difficulty}",
  "followUp": ["follow-up 1", "follow-up 2"],
  "timeLimit": 180
}]`

    const completion = await openai.chat.completions.create({
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

    const responseText = completion.choices[0].message.content
    const result = JSON.parse(responseText || '{"questions": []}')

    return NextResponse.json({
      success: true,
      questions: result.questions || []
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error generating questions:', error)
    return NextResponse.json(
      { error: 'Failed to generate interview questions' },
      { status: 500 }
    )
  }
}
```

**File: `app/api/ai/evaluate-response/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'

const EvaluateResponseSchema = z.object({
  question: z.string().min(1),
  response: z.string().min(1),
  role: z.string().min(1),
  duration: z.number().min(0),
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = EvaluateResponseSchema.parse(body)

    const prompt = `Evaluate this interview response for a ${validatedData.role} position:

Question: "${validatedData.question}"
Response: "${validatedData.response}"
Response Duration: ${validatedData.duration} seconds

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

    const completion = await openai.chat.completions.create({
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

    return NextResponse.json({
      success: true,
      feedback: result
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error evaluating response:', error)
    return NextResponse.json(
      { error: 'Failed to evaluate interview response' },
      { status: 500 }
    )
  }
}
```

### Step 2: Create API Client

**File: `lib/api-client.ts`**
```typescript
interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  details?: unknown
}

class APIClient {
  private baseURL = '/api'
  private timeout = 30000 // 30 seconds

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || `API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await this.request<APIResponse<T>>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!response.success) {
      throw new Error(response.error || 'API request failed')
    }

    return response.data as T
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`, window.location.origin)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value))
      })
    }

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  }
}

export const apiClient = new APIClient()
```

### Step 3: Update Frontend Components

**File: `lib/openai.ts` (Updated)**
```typescript
import { apiClient } from './api-client'

export class OpenAIService {
  async generateQuestions(params: QuestionGenerationParams) {
    return apiClient.post('/ai/generate-questions', params)
  }

  async evaluateResponse(params: ResponseEvaluationParams) {
    return apiClient.post('/ai/evaluate-response', params)
  }

  async generateFollowUp(question: string, response: string, role: string) {
    return apiClient.post('/ai/followup', {
      question,
      response,
      role,
    })
  }
}

export const openAIService = new OpenAIService()
```

---

## 2. Comprehensive Error Handling

### Error Boundary Component

**File: `components/error-boundary.tsx`**
```typescript
'use client'

import React, { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.reset)
      }

      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-red-800">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={this.reset}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Try again
              </Button>
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Go home
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
```

### Retry Logic

**File: `lib/retry.ts`**
```typescript
interface RetryOptions {
  maxAttempts?: number
  delay?: number
  maxDelay?: number
  backoffMultiplier?: number
  jitter?: boolean
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  delay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error | undefined

  for (let attempt = 0; attempt < config.maxAttempts!; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt < config.maxAttempts! - 1) {
        const delay = calculateDelay(
          attempt,
          config.delay!,
          config.maxDelay!,
          config.backoffMultiplier!,
          config.jitter!
        )
        
        console.warn(
          `Attempt ${attempt + 1} failed, retrying in ${delay}ms:`,
          error
        )
        
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  multiplier: number,
  jitter: boolean
): number {
  let delay = baseDelay * Math.pow(multiplier, attempt)
  delay = Math.min(delay, maxDelay)
  
  if (jitter) {
    delay = delay * (0.5 + Math.random() * 0.5)
  }
  
  return Math.round(delay)
}

// Usage
const result = await retry(
  () => apiClient.post('/ai/generate-questions', params),
  { maxAttempts: 3, delay: 1000 }
)
```

### Circuit Breaker Pattern

**File: `lib/circuit-breaker.ts`**
```typescript
enum CircuitState {
  CLOSED = 'CLOSED',      // Normal operation
  OPEN = 'OPEN',          // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

interface CircuitBreakerConfig {
  failureThreshold?: number  // Failures before opening
  resetTimeout?: number      // MS to wait before half-open
  successThreshold?: number  // Successes in half-open to close
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 60000,
  successThreshold: 2,
}

export class CircuitBreaker<T> {
  private state = CircuitState.CLOSED
  private failureCount = 0
  private successCount = 0
  private nextAttemptTime = Date.now()

  constructor(
    private fn: () => Promise<T>,
    private config: CircuitBreakerConfig = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async call(): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error('Circuit breaker is OPEN')
      }
      this.state = CircuitState.HALF_OPEN
    }

    try {
      const result = await this.fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failureCount = 0

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++
      if (this.successCount >= this.config.successThreshold!) {
        this.state = CircuitState.CLOSED
        this.successCount = 0
      }
    }
  }

  private onFailure(): void {
    this.failureCount++

    if (this.failureCount >= this.config.failureThreshold!) {
      this.state = CircuitState.OPEN
      this.nextAttemptTime = Date.now() + this.config.resetTimeout!
    }
  }

  getState(): CircuitState {
    return this.state
  }
}

// Usage
const breaker = new CircuitBreaker(
  () => apiClient.post('/ai/generate-questions', params),
  { failureThreshold: 5, resetTimeout: 30000 }
)

try {
  const result = await breaker.call()
} catch (error) {
  console.error('Circuit breaker rejected request:', error)
}
```

---

## 3. Rate Limiting

**File: `lib/rate-limit.ts`**
```typescript
interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
}

class RateLimiter {
  private limits = new Map<string, { count: number; resetTime: number }>()

  check(
    key: string,
    limit: number,
    windowMs: number = 60000
  ): RateLimitResult {
    const now = Date.now()
    const entry = this.limits.get(key)

    if (!entry || now > entry.resetTime) {
      // Reset window
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs,
      })
      return {
        success: true,
        remaining: limit - 1,
        resetTime: now + windowMs,
      }
    }

    entry.count++

    if (entry.count > limit) {
      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime,
      }
    }

    return {
      success: true,
      remaining: limit - entry.count,
      resetTime: entry.resetTime,
    }
  }
}

export const rateLimiter = new RateLimiter()

export async function rateLimit(
  key: string,
  limit: number = 100,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  return rateLimiter.check(key, limit, windowMs)
}
```

---

## 4. Logging Infrastructure

**File: `lib/logger.ts`**
```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: unknown
  error?: Error
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development'

  log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    }

    if (level === 'error' && data instanceof Error) {
      entry.error = data
    }

    // Console output in development
    if (this.isDev) {
      const style = this.getConsoleStyle(level)
      console.log(`%c[${level.toUpperCase()}] ${message}`, style, data)
    }

    // Send to Sentry in production
    if (!this.isDev) {
      this.sendToSentry(entry)
    }
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data)
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data)
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data)
  }

  error(message: string, error?: Error | unknown): void {
    this.log('error', message, error)
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      debug: 'color: #888',
      info: 'color: #0066cc',
      warn: 'color: #ff8800',
      error: 'color: #cc0000; font-weight: bold',
    }
    return styles[level]
  }

  private sendToSentry(entry: LogEntry): void {
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureMessage(entry.message, entry.level)
    }
  }
}

export const logger = new Logger()
```

---

## 5. Testing Setup

**File: `vitest.config.ts`**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

**File: `test/setup.ts`**
```typescript
import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as any
```

**Example Test: `__tests__/unit/lib/scoring-system.test.ts`**
```typescript
import { describe, it, expect } from 'vitest'
import { ScoringSystem, type ScoringCriteria } from '@/lib/scoring-system'

describe('ScoringSystem', () => {
  const scoringSystem = ScoringSystem.getInstance()

  const criteria: ScoringCriteria = {
    questionType: 'technical',
    role: 'Frontend Engineer',
    difficulty: 'medium',
    expectedDuration: 180,
    keywordWeights: {
      'react': 0.2,
      'hooks': 0.2,
      'performance': 0.15,
    },
  }

  it('should calculate overall score correctly', () => {
    const score = scoringSystem.calculateDetailedScore(
      'Explain React hooks',
      'React hooks are functions that let you use state in functional components. They include useState, useEffect, useContext, etc.',
      120,
      criteria
    )

    expect(score.overallScore).toBeGreaterThanOrEqual(0)
    expect(score.overallScore).toBeLessThanOrEqual(100)
    expect(score.breakdown).toBeDefined()
    expect(score.levelAssessment).toMatch(/junior|mid|senior|lead/)
  })

  it('should identify strengths and weaknesses', () => {
    const score = scoringSystem.calculateDetailedScore(
      'Explain React hooks',
      'React hooks enable state management in functional components through useState for local state, useEffect for side effects, and useContext for global state, making components more reusable and easier to test.',
      180,
      criteria
    )

    expect(score.strengths.length).toBeGreaterThan(0)
    expect(score.weaknesses.length).toBeGreaterThan(0)
  })

  it('should generate improvement plan', () => {
    const score = scoringSystem.calculateDetailedScore(
      'Explain React hooks',
      'They help with state',
      30,
      criteria
    )

    expect(score.improvementPlan.shortTerm.length).toBeGreaterThan(0)
    expect(score.improvementPlan.longTerm.length).toBeGreaterThan(0)
  })
})
```

---

## 6. Supabase Integration

### Database Schema

**File: `supabase/migrations/001_init.sql`**
```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Interview sessions table
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  difficulty VARCHAR(50) NOT NULL,
  duration INT NOT NULL,
  status VARCHAR(50) DEFAULT 'setup',
  total_score FLOAT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Session responses table
CREATE TABLE session_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  question_id VARCHAR(255) NOT NULL,
  response_text TEXT NOT NULL,
  duration INT NOT NULL,
  score FLOAT,
  feedback JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  preferred_voice VARCHAR(50) DEFAULT 'en-US',
  speech_rate FLOAT DEFAULT 1.0,
  speech_pitch FLOAT DEFAULT 1.0,
  auto_speak BOOLEAN DEFAULT true,
  theme VARCHAR(50) DEFAULT 'system',
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX idx_sessions_created_at ON interview_sessions(created_at);
CREATE INDEX idx_responses_session_id ON session_responses(session_id);
CREATE INDEX idx_responses_created_at ON session_responses(created_at);

-- Row level security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can only see their own data" 
  ON interview_sessions FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own responses" 
  ON session_responses FOR ALL 
  USING (session_id IN (
    SELECT id FROM interview_sessions WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can only see their own preferences" 
  ON user_preferences FOR ALL 
  USING (auth.uid() = user_id);
```

### Supabase Client

**File: `lib/supabase/client.ts`**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const supabase = createClient()
```

### Database Service

**File: `lib/db/sessions.ts`**
```typescript
import { supabase } from '@/lib/supabase/client'
import type { StoredSession } from '@/lib/offline-storage'

export async function saveSessionToCloud(session: StoredSession) {
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('interview_sessions')
    .insert({
      id: session.id,
      user_id: user.user.id,
      type: session.session.type,
      difficulty: session.session.difficulty,
      duration: session.session.duration,
      status: session.session.status,
      created_at: session.createdAt,
    })

  if (error) throw error
}

export async function getSessionsFromCloud() {
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('interview_sessions')
    .select('*')
    .eq('user_id', user.user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
```

---

## Next Steps

1. **Priority Implementation**: Backend API Integration (Week 1-2)
2. **Secondary Implementation**: Error Handling & Testing (Week 3-4)
3. **Tertiary Implementation**: Logging & Monitoring (Week 5)
4. **Ongoing**: Supabase Integration (concurrent with others)

Each recommendation includes specific, actionable code examples that can be copied and integrated into your codebase.

