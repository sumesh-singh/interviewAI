"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdaptiveInterview } from "@/hooks/use-adaptive-interview"
import { InterviewSetup } from "@/components/interview-setup-adaptive"
import { 
  Brain, 
  TrendingUp, 
  Target, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Settings,
  Play
} from "lucide-react"

export default function AdaptiveDemoPage() {
  const [showSetup, setShowSetup] = useState(false)
  // Demo user ID - in a real app, this would come from authentication
  const userId = "demo-user-adaptive"
  
  const {
    recommendation,
    performance,
    isLoading,
    error,
    createAdaptiveSession,
    completeSession,
    getAccuracy,
    refresh
  } = useAdaptiveInterview(userId)

  const handleStartInterview = async (config: {
    type: "behavioral" | "technical" | "mixed"
    duration: number
    difficulty: "easy" | "medium" | "hard"
    useRecommendation?: boolean
  }) => {
    try {
      const result = await createAdaptiveSession({
        duration: config.duration,
        role: "Software Engineer",
        useRecommendation: config.useRecommendation
      })
      
      console.log("Created adaptive session:", result)
      alert(`Started ${config.type} interview with ${result.recommendation ? 'recommendation' : 'manual config'}`)
      
      // Simulate session completion for demo
      setTimeout(() => {
        // Mock session completion with random scores
        const mockSessionId = result.session.id
        // This would normally be called when the user actually completes the interview
        // completeSession(mockSessionId, "Software Engineer")
      }, 1000)
      
    } catch (err) {
      console.error("Failed to start interview:", err)
      alert("Failed to start interview")
    }
  }

  const accuracy = getAccuracy()

  if (showSetup) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="outline" 
            onClick={() => setShowSetup(false)}
            className="mb-4"
          >
            ← Back to Demo
          </Button>
          <InterviewSetup 
            onStartInterview={handleStartInterview}
            userId={userId}
          />
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading adaptive recommendations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
            <Button onClick={refresh} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Adaptive Difficulty Demo</h1>
          <p className="text-gray-600">
            See how the system personalizes interview difficulty based on performance
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-4">
          <Button onClick={() => setShowSetup(true)} size="lg">
            <Play className="h-5 w-5 mr-2" />
            Start Adaptive Interview
          </Button>
          <Button variant="outline" onClick={refresh}>
            <Settings className="h-5 w-5 mr-2" />
            Refresh Data
          </Button>
        </div>

        <Tabs defaultValue="recommendation" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recommendation">Current Recommendation</TabsTrigger>
            <TabsTrigger value="performance">Performance Profile</TabsTrigger>
            <TabsTrigger value="accuracy">System Accuracy</TabsTrigger>
          </TabsList>

          {/* Recommendation Tab */}
          <TabsContent value="recommendation">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recommendation ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-blue-600" />
                        AI Recommendation
                      </CardTitle>
                      <CardDescription>
                        Personalized configuration based on your performance
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Type:</span>
                        <Badge variant="secondary" className="capitalize">
                          {recommendation.recommendedType}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Difficulty:</span>
                        <Badge variant="secondary" className="capitalize">
                          {recommendation.recommendedDifficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Confidence:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={recommendation.confidence} className="w-20" />
                          <span className="text-sm">{recommendation.confidence}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Estimated Feel:</span>
                        <Badge 
                          variant={
                            recommendation.estimatedDifficulty === 'challenging' ? 'destructive' :
                            recommendation.estimatedDifficulty === 'appropriate' ? 'default' :
                            'secondary'
                          }
                          className="capitalize"
                        >
                          {recommendation.estimatedDifficulty}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-green-600" />
                        Rationale
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="font-medium text-sm text-gray-900 mb-2">
                          {recommendation.rationale.primary}
                        </p>
                        <ul className="space-y-1">
                          {recommendation.rationale.supporting.map((point, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-600">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {recommendation.focusAreas.length > 0 && (
                        <div>
                          <p className="font-medium text-sm text-gray-900 mb-2">Focus Areas:</p>
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

                  {recommendation.alternativeOptions.length > 0 && (
                    <Card className="lg:col-span-2">
                      <CardHeader>
                        <CardTitle>Alternative Options</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {recommendation.alternativeOptions.map((alt, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="capitalize">
                                  {alt.type}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {alt.difficulty}
                                </Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">{alt.reason}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      No Recommendation Available
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Start a few practice sessions to get personalized recommendations.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            {performance ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      Performance Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total Sessions:</span>
                      <span className="text-2xl font-bold">{performance.totalSessions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Average Score:</span>
                      <span className="text-2xl font-bold">{performance.averageOverallScore.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Preferred Difficulty:</span>
                      <Badge variant="secondary" className="capitalize">
                        {performance.preferredDifficulty}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance by Type</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(performance.performanceByType).map(([type, data]) => (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{type}</span>
                          <span className="text-sm text-gray-600">
                            {data.sessionCount} sessions • {data.averageScore.toFixed(1)}% avg
                          </span>
                        </div>
                        <Progress value={data.averageScore} className="w-full" />
                        <div className="text-xs text-gray-500">
                          Best: {data.bestScore}%
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">Strengths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {performance.strengths.length > 0 ? (
                      <ul className="space-y-2">
                        {performance.strengths.map((strength, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600">Complete more sessions to identify strengths</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-orange-600">Areas to Improve</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {performance.weaknesses.length > 0 ? (
                      <ul className="space-y-2">
                        {performance.weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600">Great job! No significant weaknesses identified</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Performance Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Complete some practice sessions to see your performance profile.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Accuracy Tab */}
          <TabsContent value="accuracy">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Overall Accuracy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {accuracy.overallAccuracy.toFixed(1)}%
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Based on {accuracy.totalRecommendations} recommendations
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Difficulty Accuracy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {accuracy.difficultyAccuracy.toFixed(1)}%
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Users follow difficulty recommendations
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Type Accuracy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {accuracy.typeAccuracy.toFixed(1)}%
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Users follow type recommendations
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}