"use client"

import { useState, useCallback } from "react"
import { useJobs } from "@/hooks/use-jobs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MapPin, Briefcase, Tag, ExternalLink, AlertCircle } from "lucide-react"
import type { JobFilters } from "@/types/dashboard"

export default function JobRecommendations() {
  const [filters, setFilters] = useState<JobFilters>({
    remote: "all",
    seniority: "all",
    location: "",
  })

  const { jobs, loading, error, refetch } = useJobs(filters)

  const handleFilterChange = useCallback(
    (key: keyof JobFilters, value: string) => {
      const newFilters = { ...filters, [key]: value }
      setFilters(newFilters)
    },
    [filters],
  )

  const handleApplyClick = (jobId: string, applyUrl: string, company: string, role: string) => {
    // Track analytics event
    trackJobApplication(jobId, company, role)
    // Open link in new tab
    window.open(applyUrl, "_blank")
  }

  const trackJobApplication = (jobId: string, company: string, role: string) => {
    const event = {
      type: "job_applied",
      jobId,
      company,
      role,
      timestamp: new Date().toISOString(),
    }
    console.log("Analytics Event:", event)
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Recommended Jobs</h2>
        <span className="text-sm text-gray-600">{jobs.length} jobs available</span>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <input
            type="text"
            placeholder="Search location..."
            value={filters.location || ""}
            onChange={(e) => handleFilterChange("location", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Work Type</label>
          <Select
            value={filters.remote || "all"}
            onValueChange={(value) => handleFilterChange("remote", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="on-site">On-site</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Seniority</label>
          <Select
            value={filters.seniority || "all"}
            onValueChange={(value) => handleFilterChange("seniority", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="entry">Entry Level</SelectItem>
              <SelectItem value="mid">Mid Level</SelectItem>
              <SelectItem value="senior">Senior Level</SelectItem>
              <SelectItem value="lead">Lead Level</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Unable to load jobs</p>
            <p className="text-sm text-red-800 mt-1">{error}</p>
            <Button
              onClick={() => refetch(filters)}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 border rounded-lg">
              <Skeleton className="h-6 w-3/4 mb-3" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-6" />
              <div className="flex gap-2 mb-4">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && jobs.length === 0 && !error && (
        <div className="text-center py-12">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No jobs found matching your filters</p>
          <p className="text-sm text-gray-500 mb-6">
            Try adjusting your filters or refine your profile information for better recommendations
          </p>
          <Button
            onClick={() => setFilters({ remote: "all", seniority: "all", location: "" })}
            variant="outline"
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Job Cards */}
      {!loading && jobs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="p-4 border rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{job.role}</h3>
                  <p className="text-sm text-gray-600">{job.company}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-blue-600">{job.matchScore}% match</div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {job.location}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Briefcase className="w-4 h-4 mr-2" />
                  <span className="capitalize">{job.remote}</span>
                  <span className="mx-2">•</span>
                  <span className="capitalize">{job.seniority}</span>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4 line-clamp-2">{job.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {job.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>

              <div className="text-xs text-gray-500 mb-4">{job.postedDate}</div>

              <Button
                onClick={() => handleApplyClick(job.id, job.applyUrl, job.company, job.role)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Apply Now
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* See All Jobs CTA */}
      {!loading && jobs.length > 0 && jobs.length < 10 && (
        <div className="mt-6 text-center pt-6 border-t">
          <Button variant="outline" className="mx-auto">
            See All Jobs
          </Button>
        </div>
      )}
    </div>
  )
}
