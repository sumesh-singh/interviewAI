"use client"

import { useOffline } from "@/hooks/use-offline"
import { Card, CardContent } from "@/components/ui/card"
import { WifiOff, Wifi } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function OfflineIndicator() {
  const isOffline = useOffline()

  if (!isOffline) {
    return null
  }

  return (
    <Card className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
      <CardContent className="p-3">
        <div className="flex items-center space-x-2">
          <WifiOff className="h-4 w-4 text-orange-600" />
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-orange-800">You're offline</span>
            <Badge variant="secondary" className="text-xs">
              Limited functionality
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Online/Offline status indicator for header or navbar
export function NetworkStatus() {
  const isOffline = useOffline()

  return (
    <div className="flex items-center space-x-2">
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4 text-red-500" />
          <span className="text-xs text-red-600">Offline</span>
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-xs text-green-600">Online</span>
        </>
      )}
    </div>
  )
}
