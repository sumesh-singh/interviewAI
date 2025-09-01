"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Clock, AlertCircle } from "lucide-react"

interface SessionTimerProps {
  totalDuration: number // in seconds
  isPaused: boolean
  onTimeUp: () => void
}

export function SessionTimer({ totalDuration, isPaused, onTimeUp }: SessionTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(totalDuration)
  const [isWarning, setIsWarning] = useState(false)

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1

        if (newTime <= 0) {
          onTimeUp()
          return 0
        }

        // Show warning when 5 minutes or 25% of time remaining
        const warningThreshold = Math.min(300, totalDuration * 0.25)
        setIsWarning(newTime <= warningThreshold)

        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isPaused, totalDuration, onTimeUp])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const progressPercentage = ((totalDuration - timeRemaining) / totalDuration) * 100

  return (
    <Card className={isWarning ? "border-orange-200 bg-orange-50" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {isWarning ? (
              <AlertCircle className="h-4 w-4 text-orange-500" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">{isPaused ? "Paused" : "Time Remaining"}</span>
          </div>
          <span className={`text-lg font-mono font-bold ${isWarning ? "text-orange-600" : ""}`}>
            {formatTime(timeRemaining)}
          </span>
        </div>

        <Progress value={progressPercentage} className={`h-2 ${isWarning ? "[&>div]:bg-orange-500" : ""}`} />

        {isWarning && <p className="text-xs text-orange-600 mt-2 text-center">Time is running low!</p>}
      </CardContent>
    </Card>
  )
}
