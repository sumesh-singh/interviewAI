import { NextRequest, NextResponse } from 'next/server'
import { sessionManager } from '@/lib/session-manager'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const recommendation = sessionManager.getAdaptiveConfig(userId)
    
    return NextResponse.json({
      success: true,
      recommendation
    })
  } catch (error) {
    console.error('Error getting adaptive config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userChoice } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const recommendation = sessionManager.getAdaptiveConfig(userId)
    
    if (!recommendation) {
      return NextResponse.json(
        { error: 'No recommendation available' },
        { status: 404 }
      )
    }

    // Record user choice
    if (userChoice) {
      const { adaptiveDifficultyEngine } = await import('@/lib/adaptive-difficulty-engine')
      adaptiveDifficultyEngine.recordUserChoice(userId, recommendation, userChoice)
    }

    return NextResponse.json({
      success: true,
      recommendation,
      recorded: !!userChoice
    })
  } catch (error) {
    console.error('Error recording user choice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}