"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, Settings } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useElevenLabsTTS } from "@/hooks/use-elevenlabs-tts"

interface AIInterviewerProps {
  question: string
  isActive: boolean
  onSpeechComplete?: () => void
}

export function AIInterviewer({ question, isActive, onSpeechComplete }: AIInterviewerProps) {
  const { speak, stop, isPlaying, isLoading, error } = useElevenLabsTTS()
  const [isEnabled, setIsEnabled] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [lastSpokenQuestion, setLastSpokenQuestion] = useState("")

  useEffect(() => {
    // Auto-speak new questions if enabled and different from last spoken
    if (isEnabled && question && question !== lastSpokenQuestion && isActive && !isPlaying && !isLoading) {
      handleSpeak()
    }
  }, [question, isEnabled, isActive, isPlaying, isLoading])

  const handleSpeak = async () => {
    if (!question || isPlaying || isLoading) return

    try {
      setLastSpokenQuestion(question)
      await speak(question)
      onSpeechComplete?.()
    } catch (err) {
      console.error('Error speaking question with ElevenLabs:', err)
    }
  }

  const handleStopSpeaking = () => {
    stop()
  }

  const toggleSettings = () => {
    setShowSettings(!showSettings)
  }

  // Handle ElevenLabs specific errors or if API key is missing
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                AI
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm text-red-700">
                Error with AI voice: {error}. Please ensure your ElevenLabs API key is configured correctly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* AI Avatar */}
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                AI
              </AvatarFallback>
            </Avatar>
            {isPlaying && (
              <div className="absolute -inset-1 rounded-full border-2 border-blue-400 animate-pulse" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-sm">AI Interviewer</h3>
              <Badge variant="secondary" className="text-xs">
                {isPlaying ? "Speaking" : (isLoading ? "Loading Voice" : "Ready")}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {isPlaying 
                ? "I'm reading the question aloud..." 
                : "I'll ask you interview questions. You can listen to them or read along."
              }
            </p>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              {isPlaying ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleStopSpeaking}
                  className="h-8"
                >
                  <VolumeX className="h-3 w-3 mr-1" />
                  Stop
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleSpeak}
                  disabled={!question || !isActive || isLoading}
                  className="h-8"
                >
                  <Volume2 className="h-3 w-3 mr-1" />
                  Speak Question
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={toggleSettings}
                className="h-8"
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="mt-4 p-3 bg-white rounded-lg border space-y-3">
                <h4 className="font-medium text-sm">Voice Settings</h4>
                
                {/* Auto-speak toggle */}
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="auto-speak"
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="auto-speak" className="text-xs">
                    Auto-speak new questions
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
