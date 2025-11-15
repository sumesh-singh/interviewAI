# Job Feed Integration Examples

This document provides examples of how to integrate the job feed API into your frontend components.

## Basic Usage

### Fetching Jobs in a React Component

```tsx
'use client'

import { useState, useEffect } from 'react'
import type { Job } from '@/types/jobs'

export function JobListComponent() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchJobs() {
      try {
        const response = await fetch('/api/jobs?role=Software Engineer&limit=10')
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.success) {
          setJobs(result.data)
        } else {
          setError('Failed to fetch jobs')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  if (loading) return <div>Loading jobs...</div>
  if (error) return <div>Error: {error}</div>
  if (jobs.length === 0) return <div>No jobs found</div>

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div key={job.id} className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold">{job.title}</h3>
          <p className="text-gray-600">{job.company}</p>
          {job.location && <p className="text-sm text-gray-500">{job.location}</p>}
          {job.salaryRange && (
            <p className="text-sm font-medium text-green-600">{job.salaryRange}</p>
          )}
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-blue-600 hover:underline"
          >
            Apply Now →
          </a>
        </div>
      ))}
    </div>
  )
}
```

## Advanced Usage with Filters

### Job Search with User Preferences

```tsx
'use client'

import { useState } from 'react'
import type { Job } from '@/types/jobs'

interface JobSearchProps {
  defaultRole?: string
  defaultLocation?: string
}

export function JobSearchComponent({ defaultRole, defaultLocation }: JobSearchProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    role: defaultRole || '',
    location: defaultLocation || '',
    seniority: '',
    industry: '',
  })

  async function searchJobs() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (filters.role) params.set('role', filters.role)
      if (filters.location) params.set('location', filters.location)
      if (filters.seniority) params.set('seniority', filters.seniority)
      if (filters.industry) params.set('industry', filters.industry)
      params.set('limit', '20')

      const response = await fetch(`/api/jobs?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setJobs(result.data)
      }
    } catch (err) {
      console.error('Error searching jobs:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Role (e.g., Software Engineer)"
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          className="border rounded px-3 py-2"
        />
        <input
          type="text"
          placeholder="Location"
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
          className="border rounded px-3 py-2"
        />
        <select
          value={filters.seniority}
          onChange={(e) => setFilters({ ...filters, seniority: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">All Levels</option>
          <option value="entry">Entry Level</option>
          <option value="mid">Mid Level</option>
          <option value="senior">Senior Level</option>
          <option value="executive">Executive</option>
        </select>
        <button
          onClick={searchJobs}
          disabled={loading}
          className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search Jobs'}
        </button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  )
}

function JobCard({ job }: { job: Job }) {
  return (
    <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-1">{job.title}</h3>
          <p className="text-gray-700 font-medium">{job.company}</p>
          
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
            {job.location && (
              <span className="flex items-center gap-1">
                📍 {job.location}
              </span>
            )}
            {job.employmentType && (
              <span className="px-2 py-1 bg-gray-100 rounded">
                {job.employmentType}
              </span>
            )}
            {job.seniorityLevel && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                {job.seniorityLevel}
              </span>
            )}
          </div>

          {job.salaryRange && (
            <p className="mt-2 text-lg font-semibold text-green-600">
              {job.salaryRange}
            </p>
          )}

          {job.description && (
            <p className="mt-3 text-gray-600 line-clamp-2">
              {job.description}
            </p>
          )}

          {job.roleKeywords && job.roleKeywords.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {job.roleKeywords.slice(0, 5).map((keyword) => (
                <span
                  key={keyword}
                  className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>

        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          Apply →
        </a>
      </div>
    </div>
  )
}
```

## Server-Side Usage (Server Components)

### Fetching Jobs in a Server Component

```tsx
import { createClient } from '@/lib/supabase/server'
import { jobService } from '@/lib/job-service'
import type { Job } from '@/types/jobs'

export default async function JobsPage() {
  // Server-side authentication check
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Please log in to view jobs</div>
  }

  // Fetch jobs server-side
  let jobs: Job[] = []
  try {
    jobs = await jobService.searchJobs({
      role: 'Software Engineer',
      location: 'Remote',
      limit: 10,
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Job Opportunities</h1>
      
      {jobs.length === 0 ? (
        <p>No jobs available at the moment.</p>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="border rounded-lg p-4">
              <h2 className="text-xl font-semibold">{job.title}</h2>
              <p className="text-gray-600">{job.company}</p>
              {job.location && <p className="text-sm">{job.location}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

## Custom Hooks

### useJobs Hook

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Job, JobSearchParams } from '@/types/jobs'

interface UseJobsOptions extends JobSearchParams {
  enabled?: boolean
}

interface UseJobsResult {
  jobs: Job[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useJobs(options: UseJobsOptions = {}): UseJobsResult {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { enabled = true, ...searchParams } = options

  const fetchJobs = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      
      if (searchParams.role) params.set('role', searchParams.role)
      if (searchParams.location) params.set('location', searchParams.location)
      if (searchParams.industry) params.set('industry', searchParams.industry)
      if (searchParams.seniority) params.set('seniority', searchParams.seniority)
      if (searchParams.keywords?.length) {
        params.set('keywords', searchParams.keywords.join(','))
      }
      if (searchParams.limit) params.set('limit', searchParams.limit.toString())

      const response = await fetch(`/api/jobs?${params.toString()}`)
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view jobs')
        }
        if (response.status === 429) {
          throw new Error('Too many requests. Please try again later.')
        }
        throw new Error('Failed to fetch jobs')
      }
      
      const result = await response.json()
      
      if (result.success) {
        setJobs(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch jobs')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [enabled, searchParams])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return { jobs, loading, error, refetch: fetchJobs }
}

// Usage example
function MyComponent() {
  const { jobs, loading, error, refetch } = useJobs({
    role: 'Software Engineer',
    location: 'San Francisco',
    limit: 20,
  })

  // Component implementation...
}
```

## Integration with User Profile

### Personalized Job Recommendations

```tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Job } from '@/types/jobs'

export function PersonalizedJobFeed() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadPersonalizedJobs() {
      try {
        // Get user profile
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setLoading(false)
          return
        }

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        // Fetch jobs based on profile
        const params = new URLSearchParams()
        
        // You can extract preferences from profile data
        // This depends on your user_profiles schema
        if (profile) {
          // Example: if profile has target_role field
          // params.set('role', profile.target_role)
          // params.set('location', profile.target_location)
          // params.set('seniority', profile.experience_level)
        }
        
        params.set('limit', '15')

        const response = await fetch(`/api/jobs?${params.toString()}`)
        const result = await response.json()
        
        if (result.success) {
          setJobs(result.data)
        }
      } catch (err) {
        console.error('Error loading personalized jobs:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPersonalizedJobs()
  }, [supabase])

  // Render component...
}
```

## Error Handling

### Comprehensive Error Handling Example

```tsx
'use client'

import { useState } from 'react'
import type { Job } from '@/types/jobs'

interface ApiError {
  error: string
  details?: any
  retryAfter?: number
}

export function JobFeedWithErrorHandling() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [error, setError] = useState<string | null>(null)
  const [retryAfter, setRetryAfter] = useState<number | null>(null)

  async function fetchJobs() {
    setError(null)
    setRetryAfter(null)

    try {
      const response = await fetch('/api/jobs?role=Developer')
      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          setError('Please log in to view job listings')
          return
        }
        
        if (response.status === 429) {
          const apiError = result as ApiError
          setError('You have made too many requests. Please wait before trying again.')
          setRetryAfter(apiError.retryAfter || 60)
          return
        }

        if (response.status === 400) {
          const apiError = result as ApiError
          setError(`Invalid request: ${apiError.error}`)
          return
        }

        setError('Failed to load jobs. Please try again later.')
        return
      }

      if (result.success) {
        setJobs(result.data)
      }
    } catch (err) {
      setError('Network error. Please check your connection.')
    }
  }

  // Render with error states...
  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-800">{error}</p>
          {retryAfter && (
            <p className="text-sm text-red-600 mt-1">
              Retry after {retryAfter} seconds
            </p>
          )}
        </div>
      )}
      {/* Job listings... */}
    </div>
  )
}
```

## Best Practices

1. **Always handle authentication**: Check user state before making requests
2. **Implement proper error handling**: Handle 401, 429, and 500 errors appropriately
3. **Use loading states**: Provide feedback while fetching data
4. **Cache results**: Consider using React Query or SWR for client-side caching
5. **Debounce search inputs**: Avoid excessive API calls when users type
6. **Respect rate limits**: Implement client-side rate limiting if needed
7. **Progressive enhancement**: Provide fallback content if jobs fail to load

## Testing

### Mock API for Testing

```typescript
// In your test setup
global.fetch = jest.fn((url) => {
  if (url.includes('/api/jobs')) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            id: 'test-1',
            externalId: 'ext-1',
            title: 'Software Engineer',
            company: 'Test Corp',
            location: 'Remote',
            applyUrl: 'https://example.com/apply',
            source: 'test',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          },
        ],
        meta: { count: 1, duration: 100 },
      }),
    })
  }
  return Promise.reject(new Error('Not found'))
}) as jest.Mock
```

## Next Steps

- Integrate job listings into your dashboard
- Add saved jobs functionality
- Implement application tracking
- Add email alerts for new matching jobs
- Create job recommendation engine based on user behavior
