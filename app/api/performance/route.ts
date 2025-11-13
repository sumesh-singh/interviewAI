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

    const performanceSummary = sessionManager.getUserPerformanceSummary(userId)
    const accuracy = sessionManager.getRecommendationAccuracy(userId)
    
    return NextResponse.json({
      success: true,
      performanceSummary,
      recommendationAccuracy: accuracy
    })
  } catch (error) {
    console.error('Error getting performance data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, sessionId, role } = body

    if (!userId || !sessionId) {
      return NextResponse.json(
        { error: 'userId and sessionId are required' },
        { status: 400 }
      )
    }

    const result = sessionManager.completeSession(userId, sessionId, role)
    
    if (!result) {
      return NextResponse.json(
        { error: 'Session not found or could not be completed' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      detailedScore: result.detailedScore,
      sessionStats: result.sessionStats
    })
  } catch (error) {
    console.error('Error completing session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}