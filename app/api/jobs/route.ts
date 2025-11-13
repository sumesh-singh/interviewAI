import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jobService } from '@/lib/job-service'
import type { JobSearchParams } from '@/types/jobs'
import { z } from 'zod'

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // 10 requests per minute

// Validation schema for query parameters
const jobSearchSchema = z.object({
  role: z.string().optional(),
  keywords: z.string().optional(), // comma-separated
  industry: z.string().optional(),
  location: z.string().optional(),
  seniority: z.string().optional(),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
})

/**
 * GET /api/jobs
 * Fetch personalized job listings based on user profile and query parameters
 * 
 * Query Parameters:
 * - role: Target role (e.g., "Software Engineer")
 * - keywords: Comma-separated keywords
 * - industry: Industry filter
 * - location: Location filter
 * - seniority: Seniority level (e.g., "entry", "mid", "senior")
 * - limit: Number of results (default: 20, max: 50)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to access job listings.' },
        { status: 401 }
      )
    }

    // 2. Rate limiting check
    const now = Date.now()
    const userId = user.id
    const rateLimitKey = userId

    const userRateLimit = rateLimitMap.get(rateLimitKey)
    if (userRateLimit) {
      if (now < userRateLimit.resetAt) {
        if (userRateLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
          return NextResponse.json(
            {
              error: 'Rate limit exceeded. Please try again later.',
              retryAfter: Math.ceil((userRateLimit.resetAt - now) / 1000),
            },
            { status: 429 }
          )
        }
        userRateLimit.count++
      } else {
        // Reset rate limit window
        rateLimitMap.set(rateLimitKey, {
          count: 1,
          resetAt: now + RATE_LIMIT_WINDOW_MS,
        })
      }
    } else {
      rateLimitMap.set(rateLimitKey, {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW_MS,
      })
    }

    // 3. Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      role: searchParams.get('role') || undefined,
      keywords: searchParams.get('keywords') || undefined,
      industry: searchParams.get('industry') || undefined,
      location: searchParams.get('location') || undefined,
      seniority: searchParams.get('seniority') || undefined,
      limit: searchParams.get('limit') || undefined,
    }

    const validatedParams = jobSearchSchema.parse(queryParams)

    // 4. Get user profile to personalize results
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    // 5. Build search parameters
    const searchParams_: JobSearchParams = {
      role: validatedParams.role,
      keywords: validatedParams.keywords
        ? validatedParams.keywords.split(',').map((k) => k.trim())
        : [],
      industry: validatedParams.industry,
      location: validatedParams.location,
      seniority: validatedParams.seniority,
      limit: Math.min(validatedParams.limit, 50), // Cap at 50
    }

    // If no explicit parameters provided, try to use user profile data
    if (!searchParams_.role && !searchParams_.keywords?.length && userProfile) {
      // Try to extract profile information if available
      // This is a placeholder - adjust based on actual profile structure
      const profileData = userProfile as any
      
      if (profileData.bio && !searchParams_.role) {
        // You might want to add more sophisticated logic here
        searchParams_.role = 'software engineer' // Default role
      }
    }

    // 6. Search for jobs using the job service
    const startTime = Date.now()
    const jobs = await jobService.searchJobs(searchParams_)
    const duration = Date.now() - startTime

    // Log performance
    console.log(`Job search completed in ${duration}ms, returned ${jobs.length} jobs`)

    // 7. Return results
    return NextResponse.json({
      success: true,
      data: jobs,
      meta: {
        count: jobs.length,
        duration,
        params: searchParams_,
      },
    })
  } catch (error) {
    console.error('Error in /api/jobs:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error. Please try again later.',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/jobs/cleanup
 * Clean up expired jobs from cache (admin/service endpoint)
 */
export async function POST(request: NextRequest) {
  try {
    // Simple auth check - in production, use proper service key validation
    const authHeader = request.headers.get('authorization')
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceKey || authHeader !== `Bearer ${serviceKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const deletedCount = await jobService.cleanupExpiredJobs()

    return NextResponse.json({
      success: true,
      deletedCount,
    })
  } catch (error) {
    console.error('Error in /api/jobs POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
