export interface SpeechRecognitionConfig {
  continuous?: boolean
  interimResults?: boolean
  language?: string
  maxAlternatives?: number
}

export interface SpeechSynthesisConfig {
  voice?: string
  rate?: number
  pitch?: number
  volume?: number
}

export class SpeechService {
  private recognition: SpeechRecognition | null = null
  private synthesis: SpeechSynthesis
  private isRecognitionSupported: boolean
  private isSynthesisSupported: boolean

  constructor() {
    // Check for Web Speech API support
    this.isRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    this.isSynthesisSupported = 'speechSynthesis' in window
    this.synthesis = window.speechSynthesis
  }

  // Speech-to-Text functionality
  initializeRecognition(config: SpeechRecognitionConfig = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isRecognitionSupported) {
        reject(new Error('Speech recognition is not supported in this browser'))
        return
      }

      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        this.recognition = new SpeechRecognition()

        // Configure recognition settings
        this.recognition.continuous = config.continuous ?? true
        this.recognition.interimResults = config.interimResults ?? true
        this.recognition.lang = config.language ?? 'en-US'
        this.recognition.maxAlternatives = config.maxAlternatives ?? 1

        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  startRecognition(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not initialized'))
        return
      }

      let finalTranscript = ''
      let timeoutId: NodeJS.Timeout

      // Set up event handlers
      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        // Clear the timeout if we're getting results
        if (timeoutId) {
          clearTimeout(timeoutId)
        }

        // Set a new timeout for silence detection
        timeoutId = setTimeout(() => {
          this.stopRecognition()
          resolve(finalTranscript.trim())
        }, 3000) // 3 seconds of silence
      }

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        reject(new Error(`Speech recognition error: ${event.error}`))
      }

      this.recognition.onend = () => {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        resolve(finalTranscript.trim())
      }

      try {
        this.recognition.start()
      } catch (error) {
        reject(error)
      }
    })
  }

  stopRecognition(): void {
    if (this.recognition) {
      this.recognition.stop()
    }
  }

  // Text-to-Speech functionality
  speak(text: string, config: SpeechSynthesisConfig = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSynthesisSupported) {
        reject(new Error('Speech synthesis is not supported in this browser'))
        return
      }

      // Cancel any ongoing speech
      this.synthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      
      // Configure synthesis settings
      utterance.rate = config.rate ?? 1
      utterance.pitch = config.pitch ?? 1
      utterance.volume = config.volume ?? 1

      // Set voice if specified
      if (config.voice) {
        const voices = this.synthesis.getVoices()
        const selectedVoice = voices.find(voice => voice.name === config.voice)
        if (selectedVoice) {
          utterance.voice = selectedVoice
        }
      }

      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`))

      this.synthesis.speak(utterance)
    })
  }

  stopSpeaking(): void {
    if (this.isSynthesisSupported) {
      this.synthesis.cancel()
    }
  }

  // Utility methods
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isSynthesisSupported) return []
    return this.synthesis.getVoices()
  }

  isRecognitionAvailable(): boolean {
    return this.isRecognitionSupported
  }

  isSynthesisAvailable(): boolean {
    return this.isSynthesisSupported
  }

  // Enhanced speech recognition with better error handling and configuration
  async startContinuousRecognition(
    onTranscript: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void
  ): Promise<() => void> {
    if (!this.recognition) {
      await this.initializeRecognition({
        continuous: true,
        interimResults: true
      })
    }

    if (!this.recognition) {
      onError('Failed to initialize speech recognition')
      return () => {}
    }

    let isActive = true

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!isActive) return

      let interimTranscript = ''
      let finalTranscript = ''
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        onTranscript(finalTranscript.trim(), true)
      } else if (interimTranscript) {
        onTranscript(interimTranscript, false)
      }
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (!isActive) return
      onError(`Speech recognition error: ${event.error}`)
    }

    this.recognition.onend = () => {
      if (isActive) {
        // Restart recognition if it ends unexpectedly
        try {
          this.recognition?.start()
        } catch (error) {
          onError('Failed to restart speech recognition')
        }
      }
    }

    try {
      this.recognition.start()
    } catch (error) {
      onError('Failed to start speech recognition')
    }

    // Return cleanup function
    return () => {
      isActive = false
      this.stopRecognition()
    }
  }
}

// Global speech service instance
export const speechService = new SpeechService()

// Type declarations for Web Speech API (if not already available)
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}
