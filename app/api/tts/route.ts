import { NextRequest, NextResponse } from 'next/server'
import { ElevenLabsClient, play } from 'elevenlabs'

// Initialize ElevenLabs client with API key from environment variables
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY, 
});

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId } = await request.json()

    if (!text) {
      return new NextResponse('Text is required', { status: 400 })
    }

    // Default voice if not provided
    const selectedVoiceId = voiceId || 'pNInz6obpgDQGXPRmrWg' // You can set your preferred default voice ID here

    const audioStream = await elevenlabs.generate({
      voice_id: selectedVoiceId,
      text,
      model_id: "eleven_multilingual_v2", // Or another appropriate model
      output_format: "mp3_22050_32",
    });

    const response = new NextResponse(audioStream as any, {
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
