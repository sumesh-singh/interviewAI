"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, MicOff, Volume2 } from "lucide-react"
import type { VoiceState } from "@/types/interview"
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

interface VoiceRecorderProps {
  onTranscript: (text: string) => void
  onStateChange: (state: VoiceState) => void
  isActive: boolean
}

export function VoiceRecorder({ onTranscript, onStateChange, isActive }: VoiceRecorderProps) {
  const { 
    transcript, 
    interimTranscript, 
    finalTranscript, 
    listening, 
    resetTranscript, 
    browserSupportsSpeechRecognition 
  } = useSpeechRecognition({
    continuous: true, // Enable continuous listening
    interimResults: true // Get interim results
  })

  const [voiceState, setVoiceState] = useState<VoiceState>({
    isRecording: false,
    isListening: false,
    audioLevel: 0,
    hasPermission: false,
  })

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>()
  const currentMicrophoneStreamRef = useRef<MediaStream | null>(null)

  // Check microphone permission on mount
  useEffect(() => {
    const checkMicrophonePermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        setVoiceState((prev) => ({ ...prev, hasPermission: true }))
        stream.getTracks().forEach((track) => track.stop())
      } catch (error) {
        setVoiceState((prev) => ({
          ...prev,
          hasPermission: false,
          error: "Microphone permission denied",
        }))
      }
    }
    checkMicrophonePermission()
  }, [])

  // Update voice state based on react-speech-recognition's listening state
  useEffect(() => {
    setVoiceState((prev) => ({
      ...prev,
      isRecording: listening,
      isListening: listening,
    }))
  }, [listening])

  // Handle transcript updates
  useEffect(() => {
    // react-speech-recognition automatically handles final vs interim
    // The 'transcript' property is the full current transcript (final + interim)
    // We'll use finalTranscript for sending, and 'transcript' for any real-time display if needed

    if (!listening && finalTranscript) {
      onTranscript(finalTranscript.trim())
      resetTranscript() // Clear transcript after sending final
    }
    // If listening, send interim results for real-time display if desired by parent
    // onTranscript(transcript, false) // This would be for continuous interim updates

  }, [finalTranscript, transcript, listening, onTranscript, resetTranscript])

  // Propagate voice state changes to parent
  useEffect(() => {
    onStateChange(voiceState)
  }, [voiceState, onStateChange])

  // Audio level monitoring - simplified for react-speech-recognition
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current || !voiceState.isRecording) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

    const updateLevel = () => {
      if (!analyserRef.current || !voiceState.isRecording) {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
        return
      }

      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      const normalizedLevel = Math.min(average / 128, 1) // Normalize to 0-1

      setVoiceState((prev) => ({ ...prev, audioLevel: normalizedLevel }))
      animationFrameRef.current = requestAnimationFrame(updateLevel)
    }

    animationFrameRef.current = requestAnimationFrame(updateLevel)
  }, [voiceState.isRecording])

  // Effect to start/stop audio level monitoring
  useEffect(() => {
    if (listening) {
      const setupAudioViz = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          currentMicrophoneStreamRef.current = stream
          audioContextRef.current = new AudioContext()
          analyserRef.current = audioContextRef.current.createAnalyser()
          const source = audioContextRef.current.createMediaStreamSource(stream)
          source.connect(analyserRef.current)
          monitorAudioLevel()
        } catch (error) {
          console.error("Error setting up audio visualization:", error)
        }
      }
      setupAudioViz()
    } else {
      // Cleanup audio visualization
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      if (currentMicrophoneStreamRef.current) {
        currentMicrophoneStreamRef.current.getTracks().forEach(track => track.stop())
        currentMicrophoneStreamRef.current = null
      }
      setVoiceState((prev) => ({ ...prev, audioLevel: 0 }))
    }
  }, [listening, monitorAudioLevel])

  const startRecording = async () => {
    if (browserSupportsSpeechRecognition && isActive) {
      try {
        // Ensure microphone permission is granted before starting recognition
        await navigator.mediaDevices.getUserMedia({ audio: true })
        setVoiceState((prev) => ({ ...prev, hasPermission: true }))
        SpeechRecognition.startListening()
        resetTranscript()
      } catch (error) {
        console.error("Failed to start recording:", error)
        setVoiceState((prev) => ({
          ...prev,
          error: "Failed to start recording. Microphone access denied or unavailable.",
          hasPermission: false,
        }))
      }
    }
  }

  const stopRecording = () => {
    SpeechRecognition.stopListening()
    // onTranscript(finalTranscript.trim()) // Ensure final transcript is sent on stop
    // resetTranscript() // Reset after sending
  }

  const toggleRecording = () => {
    if (listening) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Fallback if browser doesn't support speech recognition
  if (!browserSupportsSpeechRecognition) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6 text-center space-y-4">
          <MicOff className="h-12 w-12 mx-auto text-amber-700" />
          <div>
            <h3 className="font-semibold">Speech Recognition Not Supported</h3>
            <p className="text-sm text-amber-700">
              Your browser does not support speech recognition. Please try a different browser like Chrome or Edge.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!voiceState.hasPermission) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <MicOff className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <h3 className="font-semibold">Microphone Access Required</h3>
            <p className="text-sm text-muted-foreground">Please allow microphone access to use voice features</p>
          </div>
          <Button onClick={startRecording} disabled={!isActive}>
            <Volume2 className="h-4 w-4 mr-2" />
            Enable Microphone
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Button
              onClick={toggleRecording}
              disabled={!isActive}
              size="lg"
              variant={listening ? "destructive" : "default"}
              className="h-16 w-16 rounded-full"
            >
              {listening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>

            {listening && (
              <div
                className="absolute inset-0 rounded-full border-2 border-red-500 animate-pulse"
                style={{
                  transform: `scale(${1 + voiceState.audioLevel * 0.3})`,
                  transition: "transform 0.1s ease-out",
                }}
              />
            )}
          </div>

          <div className="text-center">
            <p className="font-medium">{listening ? "Recording..." : "Click to start recording"}</p>
            <p className="text-sm text-muted-foreground">
              {listening ? "Listening for your response" : "Ready to record"}
            </p>
          </div>

          {listening && (
            <div className="w-full max-w-xs">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-100"
                  style={{ width: `${voiceState.audioLevel * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
