-- Create job_feeds table for caching external job listings
CREATE TABLE IF NOT EXISTS job_feeds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  description TEXT,
  apply_url TEXT NOT NULL,
  salary_range TEXT,
  employment_type TEXT,
  role_keywords TEXT[] DEFAULT '{}',
  industry TEXT,
  seniority_level TEXT,
  source TEXT NOT NULL DEFAULT 'external',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  raw_data JSONB
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_job_feeds_expires_at ON job_feeds(expires_at);
CREATE INDEX IF NOT EXISTS idx_job_feeds_role_keywords ON job_feeds USING GIN(role_keywords);
CREATE INDEX IF NOT EXISTS idx_job_feeds_industry ON job_feeds(industry);
CREATE INDEX IF NOT EXISTS idx_job_feeds_location ON job_feeds(location);
CREATE INDEX IF NOT EXISTS idx_job_feeds_seniority ON job_feeds(seniority_level);
CREATE INDEX IF NOT EXISTS idx_job_feeds_created_at ON job_feeds(created_at DESC);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_job_feeds_role_location ON job_feeds(industry, location, expires_at);

-- Enable Row Level Security
ALTER TABLE job_feeds ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read non-expired jobs
CREATE POLICY "Authenticated users can view non-expired jobs" ON job_feeds
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    expires_at > NOW()
  );

-- Create policy to allow service role to insert jobs (for caching)
CREATE POLICY "Service role can insert jobs" ON job_feeds
  FOR INSERT WITH CHECK (true);

-- Create policy to allow service role to update jobs
CREATE POLICY "Service role can update jobs" ON job_feeds
  FOR UPDATE USING (true);

-- Create policy to allow service role to delete expired jobs
CREATE POLICY "Service role can delete expired jobs" ON job_feeds
  FOR DELETE USING (expires_at <= NOW());

-- Create function to clean up expired jobs
CREATE OR REPLACE FUNCTION cleanup_expired_jobs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM job_feeds WHERE expires_at <= NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Create function to search jobs by keywords and filters
CREATE OR REPLACE FUNCTION search_jobs(
  p_keywords TEXT[] DEFAULT NULL,
  p_industry TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_seniority TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS SETOF job_feeds AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM job_feeds
  WHERE expires_at > NOW()
    AND (p_keywords IS NULL OR role_keywords && p_keywords)
    AND (p_industry IS NULL OR industry = p_industry)
    AND (p_location IS NULL OR location ILIKE '%' || p_location || '%')
    AND (p_seniority IS NULL OR seniority_level = p_seniority)
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$ language 'plpgsql';
