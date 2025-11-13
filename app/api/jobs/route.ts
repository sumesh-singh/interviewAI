import { NextResponse } from "next/server"
import type { JobRecommendation, JobsResponse } from "@/types/dashboard"

const mockJobs: JobRecommendation[] = [
  {
    id: "1",
    company: "Google",
    role: "Senior Software Engineer",
    location: "San Francisco, CA",
    remote: "hybrid",
    seniority: "senior",
    tags: ["React", "TypeScript", "System Design"],
    description: "We're looking for an experienced engineer to join our infrastructure team.",
    applyUrl: "https://careers.google.com/jobs/results/?q=senior-software-engineer",
    postedDate: "2 days ago",
    matchScore: 95,
  },
  {
    id: "2",
    company: "Microsoft",
    role: "Full Stack Developer",
    location: "Seattle, WA",
    remote: "remote",
    seniority: "mid",
    tags: ["Next.js", "Node.js", "AWS"],
    description: "Join our cloud platform team building scalable solutions.",
    applyUrl: "https://careers.microsoft.com/jobs/results/?q=full-stack-developer",
    postedDate: "1 day ago",
    matchScore: 88,
  },
  {
    id: "3",
    company: "Meta",
    role: "Junior Software Engineer",
    location: "Menlo Park, CA",
    remote: "on-site",
    seniority: "entry",
    tags: ["React", "GraphQL", "Python"],
    description: "Start your career with us and work on products used by billions.",
    applyUrl: "https://careers.meta.com/jobs/results/?q=junior-software-engineer",
    postedDate: "3 days ago",
    matchScore: 82,
  },
  {
    id: "4",
    company: "Amazon",
    role: "Backend Engineer",
    location: "Remote",
    remote: "remote",
    seniority: "mid",
    tags: ["Java", "Microservices", "AWS"],
    description: "Build high-performance systems that power Amazon's infrastructure.",
    applyUrl: "https://careers.amazon.com/jobs/results/?q=backend-engineer",
    postedDate: "5 days ago",
    matchScore: 79,
  },
  {
    id: "5",
    company: "Apple",
    role: "iOS Engineer",
    location: "Cupertino, CA",
    remote: "on-site",
    seniority: "senior",
    tags: ["Swift", "iOS", "Objective-C"],
    description: "Craft beautiful experiences for billions of Apple users.",
    applyUrl: "https://careers.apple.com/jobs/results/?q=ios-engineer",
    postedDate: "1 week ago",
    matchScore: 75,
  },
  {
    id: "6",
    company: "Netflix",
    role: "DevOps Engineer",
    location: "Los Gatos, CA",
    remote: "hybrid",
    seniority: "mid",
    tags: ["Kubernetes", "Python", "AWS"],
    description: "Help us deliver entertainment at scale with cutting-edge infrastructure.",
    applyUrl: "https://careers.netflix.com/jobs/results/?q=devops-engineer",
    postedDate: "4 days ago",
    matchScore: 81,
  },
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get("location")
    const remote = searchParams.get("remote")
    const seniority = searchParams.get("seniority")

    let filteredJobs = [...mockJobs]

    if (location) {
      filteredJobs = filteredJobs.filter((job) =>
        job.location.toLowerCase().includes(location.toLowerCase()),
      )
    }

    if (remote && remote !== "all") {
      filteredJobs = filteredJobs.filter((job) => job.remote === remote)
    }

    if (seniority && seniority !== "all") {
      filteredJobs = filteredJobs.filter((job) => job.seniority === seniority)
    }

    // Sort by match score descending
    filteredJobs.sort((a, b) => b.matchScore - a.matchScore)

    const response: JobsResponse = {
      jobs: filteredJobs,
      total: filteredJobs.length,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error("Error fetching jobs:", error)
    return NextResponse.json(
      { error: "Failed to fetch job recommendations" },
      { status: 500 },
    )
  }
}
