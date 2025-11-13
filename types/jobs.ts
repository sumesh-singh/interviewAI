export interface Job {
  id: string
  externalId: string
  title: string
  company: string
  location?: string
  description?: string
  applyUrl: string
  salaryRange?: string
  employmentType?: string
  roleKeywords?: string[]
  industry?: string
  seniorityLevel?: string
  source: string
  createdAt: string
  expiresAt: string
}

export interface JobSearchParams {
  role?: string
  keywords?: string[]
  industry?: string
  location?: string
  seniority?: string
  limit?: number
}

export interface ExternalJobResponse {
  job_id: string
  job_title: string
  employer_name: string
  employer_logo?: string
  job_city?: string
  job_state?: string
  job_country?: string
  job_description?: string
  job_apply_link: string
  job_min_salary?: number
  job_max_salary?: number
  job_salary_currency?: string
  job_salary_period?: string
  job_employment_type?: string
  job_is_remote?: boolean
  job_posted_at_timestamp?: number
}

export interface JobFeedCache {
  id: string
  external_id: string
  title: string
  company: string
  location?: string
  description?: string
  apply_url: string
  salary_range?: string
  employment_type?: string
  role_keywords?: string[]
  industry?: string
  seniority_level?: string
  source: string
  created_at: string
  expires_at: string
  raw_data?: any
}
