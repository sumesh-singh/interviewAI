"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, Settings } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { speechService } from "@/lib/speech"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

interface AIInterviewerProps {
  question: string
  isActive: boolean
  onSpeechComplete?: () => void
}

export function AIInterviewer({ question, isActive, onSpeechComplete }: AIInterviewerProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isEnabled, setIsEnabled] = useState(true)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>("")
  const [speechRate, setSpeechRate] = useState([1])
  const [speechPitch, setSpeechPitch] = useState([1])
  const [showSettings, setShowSettings] = useState(false)
  const [lastSpokenQuestion, setLastSpokenQuestion] = useState("")

  useEffect(() => {
    // Load available voices
    const loadVoices = () => {
      const voices = speechService.getAvailableVoices()
      setAvailableVoices(voices)
      
      // Prefer a professional-sounding voice
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Daniel') || 
        voice.name.includes('Alex') || 
        voice.name.includes('Karen') ||
        voice.lang.includes('en-US') && voice.name.includes('Female')
      ) || voices[0]
      
      if (preferredVoice) {
        setSelectedVoice(preferredVoice.name)
      }
    }

    loadVoices()

    // Some browsers require this event listener for voices to load
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  useEffect(() => {
    // Auto-speak new questions if enabled and different from last spoken
    if (isEnabled && question && question !== lastSpokenQuestion && isActive) {
      handleSpeak()
    }
  }, [question, isEnabled, isActive])

  const handleSpeak = async () => {
    if (!question || isSpeaking) return

    try {
      setIsSpeaking(true)
      setLastSpokenQuestion(question)
      
      await speechService.speak(question, {
        voice: selectedVoice,
        rate: speechRate[0],
        pitch: speechPitch[0],
        volume: 1
      })
      
      onSpeechComplete?.()
    } catch (error) {
      console.error('Error speaking question:', error)
    } finally {
      setIsSpeaking(false)
    }
  }

  const handleStopSpeaking = () => {
    speechService.stopSpeaking()
    setIsSpeaking(false)
  }

  const toggleSettings = () => {
    setShowSettings(!showSettings)
  }

  if (!speechService.isSynthesisAvailable()) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                AI
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm text-amber-700">
                Speech synthesis is not available in this browser. The AI interviewer will still function, but questions won't be spoken aloud.
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
            {isSpeaking && (
              <div className="absolute -inset-1 rounded-full border-2 border-blue-400 animate-pulse" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-sm">AI Interviewer</h3>
              <Badge variant="secondary" className="text-xs">
                {isSpeaking ? "Speaking" : "Ready"}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {isSpeaking 
                ? "I'm reading the question aloud..." 
                : "I'll ask you interview questions. You can listen to them or read along."
              }
            </p>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              {isSpeaking ? (
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
                  disabled={!question || !isActive}
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
                
                {/* Voice Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">Voice</label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVoices.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Speech Rate */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">
                    Speed: {speechRate[0].toFixed(1)}x
                  </label>
                  <Slider
                    value={speechRate}
                    onValueChange={setSpeechRate}
                    min={0.5}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* Speech Pitch */}
                <div className="space-y-2">
                  <label className="text-xs font-medium">
                    Pitch: {speechPitch[0].toFixed(1)}
                  </label>
                  <Slider
                    value={speechPitch}
                    onValueChange={setSpeechPitch}
                    min={0.5}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                </div>

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
