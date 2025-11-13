"use client"

import { useState } from "react"
import ProtectedRoute from "@/components/protected-route"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { PlayCircle, Clock, Users, Brain, Settings } from "lucide-react"
import { InterviewSetup } from "@/components/interview-setup-adaptive"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function PracticePage() {
  const [showSetup, setShowSetup] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  // Mock userId - in a real app, this would come from authentication
  const userId = "demo-user"

  const practiceTypes = [
    {
      title: "Technical Interview",
      description: "Practice coding problems and technical questions",
      duration: "30-60 min",
      difficulty: "Intermediate",
      icon: Brain,
      type: "technical" as const,
    },
    {
      title: "Behavioral Interview",
      description: "Work on storytelling and soft skills",
      duration: "20-40 min",
      difficulty: "Beginner",
      icon: Users,
      type: "behavioral" as const,
    },
    {
      title: "Mixed Interview",
      description: "Combine technical and behavioral questions",
      duration: "30-45 min",
      difficulty: "Intermediate",
      icon: Clock,
      type: "mixed" as const,
    },
  ]

  const handleQuickStart = (type: "behavioral" | "technical" | "mixed") => {
    setSelectedType(type)
    setShowSetup(true)
  }

  const handleStartInterview = (config: {
    type: "behavioral" | "technical" | "mixed"
    duration: number
    difficulty: "easy" | "medium" | "hard"
    useRecommendation?: boolean
  }) => {
    // In a real app, this would start the interview session
    console.log("Starting interview with config:", config)
    // Navigate to interview page or start interview logic
    alert(`Starting ${config.type} interview at ${config.difficulty} difficulty for ${config.duration} minutes`)
  }

  if (showSetup) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="space-y-4">
            <Button 
              variant="outline" 
              onClick={() => setShowSetup(false)}
              className="mb-4"
            >
              ← Back to Practice Options
            </Button>
            <InterviewSetup 
              onStartInterview={handleStartInterview}
              userId={userId}
            />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Practice Interviews</h1>
            <p className="text-gray-600">Choose an interview type to start practicing</p>
          </div>

          {/* Adaptive Recommendation Card */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Settings className="h-5 w-5" />
                Adaptive Practice
              </CardTitle>
              <CardDescription className="text-blue-700">
                Get personalized recommendations based on your performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowSetup(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Start Personalized Interview
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {practiceTypes.map((type, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg mr-3">
                      <type.icon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{type.title}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {type.difficulty}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <CardDescription className="mb-4">
                    {type.description}
                  </CardDescription>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{type.duration}</span>
                    <Button 
                      size="sm"
                      onClick={() => handleQuickStart(type.type)}
                    >
                      Quick Start
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
