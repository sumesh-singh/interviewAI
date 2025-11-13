# Job Feed Backend

This document describes the job feed backend implementation that integrates with external job sources and provides curated listings aligned with user profiles.

## Overview

The job feed backend consists of:

1. **Database Layer**: Supabase table (`job_feeds`) for caching job listings with TTL
2. **Service Layer**: `lib/job-service.ts` for fetching, caching, and normalizing job data
3. **API Layer**: `/api/jobs` REST endpoint for serving personalized job listings

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ GET /api/jobs
       │
┌──────▼──────────────────────────┐
│  API Route (/api/jobs/route.ts) │
│  - Authentication               │
│  - Rate limiting                │
│  - Parameter validation         │
└──────┬──────────────────────────┘
       │
┌──────▼──────────────────────────┐
│  Job Service (job-service.ts)   │
│  - Cache-first strategy         │
│  - External API integration     │
│  - Data normalization           │
└──┬────────────────────────────┬─┘
   │                            │
   │ Cache miss                 │ Cache hit
   │                            │
┌──▼──────────┐        ┌────────▼────────┐
│ External    │        │  Supabase       │
│ API         │        │  job_feeds      │
│ (JSearch)   │        │  table          │
└─────────────┘        └─────────────────┘
```

## Database Schema

### Table: `job_feeds`

```sql
CREATE TABLE job_feeds (
  id UUID PRIMARY KEY,
  external_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  description TEXT,
  apply_url TEXT NOT NULL,
  salary_range TEXT,
  employment_type TEXT,
  role_keywords TEXT[],
  industry TEXT,
  seniority_level TEXT,
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  raw_data JSONB
);
```

**Indexes:**
- `idx_job_feeds_expires_at` - For efficient TTL queries
- `idx_job_feeds_role_keywords` - GIN index for keyword searches
- `idx_job_feeds_industry` - For industry filtering
- `idx_job_feeds_location` - For location filtering
- `idx_job_feeds_seniority` - For seniority filtering
- `idx_job_feeds_role_location` - Composite index for common queries

**Row Level Security (RLS):**
- Authenticated users can read non-expired jobs
- Service role can insert/update/delete jobs (for caching)

## API Endpoints

### GET /api/jobs

Fetch personalized job listings based on user profile and query parameters.

**Authentication:** Required (Supabase session)

**Query Parameters:**

| Parameter  | Type   | Description                                      | Default | Required |
|-----------|--------|--------------------------------------------------|---------|----------|
| role      | string | Target role (e.g., "Software Engineer")          | -       | No       |
| keywords  | string | Comma-separated keywords                         | -       | No       |
| industry  | string | Industry filter                                  | -       | No       |
| location  | string | Location filter                                  | -       | No       |
| seniority | string | Seniority level (entry/mid/senior/executive)     | -       | No       |
| limit     | number | Number of results (max: 50)                      | 20      | No       |

**Example Request:**

```bash
curl -X GET "https://your-app.com/api/jobs?role=Software%20Engineer&location=San%20Francisco&limit=10" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "externalId": "external-job-id",
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "location": "San Francisco, CA, USA",
      "description": "We are looking for...",
      "applyUrl": "https://...",
      "salaryRange": "USD 150,000-200,000/YEAR",
      "employmentType": "FULLTIME",
      "roleKeywords": ["software", "engineer", "senior"],
      "industry": "Technology",
      "seniorityLevel": "senior",
      "source": "jsearch",
      "createdAt": "2024-01-15T10:00:00Z",
      "expiresAt": "2024-01-16T10:00:00Z"
    }
  ],
  "meta": {
    "count": 10,
    "duration": 250,
    "params": {
      "role": "Software Engineer",
      "location": "San Francisco",
      "limit": 10
    }
  }
}
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated
- `429 Too Many Requests` - Rate limit exceeded (10 requests per minute)
- `400 Bad Request` - Invalid query parameters
- `500 Internal Server Error` - Server error

### POST /api/jobs

Clean up expired jobs from cache (service endpoint).

**Authentication:** Service role key required

**Headers:**
```
Authorization: Bearer YOUR_SERVICE_ROLE_KEY
```

**Response:**

```json
{
  "success": true,
  "deletedCount": 42
}
```

## Job Service

The `JobService` class in `lib/job-service.ts` provides:

### Methods

#### `searchJobs(params: JobSearchParams): Promise<Job[]>`

Search for jobs with cache-first strategy:
1. Check cache for matching jobs (non-expired)
2. If cache hit (>50% of requested results), return cached data
3. If cache miss, fetch from external API
4. Cache fresh results with TTL
5. Return results

#### `cleanupExpiredJobs(): Promise<number>`

Remove expired jobs from the cache. Returns the number of deleted records.

### Cache Strategy

- **TTL:** 24 hours (configurable via `CACHE_TTL_HOURS`)
- **Cache Hit:** Returns cached results if at least 50% of requested limit is available
- **Cache Miss:** Fetches from external API and caches results
- **Fallback:** If external API fails, returns any available cached results

## External API Integration

The service integrates with **JSearch API** on RapidAPI for LinkedIn job data.

**API Details:**
- Host: `jsearch.p.rapidapi.com`
- Endpoint: `/search`
- Authentication: RapidAPI key

**Configuration:**

Set the following environment variables:

```env
RAPIDAPI_KEY=your_rapidapi_key_here
RAPIDAPI_JOBS_HOST=jsearch.p.rapidapi.com
```

**Rate Limits:**
- External API: Depends on RapidAPI plan
- Internal API: 10 requests per minute per user

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Limit:** 10 requests per minute per user
- **Window:** 60 seconds (sliding window)
- **Response:** HTTP 429 with `retryAfter` in seconds

**Note:** In production, replace the in-memory rate limit map with Redis or a similar distributed cache.

## Performance

**Target Performance:**
- **Response Time:** < 1 second for cached results
- **Cache Hit Rate:** > 80% for common queries
- **External API Timeout:** 10 seconds

**Optimization:**
- Database indexes on frequently queried columns
- Cache-first strategy with intelligent fallback
- Query result limiting (max 50 results)
- Composite indexes for common query patterns

## Data Normalization

Jobs from external sources are normalized to a consistent schema:

**Normalized Fields:**
- `id` - Internal UUID
- `externalId` - External API job ID
- `title` - Job title
- `company` - Company name
- `location` - Formatted location string
- `description` - Job description (may be truncated)
- `applyUrl` - Direct application link
- `salaryRange` - Formatted salary (e.g., "USD 100k-150k/YEAR")
- `employmentType` - FULLTIME, PARTTIME, CONTRACT, etc.
- `roleKeywords` - Extracted keywords for matching
- `industry` - Industry category
- `seniorityLevel` - Entry, mid, senior, executive
- `source` - Data source identifier
- `createdAt` - When the job was posted
- `expiresAt` - Cache expiry timestamp

## User Profile Integration

If no explicit search parameters are provided, the API attempts to use the user's profile data:

**Profile Fields Used:**
- Target role
- Industry preference
- Location preference
- Seniority level
- Experience level

**Note:** The current implementation provides basic profile integration. Enhance by extending the `user_profiles` table with job-specific fields:

```sql
ALTER TABLE user_profiles ADD COLUMN target_role TEXT;
ALTER TABLE user_profiles ADD COLUMN target_industry TEXT;
ALTER TABLE user_profiles ADD COLUMN target_location TEXT;
ALTER TABLE user_profiles ADD COLUMN experience_level TEXT;
```

## Maintenance

### Clean Up Expired Jobs

Run periodically (e.g., daily cron job):

```bash
curl -X POST "https://your-app.com/api/jobs" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

Or use the database function directly:

```sql
SELECT cleanup_expired_jobs();
```

### Monitor Cache Hit Rate

Check cache effectiveness:

```sql
SELECT 
  COUNT(*) FILTER (WHERE expires_at > NOW()) as active_jobs,
  COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_jobs
FROM job_feeds;
```

## Security

1. **Authentication:** All endpoints require valid Supabase session
2. **RLS Policies:** Database-level access control
3. **Rate Limiting:** Prevents API abuse
4. **Input Validation:** Zod schema validation
5. **Service Key:** POST endpoint requires service role key

## Testing

### Manual Testing

```bash
# Test with authentication (replace with your session token)
curl -X GET "http://localhost:3000/api/jobs?role=developer&location=remote&limit=5" \
  -H "Cookie: sb-access-token=YOUR_TOKEN"

# Test rate limiting (make 11+ requests rapidly)
for i in {1..15}; do
  curl -X GET "http://localhost:3000/api/jobs" \
    -H "Cookie: sb-access-token=YOUR_TOKEN"
done

# Test cleanup endpoint
curl -X POST "http://localhost:3000/api/jobs" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### Unit Tests (Recommended)

Create tests for:
- Job service cache logic
- External API integration (with mocks)
- API endpoint authentication
- Rate limiting
- Data normalization

## Troubleshooting

### No jobs returned

1. Check if RAPIDAPI_KEY is set
2. Verify user authentication
3. Check cache for expired jobs
4. Review external API rate limits

### Slow response times

1. Check database indexes
2. Review external API latency
3. Increase cache TTL
4. Reduce limit parameter

### Cache not working

1. Verify Supabase connection
2. Check RLS policies
3. Review expires_at timestamps
4. Check database permissions

## Future Enhancements

1. **Multiple Job Sources:** Integrate additional job APIs (Indeed, Glassdoor, etc.)
2. **Advanced Matching:** ML-based job recommendations
3. **Job Alerts:** Email/push notifications for new matching jobs
4. **Application Tracking:** Track applications through the platform
5. **Saved Jobs:** Allow users to save/bookmark jobs
6. **Company Reviews:** Integrate company review data
7. **Salary Insights:** Historical salary data and trends
8. **Skill Matching:** Match job requirements with user skills
9. **Redis Cache:** Distributed caching for better scalability
10. **Analytics:** Track job search patterns and popular roles

## Dependencies

- `@supabase/ssr` - Supabase SSR client
- `zod` - Schema validation
- `next` - Next.js framework

## Environment Variables

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# RapidAPI (required for external job fetching)
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_JOBS_HOST=jsearch.p.rapidapi.com
```

## Getting Started

1. **Run Migration:**
   ```bash
   # Apply the job_feeds migration to your Supabase database
   npx supabase db push
   ```

2. **Set Environment Variables:**
   Add the required variables to `.env.local`

3. **Test the API:**
   ```bash
   npm run dev
   # Navigate to http://localhost:3000/api/jobs (with auth)
   ```

4. **Monitor Logs:**
   Check console for cache hits, API calls, and performance metrics

## Support

For issues or questions:
1. Check Supabase dashboard for database errors
2. Review RapidAPI dashboard for quota/limits
3. Check application logs for detailed error messages
4. Verify environment variables are correctly set
