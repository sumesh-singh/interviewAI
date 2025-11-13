# Supabase Migrations

This directory contains SQL migration files for the database schema.

## Migrations

1. **001_email_verification_tokens.sql** - Email verification system
2. **002_user_profiles.sql** - User profile data and automatic profile creation
3. **003_user_scoring_weights.sql** - User scoring preferences and weights
4. **004_job_feeds.sql** - Job feed caching with TTL and search functionality

## Applying Migrations

### Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link to your project
supabase link --project-ref your-project-ref

# Push migrations to remote
supabase db push
```

### Manual Application

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste each migration file in order
4. Execute the SQL

## Migration Details

### 004_job_feeds.sql

Creates the `job_feeds` table for caching external job listings with:

- **Fields**: title, company, location, description, apply URL, salary, employment type, keywords
- **Indexes**: Optimized for searching by role, industry, location, and seniority
- **RLS Policies**: Secure access control for authenticated users
- **Functions**: 
  - `cleanup_expired_jobs()` - Remove expired cache entries
  - `search_jobs()` - Advanced job search with filtering

**TTL**: Jobs expire after 24 hours

## Testing Migrations Locally

If using Supabase local development:

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db reset

# Check migration status
supabase migration list
```

## Rollback

To rollback a migration:

1. Create a new migration that reverses the changes
2. Or manually drop the affected tables/functions in SQL Editor

Example rollback for job_feeds:

```sql
DROP TABLE IF EXISTS job_feeds CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_jobs();
DROP FUNCTION IF EXISTS search_jobs(TEXT[], TEXT, TEXT, TEXT, INTEGER);
```

## Best Practices

1. Never edit existing migration files
2. Create new migrations for schema changes
3. Test migrations locally before applying to production
4. Always use transactions for complex migrations
5. Document all schema changes

## Environment Setup

Ensure these environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```
