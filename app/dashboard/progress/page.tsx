import ProtectedRoute from "@/components/protected-route"
import DashboardLayout from "@/components/dashboard-layout"
import StatsCard from "@/components/stats-card"
import { BarChart3, TrendingUp, Clock, Target } from "lucide-react"

export default function ProgressPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Progress</h1>
            <p className="text-gray-600">Track your interview preparation journey</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Sessions"
              value={24}
              change="+8 this month"
              changeType="positive"
              icon={BarChart3}
            />
            <StatsCard
              title="Average Score"
              value="78%"
              change="+12% vs last month"
              changeType="positive"
              icon={Target}
            />
            <StatsCard title="Study Time" value="32h" change="18h this month" changeType="neutral" icon={Clock} />
            <StatsCard
              title="Improvement"
              value="+15%"
              change="Communication skills"
              changeType="positive"
              icon={TrendingUp}
            />
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Over Time</h2>
            <div className="h-64 flex items-center justify-center text-gray-500">Chart visualization would go here</div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
