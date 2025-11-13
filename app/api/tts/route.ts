import { NextRequest, NextResponse } from 'next/server'

// Note: Using elevenlabs-node package
const ElevenLabs = require('elevenlabs-node')

// Initialize ElevenLabs client with API key from environment variables
const elevenlabs = new ElevenLabs({
  apiKey: process.env.ELEVENLABS_API_KEY, 
})

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId } = await request.json()

    if (!text) {
      return new NextResponse('Text is required', { status: 400 })
    }

    // Default voice if not provided
    const selectedVoiceId = voiceId || 'pNInz6obpgDQGcFmaJgB' // Default voice 'Adam'

    const audioStream = await elevenlabs.textToSpeechStream({
      voiceId: selectedVoiceId,
      textInput: text,
      modelId: "eleven_multilingual_v2",
      stability: 0.5,
      similarityBoost: 0.75,
    });

    const response = new NextResponse(audioStream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

    return response;
  } catch (error) {
    console.error('ElevenLabs TTS API error:', error)
    return new NextResponse('Failed to generate speech', { status: 500 })
  }
}
