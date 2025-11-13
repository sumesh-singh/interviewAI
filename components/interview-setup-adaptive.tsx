"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, Users, Target, Play, Lightbulb, TrendingUp, CheckCircle } from "lucide-react"
import { sessionManager } from "@/lib/session-manager"
import type { AdaptiveRecommendation } from "@/lib/adaptive-difficulty-engine"

interface InterviewSetupProps {
  onStartInterview: (config: {
    type: "behavioral" | "technical" | "mixed"
    duration: number
    difficulty: "easy" | "medium" | "hard"
    useRecommendation?: boolean
  }) => void
  userId: string
}

export function InterviewSetup({ onStartInterview, userId }: InterviewSetupProps) {
  const [type, setType] = useState<"behavioral" | "technical" | "mixed">("mixed")
  const [duration, setDuration] = useState<number>(30)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [recommendation, setRecommendation] = useState<AdaptiveRecommendation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userOverrode, setUserOverrode] = useState(false)

  // Load adaptive recommendation on mount
  useEffect(() => {
    const loadRecommendation = async () => {
      try {
        const rec = sessionManager.getAdaptiveConfig(userId)
        setRecommendation(rec)
        
        // Pre-fill with recommendation if available
        if (rec) {
          setType(rec.recommendedType)
          setDifficulty(rec.recommendedDifficulty)
        }
      } catch (error) {
        console.error('Failed to load recommendation:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadRecommendation()
  }, [userId])

  const handleStart = () => {
    const useRecommendation = !userOverrode && !!recommendation
    onStartInterview({ type, duration, difficulty, useRecommendation })
  }

  const handleTypeChange = (newType: "behavioral" | "technical" | "mixed") => {
    setType(newType)
    if (recommendation && newType !== recommendation.recommendedType) {
      setUserOverrode(true)
    }
  }

  const handleDifficultyChange = (newDifficulty: "easy" | "medium" | "hard") => {
    setDifficulty(newDifficulty)
    if (recommendation && newDifficulty !== recommendation.recommendedDifficulty) {
      setUserOverrode(true)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600"
    if (confidence >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getDifficultyColor = (difficulty: "challenging" | "appropriate" | "comfortable") => {
    switch (difficulty) {
      case "challenging": return "text-orange-600"
      case "appropriate": return "text-green-600"
      case "comfortable": return "text-blue-600"
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Interview Setup</h1>
          <p className="text-muted-foreground">Loading personalized recommendations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Interview Setup</h1>
        <p className="text-muted-foreground">Configure your practice interview session</p>
      </div>

      {/* Recommendation Card */}
      {recommendation && (
        <Alert className="border-blue-200 bg-blue-50">
          <Lightbulb className="h-4 w-4 text-blue-600" />
          <AlertDescription className="space-y-2">
            <div className="font-medium text-blue-900">
              Personalized Recommendation
            </div>
            <div className="text-sm text-blue-800">
              <p className="font-medium">{recommendation.rationale.primary}</p>
              <ul className="mt-1 space-y-1">
                {recommendation.rationale.supporting.map((point, index) => (
                  <li key={index} className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {point}
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center gap-4 text-xs">
                <span className={getConfidenceColor(recommendation.confidence)}>
                  Confidence: {recommendation.confidence}%
                </span>
                <span className={getDifficultyColor(recommendation.estimatedDifficulty)}>
                  Difficulty: {recommendation.estimatedDifficulty}
                </span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Interview Type
            {recommendation && !userOverrode && (
              <Badge variant="secondary" className="text-xs">
                Recommended
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Choose the focus area for your practice session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={type} onValueChange={handleTypeChange}>
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

          {recommendation?.focusAreas && recommendation.focusAreas.length > 0 && (
            <div className="mt-2 p-2 bg-muted rounded text-sm">
              <div className="font-medium text-xs text-muted-foreground mb-1">Focus Areas:</div>
              <div className="flex flex-wrap gap-1">
                {recommendation.focusAreas.map((area, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}
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
            {recommendation && !userOverrode && (
              <Badge variant="secondary" className="text-xs">
                Recommended
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Choose the complexity of questions</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={difficulty} onValueChange={handleDifficultyChange}>
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

      {/* Alternative Options */}
      {recommendation && recommendation.alternativeOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Alternative Options
            </CardTitle>
            <CardDescription>Other configurations based on your performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendation.alternativeOptions.map((alternative, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setType(alternative.type)
                  setDifficulty(alternative.difficulty)
                  setUserOverrode(true)
                }}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {alternative.type}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {alternative.difficulty}
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">{alternative.reason}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button onClick={handleStart} className="w-full" size="lg">
        <Play className="h-5 w-5 mr-2" />
        Start Interview Session
        {recommendation && !userOverrode && (
          <Badge variant="secondary" className="ml-2">
            Using Recommendation
          </Badge>
        )}
      </Button>

      {userOverrode && (
        <p className="text-center text-sm text-muted-foreground">
          You've customized the settings. Your preference will be used to improve future recommendations.
        </p>
      )}
    </div>
  )
}