"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, ArrowRight, CheckCircle2 } from "lucide-react"
import { useSchedule } from "@/hooks/use-schedule"
import LoadingSpinner from "@/components/loading-spinner"
import { format, parseISO, isFuture, isToday } from "date-fns"
import Link from "next/link"

export default function UpcomingSessions() {
  const { sessions, isLoading, fetchSessions } = useSchedule()
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([])

  useEffect(() => {
    fetchSessions({ status: "scheduled" })
  }, [fetchSessions])

  useEffect(() => {
    const now = new Date()
    const upcoming = sessions
      .filter((session) => isFuture(parseISO(session.scheduled_date)) || isToday(parseISO(session.scheduled_date)))
      .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
      .slice(0, 3)

    setUpcomingSessions(upcoming)
  }, [sessions])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "hard":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRelativeTime = (dateString: string) => {
    const date = parseISO(dateString)
    if (isToday(date)) {
      return `Today at ${format(date, "h:mm a")}`
    }
    return format(date, "MMM d 'at' h:mm a")
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" label="Loading sessions..." />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Sessions
            </CardTitle>
            <CardDescription>Your scheduled practice sessions</CardDescription>
          </div>
          <Link href="/dashboard/schedule">
            <Button variant="ghost" size="sm" aria-label="View all scheduled sessions">
              View All
              <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {upcomingSessions.length > 0 ? (
          <div className="space-y-3" role="list" aria-label="Upcoming practice sessions">
            {upcomingSessions.map((session) => (
              <div
                key={session.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                role="listitem"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{session.template_name}</h4>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{getRelativeTime(session.scheduled_date)}</span>
                      <span>•</span>
                      <span>{session.duration} min</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className={getDifficultyColor(session.difficulty)}>
                        {session.difficulty}
                      </Badge>
                      {session.google_calendar_event_id && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" aria-hidden="true" />
                          Synced
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
            <p className="text-sm mb-3">No upcoming sessions scheduled</p>
            <Link href="/dashboard/schedule">
              <Button size="sm" variant="outline">
                Schedule Session
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
