"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle2, XCircle, RefreshCw, Link as LinkIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import LoadingSpinner from "@/components/loading-spinner"

interface CalendarSyncBannerProps {
  onConnect?: () => void
  onDisconnect?: () => void
}

export default function CalendarSyncBanner({ onConnect, onDisconnect }: CalendarSyncBannerProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [lastSynced, setLastSynced] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: settings } = await supabase
          .from("user_settings")
          .select("google_calendar_connected, google_calendar_email, google_calendar_last_sync")
          .eq("user_id", user.id)
          .single()

        if (settings?.google_calendar_connected) {
          setIsConnected(true)
          setEmail(settings.google_calendar_email)
          setLastSynced(settings.google_calendar_last_sync)
        }
      }
    } catch (error) {
      console.error("Error checking calendar connection:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard/schedule?calendar=connected`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          scopes: "openid email profile https://www.googleapis.com/auth/calendar.events",
        },
      })

      if (error) {
        throw error
      }

      onConnect?.()
    } catch (error) {
      console.error("Error connecting calendar:", error)
    }
  }

  const handleDisconnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from("user_settings")
          .upsert({
            user_id: user.id,
            google_calendar_connected: false,
            google_calendar_email: null,
            google_calendar_last_sync: null,
            updated_at: new Date().toISOString(),
          })

        setIsConnected(false)
        setEmail(null)
        setLastSynced(null)
        onDisconnect?.()
      }
    } catch (error) {
      console.error("Error disconnecting calendar:", error)
    }
  }

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <LoadingSpinner size="sm" />
            <span className="text-sm text-gray-600">Checking calendar connection...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isConnected) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">Google Calendar Connected</h3>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" aria-hidden="true" />
                    Active
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Your practice sessions will automatically sync to{" "}
                  <span className="font-medium">{email}</span>
                </p>
                {lastSynced && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" aria-hidden="true" />
                    Last synced: {new Date(lastSynced).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="text-red-600 border-red-200 hover:bg-red-50"
              aria-label="Disconnect Google Calendar"
            >
              <XCircle className="w-4 h-4 mr-2" aria-hidden="true" />
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Sync with Google Calendar</h3>
              <p className="text-sm text-gray-600">
                Connect your Google Calendar to automatically add your practice sessions and receive reminders.
              </p>
            </div>
          </div>
          <Button
            onClick={handleConnect}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            aria-label="Connect Google Calendar"
          >
            <LinkIcon className="w-4 h-4 mr-2" aria-hidden="true" />
            Connect
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
