"use client"

import { useState, useEffect, useCallback } from "react"
import type { JobRecommendation, JobFilters } from "@/types/dashboard"

interface UseJobsResult {
  jobs: JobRecommendation[]
  loading: boolean
  error: string | null
  refetch: (filters?: JobFilters) => Promise<void>
}

export function useJobs(initialFilters?: JobFilters): UseJobsResult {
  const [jobs, setJobs] = useState<JobRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async (filters?: JobFilters) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      if (filters?.location) {
        params.append("location", filters.location)
      }
      if (filters?.remote && filters.remote !== "all") {
        params.append("remote", filters.remote)
      }
      if (filters?.seniority && filters.seniority !== "all") {
        params.append("seniority", filters.seniority)
      }

      const response = await fetch(`/api/jobs?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch jobs")
      }

      const data = await response.json()
      setJobs(data.jobs)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while fetching jobs")
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs(initialFilters)
  }, [initialFilters, fetchJobs])

  return {
    jobs,
    loading,
    error,
    refetch: fetchJobs,
  }
}
