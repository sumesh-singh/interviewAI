import StatsCard from "./stats-card"
import JobRecommendations from "./job-recommendations"
import { Button } from "@/components/ui/button"
import { PlayCircle, BarChart3, Clock, TrendingUp, Calendar, Star } from "lucide-react"
import type { UserStats, RecentSession } from "@/types/dashboard"

interface DashboardOverviewProps {
  stats: UserStats
  recentSessions: RecentSession[]
}

export default function DashboardOverview({ stats, recentSessions }: DashboardOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, John!</h1>
        <p className="text-purple-100 mb-4">Ready to ace your next interview? Let&apos;s continue your preparation.</p>
        <Button className="bg-white text-purple-600 hover:bg-gray-100">
          <PlayCircle className="w-4 h-4 mr-2" />
          Start New Interview
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Sessions Completed"
          value={stats.sessionsCompleted}
          change="+3 this week"
          changeType="positive"
          icon={PlayCircle}
        />
        <StatsCard
          title="Average Score"
          value={`${stats.averageScore}%`}
          change="+5% improvement"
          changeType="positive"
          icon={Star}
        />
        <StatsCard
          title="Practice Time"
          value={`${Math.floor(stats.totalPracticeTime / 60)}h ${stats.totalPracticeTime % 60}m`}
          change="12h this month"
          changeType="neutral"
          icon={Clock}
        />
        <StatsCard
          title="Improvement Rate"
          value={`+${stats.improvementRate}%`}
          change="vs last month"
          changeType="positive"
          icon={TrendingUp}
        />
      </div>

      {/* Quick actions and recent sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick actions */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <PlayCircle className="w-4 h-4 mr-2" />
              Technical Interview Practice
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Detailed Progress
            </Button>
            <Button className="w-full justify-start bg-transparent" variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Mock Interview
            </Button>
          </div>
        </div>

        {/* Recent sessions */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Sessions</h2>
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{session.type}</p>
                  <p className="text-sm text-gray-600">{session.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{session.score}%</p>
                  <p className="text-sm text-gray-600">{session.duration}min</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Job Recommendations */}
      <JobRecommendations />
    </div>
  )
}
