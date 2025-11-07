import { NextRequest, NextResponse } from 'next/server'
import { emailVerificationService } from '@/lib/email/email-service'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const sendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = sendVerificationSchema.parse(body)

    // Check if there's already a pending verification for this email
    const hasPending = await emailVerificationService.hasPendingVerification(email)
    if (hasPending) {
      return NextResponse.json(
        { error: 'A verification email was already sent recently. Please wait before requesting another.' },
        { status: 429 }
      )
    }

    // Check if user already exists and is verified
    const supabase = createClient()
    const { data: user } = await supabase
      .from('auth.users')
      .select('email_confirmed_at')
      .eq('email', email)
      .single()

    if (user?.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Email is already verified. You can sign in directly.' },
        { status: 400 }
      )
    }

    // Invalidate any existing tokens for this email
    await emailVerificationService.invalidateExistingTokens(email)

    // Generate new verification token
    const token = await emailVerificationService.generateVerificationToken(email)

    // Send verification email
    const emailSent = await emailVerificationService.sendVerificationEmail(email, token)

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully. Please check your inbox.',
    })
  } catch (error) {
    console.error('Send verification error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
