"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Target, Play } from "lucide-react"

interface InterviewSetupProps {
  onStartInterview: (config: {
    type: "behavioral" | "technical" | "mixed"
    duration: number
    difficulty: "easy" | "medium" | "hard"
  }) => void
}

export function InterviewSetup({ onStartInterview }: InterviewSetupProps) {
  const [type, setType] = useState<"behavioral" | "technical" | "mixed">("mixed")
  const [duration, setDuration] = useState<number>(30)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")

  const handleStart = () => {
    onStartInterview({ type, duration, difficulty })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Interview Setup</h1>
        <p className="text-muted-foreground">Configure your practice interview session</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Interview Type
          </CardTitle>
          <CardDescription>Choose the focus area for your practice session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={type} onValueChange={(value: any) => setType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="behavioral">Behavioral Questions</SelectItem>
              <SelectItem value="technical">Technical Questions</SelectItem>
              <SelectItem value="mixed">Mixed (Behavioral + Technical)</SelectItem>
            </SelectContent>
          </Select>

          <div className="grid grid-cols-3 gap-2">
            <Badge variant={type === "behavioral" ? "default" : "outline"}>Behavioral</Badge>
            <Badge variant={type === "technical" ? "default" : "outline"}>Technical</Badge>
            <Badge variant={type === "mixed" ? "default" : "outline"}>Mixed</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Duration
          </CardTitle>
          <CardDescription>How long would you like to practice?</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={duration.toString()} onValueChange={(value) => setDuration(Number.parseInt(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">60 minutes</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Difficulty Level
          </CardTitle>
          <CardDescription>Choose the complexity of questions</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy - Entry Level</SelectItem>
              <SelectItem value="medium">Medium - Mid Level</SelectItem>
              <SelectItem value="hard">Hard - Senior Level</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Button onClick={handleStart} className="w-full" size="lg">
        <Play className="h-5 w-5 mr-2" />
        Start Interview Session
      </Button>
    </div>
  )
}
