"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Play, Pause, Square, SkipForward, AlertTriangle } from "lucide-react"

interface SessionControlsProps {
  isPaused: boolean
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onNext: () => void
  onEmergencyExit: () => void
  canGoNext: boolean
}

export function SessionControls({
  isPaused,
  onPause,
  onResume,
  onStop,
  onNext,
  onEmergencyExit,
  canGoNext,
}: SessionControlsProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button onClick={isPaused ? onResume : onPause} variant="outline" size="sm">
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>

            <Button onClick={onStop} variant="outline" size="sm">
              <Square className="h-4 w-4" />
            </Button>

            <Button onClick={onNext} disabled={!canGoNext} variant="outline" size="sm">
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={onEmergencyExit} variant="destructive" size="sm">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Emergency Exit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
