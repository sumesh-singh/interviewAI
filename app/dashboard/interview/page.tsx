"use client"

import { useState, useEffect } from "react"
import { InterviewSetup } from "@/components/interview-setup"
import { InterviewSession } from "@/components/interview-session"
import type { InterviewSession as IInterviewSession, ScoringWeights } from "@/types/interview"
import { mockQuestions } from "@/data/mock-questions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle } from "lucide-react"
import { offlineStorage } from "@/lib/offline-storage"
import { createClient } from "@/lib/supabase/client"

export default function InterviewPage() {
  const [currentSession, setCurrentSession] = useState<IInterviewSession | null>(null)
  const [completedSession, setCompletedSession] = useState<IInterviewSession | null>(null)
  const [scoringWeights, setScoringWeights] = useState<ScoringWeights | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadScoringWeights()
  }, [])

  const loadScoringWeights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Try to fetch from Supabase first
        const { data: weightsData } = await supabase
          .from('user_scoring_weights')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (weightsData) {
          const weights: ScoringWeights = {
            technicalAccuracy: weightsData.technical_accuracy || 0.15,
            communicationSkills: weightsData.communication_skills || 0.20,
            problemSolving: weightsData.problem_solving || 0.15,
            confidence: weightsData.confidence || 0.10,
            relevance: weightsData.relevance || 0.15,
            clarity: weightsData.clarity || 0.10,
            structure: weightsData.structure || 0.10,
            examples: weightsData.examples || 0.05,
          }
          setScoringWeights(weights)
          offlineStorage.saveScoringWeights(weights)
          return
        }
      }
    } catch (error) {
      console.warn('Failed to fetch scoring weights from Supabase:', error)
    }

    // Fall back to offline storage
    const offlineWeights = offlineStorage.getScoringWeights()
    setScoringWeights(offlineWeights)
  }

  const handleStartInterview = async (config: {
    type: "behavioral" | "technical" | "mixed"
    duration: number
    difficulty: "easy" | "medium" | "hard"
    questionBankId?: string
  }) => {
    let filteredQuestions = mockQuestions

    // If a question bank is selected, fetch its questions
    if (config.questionBankId) {
      try {
        const { sessionManager } = await import("@/lib/session-manager")
        const session = await sessionManager.createSession({
          type: config.type,
          duration: config.duration,
          difficulty: config.difficulty,
          questionBankId: config.questionBankId
        })
        setCurrentSession(session)
        setCompletedSession(null)
        return
      } catch (err) {
        console.error("Failed to load question bank:", err)
      }
    }

    // Filter questions based on type and difficulty
    filteredQuestions = mockQuestions
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
      scoringWeights: scoringWeights || undefined,
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
