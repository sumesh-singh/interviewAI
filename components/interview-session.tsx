"use client"

import { useState, useEffect } from "react"
import type { InterviewSession as IInterviewSession, VoiceState } from "@/types/interview"
import { QuestionDisplay } from "./question-display"
import { VoiceRecorder } from "./voice-recorder"
import { SessionControls } from "./session-controls"
import { SessionTimer } from "./session-timer"
import { AudioVisualizer } from "./audio-visualizer"
import { AIInterviewer } from "./ai-interviewer"
import { AIFeedbackComponent } from "./ai-feedback"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface InterviewSessionProps {
  session: IInterviewSession
  onSessionEnd: (session: IInterviewSession) => void
  onEmergencyExit: () => void
}

export function InterviewSession({ session, onSessionEnd, onEmergencyExit }: InterviewSessionProps) {
  const [currentSession, setCurrentSession] = useState<IInterviewSession>(session)
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isRecording: false,
    isListening: false,
    audioLevel: 0,
    hasPermission: false,
  })
  const [transcript, setTranscript] = useState<string>("")
  const [isPaused, setIsPaused] = useState(false)
  const [feedbackData, setFeedbackData] = useState<any>(null)
  const [responseStartTime, setResponseStartTime] = useState<Date | null>(null)

  const currentQuestion = currentSession.questions[currentSession.currentQuestionIndex]
  const totalDurationSeconds = currentSession.duration * 60

  useEffect(() => {
    // Start the session
    setCurrentSession((prev) => ({
      ...prev,
      status: "active",
      startTime: new Date(),
    }))
  }, [])

  const handlePause = () => {
    setIsPaused(true)
    setCurrentSession((prev) => ({ ...prev, status: "paused" }))
  }

  const handleResume = () => {
    setIsPaused(false)
    setCurrentSession((prev) => ({ ...prev, status: "active" }))
  }

  const handleStop = () => {
    const endedSession = {
      ...currentSession,
      status: "completed" as const,
      endTime: new Date(),
    }
    setCurrentSession(endedSession)
    onSessionEnd(endedSession)
  }

  const handleNext = () => {
    if (currentSession.currentQuestionIndex < currentSession.questions.length - 1) {
      setCurrentSession((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }))
      setTranscript("")
      setFeedbackData(null)
      setResponseStartTime(null)
    } else {
      handleStop()
    }
  }

  const handleTimeUp = () => {
    handleStop()
  }

  const handleTranscript = (text: string) => {
    if (!responseStartTime && text.length > 0) {
      setResponseStartTime(new Date())
    }
    setTranscript(text)
  }

  const handleVoiceStateChange = (state: VoiceState) => {
    setVoiceState(state)
  }

  const canGoNext = transcript.length > 0 || currentSession.currentQuestionIndex === currentSession.questions.length - 1

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Interview Session</h1>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="outline">{currentSession.type}</Badge>
            <Badge variant="outline">{currentSession.difficulty}</Badge>
            <Badge variant={currentSession.status === "active" ? "default" : "secondary"}>
              {currentSession.status}
            </Badge>
          </div>
        </div>

        <SessionTimer totalDuration={totalDurationSeconds} isPaused={isPaused} onTimeUp={handleTimeUp} />
      </div>

      {/* Question Display */}
      <QuestionDisplay
        question={currentQuestion}
        questionNumber={currentSession.currentQuestionIndex + 1}
        totalQuestions={currentSession.questions.length}
      />

      {/* AI Interviewer */}
      <AIInterviewer 
        question={currentQuestion.question}
        isActive={currentSession.status === "active"}
      />

      {/* Voice Interaction */}
      <div className="grid md:grid-cols-2 gap-6">
        <VoiceRecorder
          onTranscript={handleTranscript}
          onStateChange={handleVoiceStateChange}
          isActive={currentSession.status === "active"}
        />

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Audio Visualization</h3>
            <AudioVisualizer audioLevel={voiceState.audioLevel} isActive={voiceState.isRecording} className="w-full" />
            <div className="mt-4 text-sm text-muted-foreground">
              Status: {voiceState.isRecording ? "Recording" : "Ready"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transcript and Feedback */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Transcript Display */}
        {transcript && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Your Response</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{transcript}</p>
            </CardContent>
          </Card>
        )}

        {/* AI Feedback */}
        <AIFeedbackComponent
          question={currentQuestion.question}
          response={transcript}
          role={currentSession.type === 'technical' ? 'Software Engineer' : 'General Position'}
          duration={responseStartTime ? Math.floor((Date.now() - responseStartTime.getTime()) / 1000) : 0}
          onFeedbackComplete={(feedback) => setFeedbackData(feedback)}
        />
      </div>

      {/* Session Controls */}
      <SessionControls
        isPaused={isPaused}
        onPause={handlePause}
        onResume={handleResume}
        onStop={handleStop}
        onNext={handleNext}
        onEmergencyExit={onEmergencyExit}
        canGoNext={canGoNext}
      />
    </div>
  )
}
