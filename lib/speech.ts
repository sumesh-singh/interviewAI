import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

export interface SpeechRecognitionConfig {
  continuous?: boolean
  interimResults?: boolean
  language?: string
}

// Speech-to-Text functionality will be managed by react-speech-recognition
// This service will now primarily act as an orchestrator or provide utility
// For direct recognition use, consumers will use useSpeechRecognition hook
export class SpeechService {
  private isRecognitionSupported: boolean

  constructor() {
    this.isRecognitionSupported = SpeechRecognition.browserSupportsSpeechRecognition()
  }

  isRecognitionAvailable(): boolean {
    return this.isRecognitionSupported
  }

  // This method will be deprecated or refactored as useSpeechRecognition hook is preferred
  // For now, it provides a basic wrapper if direct service calls are still needed temporarily
  async startContinuousRecognition(
    onTranscript: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void
  ): Promise<() => void> {
    if (!this.isRecognitionSupported) {
      onError('Speech recognition is not supported in this browser')
      return () => {}
    }

    // This is a simplified wrapper. The actual continuous recognition
    // logic will be handled more robustly by the useSpeechRecognition hook in components.
    // This service method might be removed entirely or re-purposed later.
    console.warn("SpeechService.startContinuousRecognition is a basic wrapper. Consider using useSpeechRecognition hook directly.")

    // In a real scenario, you'd manage the recognition instance directly here
    // or expose more fine-grained controls from react-speech-recognition.
    // For demonstration, we'll just provide a placeholder.
    
    // As react-speech-recognition largely handles the lifecycle, 
    // this method's utility becomes limited.
    // The primary way to use continuous recognition will be through the hook.
    
    // For now, we'll just provide a dummy cleanup and a console warning.
    onError("Please use the useSpeechRecognition hook directly in your components for full functionality.")

    return () => {
      // Dummy cleanup
      console.log("SpeechService recognition cleanup called.")
    }
  }
}

// Global speech service instance
export const speechService = new SpeechService()
