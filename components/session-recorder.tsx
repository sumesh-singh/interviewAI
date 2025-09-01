"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Play, 
  Pause, 
  Square, 
  Download, 
  Upload, 
  Clock, 
  FileAudio,
  Video,
  Mic
} from "lucide-react"

export interface SessionRecording {
  id: string
  sessionId: string
  audioBlob?: Blob
  videoBlob?: Blob
  transcript: string
  duration: number
  timestamp: Date
  questionId: string
}

interface SessionRecorderProps {
  sessionId: string
  questionId: string
  isActive: boolean
  onRecordingComplete?: (recording: SessionRecording) => void
}

export function SessionRecorder({ 
  sessionId, 
  questionId, 
  isActive, 
  onRecordingComplete 
}: SessionRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordings, setRecordings] = useState<SessionRecording[]>([])
  const [currentRecording, setCurrentRecording] = useState<SessionRecording | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [hasPermission, setHasPermission] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])
  const videoChunksRef = useRef<BlobPart[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadExistingRecordings()
    checkPermissions()
    
    return () => {
      stopRecording()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [sessionId, questionId])

  const loadExistingRecordings = () => {
    try {
      const stored = localStorage.getItem(`recordings-${sessionId}-${questionId}`)
      if (stored) {
        setRecordings(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load recordings:', error)
    }
  }

  const saveRecording = (recording: SessionRecording) => {
    try {
      const updated = [...recordings, recording]
      setRecordings(updated)
      localStorage.setItem(`recordings-${sessionId}-${questionId}`, JSON.stringify(
        updated.map(r => ({ ...r, audioBlob: undefined, videoBlob: undefined })) // Don't store blobs in localStorage
      ))
    } catch (error) {
      console.error('Failed to save recording:', error)
    }
  }

  const checkPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false // Start with audio only
      })
      setHasPermission(true)
      stream.getTracks().forEach(track => track.stop())
    } catch (error) {
      setHasPermission(false)
      console.error('Permission denied:', error)
    }
  }

  const startRecording = async (includeVideo = false) => {
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: includeVideo ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      // Set up MediaRecorder
      const options = { mimeType: 'audio/webm; codecs=opus' }
      mediaRecorderRef.current = new MediaRecorder(stream, options)
      
      audioChunksRef.current = []
      if (includeVideo) {
        videoChunksRef.current = []
      }

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const videoBlob = includeVideo && videoChunksRef.current.length > 0 
          ? new Blob(videoChunksRef.current, { type: 'video/webm' }) 
          : undefined

        const recording: SessionRecording = {
          id: `recording-${Date.now()}`,
          sessionId,
          questionId,
          audioBlob,
          videoBlob,
          transcript: '', // Will be populated by speech recognition
          duration: recordingDuration,
          timestamp: new Date()
        }

        setCurrentRecording(recording)
        saveRecording(recording)
        onRecordingComplete?.(recording)
      }

      // Start recording
      mediaRecorderRef.current.start(100) // Collect data every 100ms
      setIsRecording(true)
      setRecordingDuration(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    setIsRecording(false)
  }

  const downloadRecording = (recording: SessionRecording) => {
    if (!recording.audioBlob) return

    const url = URL.createObjectURL(recording.audioBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `interview-${sessionId}-${questionId}-${recording.timestamp.toISOString()}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!hasPermission) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 text-center">
          <Mic className="h-8 w-8 mx-auto text-amber-600 mb-2" />
          <p className="text-sm text-amber-700 mb-3">
            Recording requires microphone access
          </p>
          <Button onClick={checkPermissions} size="sm">
            Grant Permission
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileAudio className="h-5 w-5" />
            <span>Session Recording</span>
            {isRecording && (
              <Badge variant="destructive" className="animate-pulse">
                REC {formatDuration(recordingDuration)}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            {!isRecording ? (
              <>
                <Button 
                  onClick={() => startRecording(false)}
                  disabled={!isActive}
                  className="flex-1"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Start Audio Recording
                </Button>
                <Button 
                  onClick={() => startRecording(true)}
                  disabled={!isActive}
                  variant="outline"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Video
                </Button>
              </>
            ) : (
              <Button 
                onClick={stopRecording}
                variant="destructive"
                className="flex-1"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop Recording
              </Button>
            )}
          </div>

          {isRecording && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Recording in progress...</span>
                <span>{formatDuration(recordingDuration)}</span>
              </div>
              <Progress value={(recordingDuration % 60) * 100 / 60} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Recordings */}
      {recordings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Previous Recordings</span>
              <Badge variant="outline">{recordings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recordings.map((recording, index) => (
              <div 
                key={recording.id} 
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FileAudio className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      Recording #{index + 1}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {recording.timestamp.toLocaleString()} • {formatDuration(recording.duration)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => downloadRecording(recording)}
                    disabled={!recording.audioBlob}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Audio playback component for recorded sessions
interface AudioPlaybackProps {
  recording: SessionRecording
  onTranscriptUpdate?: (transcript: string) => void
}

export function AudioPlayback({ recording, onTranscriptUpdate }: AudioPlaybackProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (recording.audioBlob && audioRef.current) {
      const url = URL.createObjectURL(recording.audioBlob)
      audioRef.current.src = url
      
      return () => URL.revokeObjectURL(url)
    }
  }, [recording.audioBlob])

  const togglePlayback = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Audio Playback</h3>
            <Badge variant="outline">
              {formatTime(currentTime)} / {formatTime(duration)}
            </Badge>
          </div>

          <audio
            ref={audioRef}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          />

          <div className="space-y-2">
            <Progress value={(currentTime / duration) * 100} className="w-full" />
            
            <div className="flex items-center justify-center space-x-2">
              <Button onClick={togglePlayback} size="sm">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {recording.transcript && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <h4 className="font-medium text-sm mb-2">Transcript</h4>
              <p className="text-xs text-muted-foreground">{recording.transcript}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Recording manager for handling multiple recordings
interface RecordingManagerProps {
  sessionId: string
}

export function RecordingManager({ sessionId }: RecordingManagerProps) {
  const [allRecordings, setAllRecordings] = useState<SessionRecording[]>([])
  const [selectedRecording, setSelectedRecording] = useState<SessionRecording | null>(null)

  useEffect(() => {
    loadAllRecordings()
  }, [sessionId])

  const loadAllRecordings = () => {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(`recordings-${sessionId}`)
      )
      
      const recordings: SessionRecording[] = []
      keys.forEach(key => {
        const stored = localStorage.getItem(key)
        if (stored) {
          recordings.push(...JSON.parse(stored))
        }
      })

      setAllRecordings(recordings)
    } catch (error) {
      console.error('Failed to load recordings:', error)
    }
  }

  const exportAllRecordings = () => {
    const exportData = {
      sessionId,
      recordings: allRecordings.map(r => ({
        ...r,
        audioBlob: undefined, // Can't serialize blobs
        videoBlob: undefined
      })),
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `interview-recordings-${sessionId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const deleteRecording = (recordingId: string) => {
    const updated = allRecordings.filter(r => r.id !== recordingId)
    setAllRecordings(updated)
    
    // Update localStorage for each question
    const groupedByQuestion = updated.reduce((acc, recording) => {
      const key = `recordings-${sessionId}-${recording.questionId}`
      if (!acc[key]) acc[key] = []
      acc[key].push(recording)
      return acc
    }, {} as Record<string, SessionRecording[]>)

    Object.entries(groupedByQuestion).forEach(([key, recordings]) => {
      localStorage.setItem(key, JSON.stringify(recordings))
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Session Recordings</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{allRecordings.length} recordings</Badge>
              {allRecordings.length > 0 && (
                <Button onClick={exportAllRecordings} size="sm" variant="outline">
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {allRecordings.length > 0 && (
          <CardContent className="space-y-2">
            {allRecordings.map((recording, index) => (
              <div 
                key={recording.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                onClick={() => setSelectedRecording(recording)}
              >
                <div className="flex items-center space-x-3">
                  <FileAudio className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">
                      Recording {index + 1}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {recording.timestamp.toLocaleDateString()} • {formatTime(recording.duration)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {recording.videoBlob && (
                    <Badge variant="secondary" className="text-xs">Video</Badge>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteRecording(recording.id)
                    }}
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Selected Recording Playback */}
      {selectedRecording && (
        <AudioPlayback 
          recording={selectedRecording}
          onTranscriptUpdate={(transcript) => {
            // Update recording with transcript
            const updated = allRecordings.map(r => 
              r.id === selectedRecording.id ? { ...r, transcript } : r
            )
            setAllRecordings(updated)
          }}
        />
      )}
    </div>
  )
}

// Helper function
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
