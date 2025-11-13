"use client"

import { Suspense } from "react"
import ProtectedRoute from "@/components/protected-route"
import DashboardLayout from "@/components/dashboard-layout"
import SchedulePlanner from "@/components/schedule-planner"
import CalendarSyncBanner from "@/components/calendar-sync-banner"
import LoadingSpinner from "@/components/loading-spinner"

export default function SchedulePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
            <p className="text-muted-foreground">
              Plan and manage your practice sessions
            </p>
          </div>

          <Suspense
            fallback={
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" label="Loading calendar sync..." />
              </div>
            }
          >
            <CalendarSyncBanner />
          </Suspense>

          <Suspense
            fallback={
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" label="Loading schedule..." />
              </div>
            }
          >
            <SchedulePlanner />
          </Suspense>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
