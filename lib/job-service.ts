import { createClient } from '@/lib/supabase/server'
import type { Job, JobSearchParams, ExternalJobResponse, JobFeedCache } from '@/types/jobs'

const CACHE_TTL_HOURS = 24 // Jobs expire after 24 hours
const RAPIDAPI_HOST = process.env.RAPIDAPI_JOBS_HOST || 'jsearch.p.rapidapi.com'
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY

interface RapidAPIResponse {
  status: string
  request_id?: string
  parameters?: any
  data: ExternalJobResponse[]
  error?: string
}

export class JobService {
  /**
   * Search for jobs with cache-first strategy
   */
  async searchJobs(params: JobSearchParams): Promise<Job[]> {
    const supabase = createClient()
    const {
      role,
      keywords = [],
      industry,
      location,
      seniority,
      limit = 20,
    } = params

    // Combine role and keywords for searching
    const searchKeywords = role ? [role, ...keywords] : keywords

    try {
      // Try to get from cache first
      const cachedJobs = await this.getCachedJobs({
        keywords: searchKeywords,
        industry,
        location,
        seniority,
        limit,
      })

      // If we have enough cached results (at least 50% of requested), return them
      if (cachedJobs.length >= Math.ceil(limit / 2)) {
        console.log(`Returning ${cachedJobs.length} cached jobs`)
        return cachedJobs
      }

      // Otherwise, fetch fresh data from external API
      console.log('Cache miss or insufficient results, fetching from external API')
      const freshJobs = await this.fetchFromExternalAPI({
        role,
        location,
        limit,
      })

      // Cache the fresh results
      if (freshJobs.length > 0) {
        await this.cacheJobs(freshJobs, { industry, seniority, keywords: searchKeywords })
      }

      // Return fresh results
      return freshJobs

    } catch (error) {
      console.error('Error searching jobs:', error)
      
      // Fallback to cached results even if less than desired
      const cachedJobs = await this.getCachedJobs({
        keywords: searchKeywords,
        industry,
        location,
        seniority,
        limit,
      })

      if (cachedJobs.length > 0) {
        console.log(`Returning ${cachedJobs.length} cached jobs as fallback`)
        return cachedJobs
      }

      throw error
    }
  }

  /**
   * Get jobs from cache
   */
  private async getCachedJobs(params: JobSearchParams): Promise<Job[]> {
    try {
      const supabase = createClient()
      const { keywords = [], industry, location, seniority, limit = 20 } = params

      let query = supabase
        .from('job_feeds')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(limit)

      // Apply filters
      if (keywords.length > 0) {
        query = query.overlaps('role_keywords', keywords)
      }

      if (industry) {
        query = query.eq('industry', industry)
      }

      if (location) {
        query = query.ilike('location', `%${location}%`)
      }

      if (seniority) {
        query = query.eq('seniority_level', seniority)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching cached jobs:', error)
        return []
      }

      return (data || []).map(this.mapCachedJobToJob)
    } catch (error) {
      console.error('Error in getCachedJobs:', error)
      return []
    }
  }

  /**
   * Fetch jobs from external API (RapidAPI JSearch)
   */
  private async fetchFromExternalAPI(params: {
    role?: string
    location?: string
    limit?: number
  }): Promise<Job[]> {
    if (!RAPIDAPI_KEY) {
      console.warn('RAPIDAPI_KEY not configured, skipping external API fetch')
      return []
    }

    const { role = 'software engineer', location, limit = 20 } = params

    try {
      // Build query string
      const query = location ? `${role} in ${location}` : role

      const url = new URL(`https://${RAPIDAPI_HOST}/search`)
      url.searchParams.set('query', query)
      url.searchParams.set('num_pages', '1')
      url.searchParams.set('page', '1')
      url.searchParams.set('date_posted', 'month') // Jobs from last month

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': RAPIDAPI_HOST,
        },
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!response.ok) {
        throw new Error(`External API error: ${response.status} ${response.statusText}`)
      }

      const data: RapidAPIResponse = await response.json()

      if (data.error) {
        throw new Error(`External API error: ${data.error}`)
      }

      if (!data.data || !Array.isArray(data.data)) {
        console.warn('External API returned no data')
        return []
      }

      // Map external API response to our Job format
      return data.data.slice(0, limit).map(this.mapExternalJobToJob)
    } catch (error) {
      console.error('Error fetching from external API:', error)
      throw error
    }
  }

  /**
   * Cache jobs in Supabase
   */
  private async cacheJobs(
    jobs: Job[],
    metadata: { industry?: string; seniority?: string; keywords?: string[] }
  ): Promise<void> {
    try {
      const supabase = createClient()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS)

      const jobRecords: Partial<JobFeedCache>[] = jobs.map((job) => ({
        external_id: job.externalId,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        apply_url: job.applyUrl,
        salary_range: job.salaryRange,
        employment_type: job.employmentType,
        role_keywords: metadata.keywords || job.roleKeywords || [],
        industry: metadata.industry || job.industry,
        seniority_level: metadata.seniority || job.seniorityLevel,
        source: job.source,
        expires_at: expiresAt.toISOString(),
      }))

      // Use upsert to handle duplicates
      const { error } = await supabase
        .from('job_feeds')
        .upsert(jobRecords, {
          onConflict: 'external_id',
          ignoreDuplicates: false,
        })

      if (error) {
        console.error('Error caching jobs:', error)
      } else {
        console.log(`Cached ${jobRecords.length} jobs`)
      }
    } catch (error) {
      console.error('Error in cacheJobs:', error)
    }
  }

  /**
   * Clean up expired jobs from cache
   */
  async cleanupExpiredJobs(): Promise<number> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('cleanup_expired_jobs')

      if (error) {
        console.error('Error cleaning up expired jobs:', error)
        return 0
      }

      return data || 0
    } catch (error) {
      console.error('Error in cleanupExpiredJobs:', error)
      return 0
    }
  }

  /**
   * Map external API job to our Job format
   */
  private mapExternalJobToJob(externalJob: ExternalJobResponse): Job {
    const location = [
      externalJob.job_city,
      externalJob.job_state,
      externalJob.job_country,
    ]
      .filter(Boolean)
      .join(', ')

    let salaryRange: string | undefined
    if (externalJob.job_min_salary && externalJob.job_max_salary) {
      const currency = externalJob.job_salary_currency || 'USD'
      const period = externalJob.job_salary_period || 'YEAR'
      salaryRange = `${currency} ${externalJob.job_min_salary.toLocaleString()}-${externalJob.job_max_salary.toLocaleString()}/${period}`
    }

    // Extract keywords from title
    const roleKeywords = externalJob.job_title
      .toLowerCase()
      .split(/[\s,-]+/)
      .filter((word) => word.length > 2)

    return {
      id: externalJob.job_id,
      externalId: externalJob.job_id,
      title: externalJob.job_title,
      company: externalJob.employer_name,
      location: location || undefined,
      description: externalJob.job_description,
      applyUrl: externalJob.job_apply_link,
      salaryRange,
      employmentType: externalJob.job_employment_type,
      roleKeywords,
      source: 'jsearch',
      createdAt: externalJob.job_posted_at_timestamp
        ? new Date(externalJob.job_posted_at_timestamp * 1000).toISOString()
        : new Date().toISOString(),
      expiresAt: new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString(),
    }
  }

  /**
   * Map cached job to our Job format
   */
  private mapCachedJobToJob(cachedJob: JobFeedCache): Job {
    return {
      id: cachedJob.id,
      externalId: cachedJob.external_id,
      title: cachedJob.title,
      company: cachedJob.company,
      location: cachedJob.location,
      description: cachedJob.description,
      applyUrl: cachedJob.apply_url,
      salaryRange: cachedJob.salary_range,
      employmentType: cachedJob.employment_type,
      roleKeywords: cachedJob.role_keywords,
      industry: cachedJob.industry,
      seniorityLevel: cachedJob.seniority_level,
      source: cachedJob.source,
      createdAt: cachedJob.created_at,
      expiresAt: cachedJob.expires_at,
    }
  }
}

// Export singleton instance - Note: createClient() is called per-method to avoid
// Next.js build-time errors with cookies() being called outside request context
export const jobService = new JobService()
