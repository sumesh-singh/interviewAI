"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { openAIService, type InterviewFeedback } from "@/lib/openai"
import { LoadingSpinner } from "@/components/loading-spinner"

interface AIFeedbackProps {
  question: string
  response: string
  role: string
  duration: number
  onFeedbackComplete?: (feedback: InterviewFeedback) => void
}

export function AIFeedbackComponent({ 
  question, 
  response, 
  role, 
  duration, 
  onFeedbackComplete 
}: AIFeedbackProps) {
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const evaluateResponse = async () => {
    if (!response.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await openAIService.evaluateResponse({
        question,
        response,
        role,
        duration
      })

      setFeedback(result)
      onFeedbackComplete?.(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate response')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (response && question) {
      // Auto-evaluate after a short delay
      const timer = setTimeout(evaluateResponse, 1000)
      return () => clearTimeout(timer)
    }
  }, [response, question, role, duration])

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "destructive"
  }

  if (!response) {
    return (
      <Card className="border-gray-200">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Provide your response to receive AI feedback
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <LoadingSpinner />
            <span>Analyzing your response...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <XCircle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="text-red-600">Error: {error}</p>
            <Button onClick={evaluateResponse} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!feedback) {
    return (
      <Card>
        <CardContent className="p-6">
          <Button onClick={evaluateResponse} className="w-full">
            Get AI Feedback
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">AI Feedback</CardTitle>
          <Badge variant={getScoreBadgeVariant(feedback.overallScore)} className="text-sm">
            Overall Score: {feedback.overallScore}/100
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="scores" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scores">Scores</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="tips">Tips</TabsTrigger>
          </TabsList>
          
          <TabsContent value="scores" className="space-y-4">
            {/* Score Breakdown */}
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Technical Accuracy</span>
                <div className="flex items-center space-x-2">
                  <Progress value={feedback.technicalAccuracy} className="w-24" />
                  <span className={`text-sm font-semibold ${getScoreColor(feedback.technicalAccuracy)}`}>
                    {feedback.technicalAccuracy}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Communication</span>
                <div className="flex items-center space-x-2">
                  <Progress value={feedback.communication} className="w-24" />
                  <span className={`text-sm font-semibold ${getScoreColor(feedback.communication)}`}>
                    {feedback.communication}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Confidence</span>
                <div className="flex items-center space-x-2">
                  <Progress value={feedback.confidence} className="w-24" />
                  <span className={`text-sm font-semibold ${getScoreColor(feedback.confidence)}`}>
                    {feedback.confidence}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Relevance</span>
                <div className="flex items-center space-x-2">
                  <Progress value={feedback.relevance} className="w-24" />
                  <span className={`text-sm font-semibold ${getScoreColor(feedback.relevance)}`}>
                    {feedback.relevance}%
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="feedback" className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feedback.detailedFeedback}
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="tips" className="space-y-4">
            {/* Strengths */}
            <div>
              <h4 className="font-semibold text-sm flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Strengths</span>
              </h4>
              <ul className="space-y-1">
                {feedback.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-center space-x-2">
                    <TrendingUp className="h-3 w-3 text-green-500 flex-shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div>
              <h4 className="font-semibold text-sm flex items-center space-x-2 mb-2">
                <XCircle className="h-4 w-4 text-orange-500" />
                <span>Areas for Improvement</span>
              </h4>
              <ul className="space-y-1">
                {feedback.improvements.map((improvement, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-center space-x-2">
                    <TrendingDown className="h-3 w-3 text-orange-500 flex-shrink-0" />
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button onClick={evaluateResponse} variant="outline" size="sm" className="flex-1">
            <RefreshCw className="h-3 w-3 mr-1" />
            Re-evaluate
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
