import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardLayout from "@/components/dashboard-layout"
import DashboardOverview from "@/components/dashboard-overview"
import type { UserStats, RecentSession } from "@/types/dashboard"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect("/auth/login")
  }

  const userStats: UserStats = {
    sessionsCompleted: 12,
    averageScore: 78,
    totalPracticeTime: 145, // minutes
    improvementRate: 15,
  }

  const recentSessions: RecentSession[] = [
    {
      id: "1",
      type: "Technical Interview",
      score: 85,
      duration: 45,
      date: "2 days ago",
      status: "completed",
    },
    {
      id: "2",
      type: "Behavioral Interview",
      score: 72,
      duration: 30,
      date: "5 days ago",
      status: "completed",
    },
    {
      id: "3",
      type: "System Design",
      score: 68,
      duration: 60,
      date: "1 week ago",
      status: "completed",
    },
  ]

  return (
    <DashboardLayout>
      <DashboardOverview stats={userStats} recentSessions={recentSessions} />
    </DashboardLayout>
  )
}
