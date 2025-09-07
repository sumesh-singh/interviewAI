import { useState, useRef, useCallback } from 'react'

interface UseElevenLabsTTSOptions {
  voiceId?: string
}

interface UseElevenLabsTTS {
  speak: (text: string, options?: UseElevenLabsTTSOptions) => Promise<void>
  stop: () => void
  isPlaying: boolean
  isLoading: boolean
  error: string | null
}

export function useElevenLabsTTS(): UseElevenLabsTTS {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const ensureAudioElement = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.onended = () => {
        setIsPlaying(false)
        setError(null)
      }
      audioRef.current.onerror = (e) => {
        setIsPlaying(false)
        setError('Audio playback error')
        console.error('Audio playback error:', e)
      }
    }
    return audioRef.current
  }, [])

  const speak = useCallback(async (text: string, options?: UseElevenLabsTTSOptions) => {
    if (!text) {
      setError('No text provided for speech synthesis.')
      return
    }

    // If already playing, stop current playback
    if (isPlaying) {
      stop()
    }

    setIsLoading(true)
    setError(null)
    const audio = ensureAudioElement()

    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceId: options?.voiceId, 
        }),
        signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch audio from ElevenLabs')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      audio.src = audioUrl
      await audio.play()
      setIsPlaying(true)
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Speech synthesis aborted')
      } else {
        setError(err.message || 'An unknown error occurred during speech synthesis')
        console.error('Speech synthesis error:', err)
      }
    } finally {
      setIsLoading(false)
    }
  }, [isPlaying, ensureAudioElement])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsLoading(false)
  }, [])

  return {
    speak,
    stop,
    isPlaying,
    isLoading,
    error,
  }
}
