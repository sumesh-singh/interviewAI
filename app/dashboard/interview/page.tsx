"use client"

import { useState } from "react"
import { InterviewSetup } from "@/components/interview-setup"
import { InterviewSession } from "@/components/interview-session"
import type { InterviewSession as IInterviewSession } from "@/types/interview"
import type { InterviewTemplate } from "@/data/interview-templates"
import { mockQuestions } from "@/data/mock-questions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle } from "lucide-react"

export default function InterviewPage() {
  const [currentSession, setCurrentSession] = useState<IInterviewSession | null>(null)
  const [completedSession, setCompletedSession] = useState<IInterviewSession | null>(null)

  const handleStartInterview = (config: {
    type: "behavioral" | "technical" | "mixed"
    duration: number
    difficulty: "easy" | "medium" | "hard"
  }) => {
    // Filter questions based on type and difficulty
    let filteredQuestions = mockQuestions
      .filter((q) => {
        if (config.type === "mixed") return true
        return q.type === config.type
      })
      .filter((q) => q.difficulty === config.difficulty)

    // Limit questions based on duration (roughly 1 question per 10 minutes)
    const maxQuestions = Math.max(1, Math.floor(config.duration / 10))
    filteredQuestions = filteredQuestions.slice(0, maxQuestions)

    const session: IInterviewSession = {
      id: Date.now().toString(),
      type: config.type,
      duration: config.duration,
      difficulty: config.difficulty,
      questions: filteredQuestions,
      currentQuestionIndex: 0,
      status: "setup",
    }

    setCurrentSession(session)
    setCompletedSession(null)
  }

  const handleStartTemplate = (template: InterviewTemplate) => {
    const session: IInterviewSession = {
      id: Date.now().toString(),
      type: template.category,
      duration: template.duration,
      difficulty: template.difficulty,
      questions: template.questions,
      currentQuestionIndex: 0,
      status: "setup",
    }

    setCurrentSession(session)
    setCompletedSession(null)
  }

  const handleSessionEnd = (session: IInterviewSession) => {
    setCompletedSession(session)
    setCurrentSession(null)
  }

  const handleEmergencyExit = () => {
    setCurrentSession(null)
    setCompletedSession(null)
  }

  const handleBackToSetup = () => {
    setCurrentSession(null)
    setCompletedSession(null)
  }

  // Session completed view
  if (completedSession) {
    const duration =
      completedSession.endTime && completedSession.startTime
        ? Math.round((completedSession.endTime.getTime() - completedSession.startTime.getTime()) / 1000 / 60)
        : 0

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Interview Session Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{completedSession.questions.length}</p>
                <p className="text-sm text-muted-foreground">Questions Answered</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{duration}m</p>
                <p className="text-sm text-muted-foreground">Duration</p>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                Great job completing your {completedSession.type} interview practice!
              </p>
              <p className="text-sm text-muted-foreground">Review your performance and keep practicing to improve.</p>
            </div>

            <Button onClick={handleBackToSetup} className="w-full">
              Start New Session
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Active session view
  if (currentSession) {
    return (
      <div className="space-y-4">
        <Button onClick={handleBackToSetup} variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Setup
        </Button>

        <InterviewSession
          session={currentSession}
          onSessionEnd={handleSessionEnd}
          onEmergencyExit={handleEmergencyExit}
        />
      </div>
    )
  }

  // Setup view
  return (
    <InterviewSetup 
      onStartInterview={handleStartInterview}
      onStartTemplate={handleStartTemplate}
    />
  )
}
