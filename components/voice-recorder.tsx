"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, MicOff, Volume2 } from "lucide-react"
import type { VoiceState } from "@/types/interview"
import { speechService } from "@/lib/speech"

interface VoiceRecorderProps {
  onTranscript: (text: string) => void
  onStateChange: (state: VoiceState) => void
  isActive: boolean
}

export function VoiceRecorder({ onTranscript, onStateChange, isActive }: VoiceRecorderProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isRecording: false,
    isListening: false,
    audioLevel: 0,
    hasPermission: false,
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>()
  const cleanupRecognitionRef = useRef<(() => void) | null>(null)
  const currentTranscriptRef = useRef<string>("")

  useEffect(() => {
    checkMicrophonePermission()
    initializeSpeechRecognition()
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (cleanupRecognitionRef.current) {
        cleanupRecognitionRef.current()
      }
    }
  }, [])

  useEffect(() => {
    onStateChange(voiceState)
  }, [voiceState, onStateChange])

  const initializeSpeechRecognition = async () => {
    try {
      if (speechService.isRecognitionAvailable()) {
        await speechService.initializeRecognition()
      }
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error)
    }
  }

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Set up audio context for visualization
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      // Set up media recorder for backup
      mediaRecorderRef.current = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      mediaRecorderRef.current.start()
      setVoiceState((prev) => ({ ...prev, isRecording: true, isListening: true }))

      // Start real-time speech recognition
      if (speechService.isRecognitionAvailable()) {
        currentTranscriptRef.current = ""
        cleanupRecognitionRef.current = await speechService.startContinuousRecognition(
          (transcript, isFinal) => {
            if (isFinal) {
              currentTranscriptRef.current += transcript + " "
              onTranscript(currentTranscriptRef.current.trim())
            }
          },
          (error) => {
            console.error('Speech recognition error:', error)
            setVoiceState((prev) => ({ ...prev, error }))
          }
        )
      }

      // Start audio level monitoring
      monitorAudioLevel()
    } catch (error) {
      setVoiceState((prev) => ({
        ...prev,
        error: "Failed to start recording",
      }))
    }
  }

  const stopRecording = () => {
    // Stop speech recognition
    if (cleanupRecognitionRef.current) {
      cleanupRecognitionRef.current()
      cleanupRecognitionRef.current = null
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Send final transcript if we have one
    if (currentTranscriptRef.current) {
      onTranscript(currentTranscriptRef.current.trim())
    }

    setVoiceState((prev) => ({
      ...prev,
      isRecording: false,
      isListening: false,
      audioLevel: 0,
    }))
  }

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

    const updateLevel = () => {
      if (!analyserRef.current) return

      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      const normalizedLevel = Math.min(average / 128, 1)

      setVoiceState((prev) => ({ ...prev, audioLevel: normalizedLevel }))

      if (voiceState.isRecording) {
        animationFrameRef.current = requestAnimationFrame(updateLevel)
      }
    }

    updateLevel()
  }

  const toggleRecording = () => {
    if (voiceState.isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
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
          <Button onClick={checkMicrophonePermission}>
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
              variant={voiceState.isRecording ? "destructive" : "default"}
              className="h-16 w-16 rounded-full"
            >
              {voiceState.isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>

            {voiceState.isRecording && (
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
            <p className="font-medium">{voiceState.isRecording ? "Recording..." : "Click to start recording"}</p>
            <p className="text-sm text-muted-foreground">
              {voiceState.isListening ? "Listening for your response" : "Ready to record"}
            </p>
          </div>

          {voiceState.isRecording && (
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
