import { NextRequest, NextResponse } from 'next/server'
import { emailVerificationService } from '@/lib/email/email-service'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = verifyEmailSchema.parse(body)

    // Verify the token
    const verificationResult = await emailVerificationService.verifyToken(token)

    if (!verificationResult.valid) {
      return NextResponse.json(
        { error: verificationResult.error || 'Invalid verification token' },
        { status: 400 }
      )
    }

    const { email } = verificationResult

    // Update the user's email confirmation in Supabase auth
    const supabase = await createClient()
    
    // First, check if the user exists
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) {
      console.error('Error fetching users:', userError)
      return NextResponse.json(
        { error: 'Failed to verify email' },
        { status: 500 }
      )
    }

    const user = userData.users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please register first.' },
        { status: 404 }
      )
    }

    // Update user's email confirmation
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    )

    if (updateError) {
      console.error('Error confirming email:', updateError)
      return NextResponse.json(
        { error: 'Failed to confirm email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now sign in.',
      email,
    })
  } catch (error) {
    console.error('Verify email error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also handle GET requests for direct link verification
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(new URL('/auth/verify?error=missing-token', request.url))
    }

    // Verify the token
    const verificationResult = await emailVerificationService.verifyToken(token)

    if (!verificationResult.valid) {
      const errorParam = encodeURIComponent(verificationResult.error || 'Invalid verification token')
      return NextResponse.redirect(new URL(`/auth/verify?error=${errorParam}`, request.url))
    }

    const { email } = verificationResult

    // Update the user's email confirmation in Supabase auth
    const supabase = await createClient()
    
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) {
      console.error('Error fetching users:', userError)
      return NextResponse.redirect(new URL('/auth/verify?error=verification-failed', request.url))
    }

    const user = userData.users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.redirect(new URL('/auth/verify?error=user-not-found', request.url))
    }

    // Update user's email confirmation
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    )

    if (updateError) {
      console.error('Error confirming email:', updateError)
      return NextResponse.redirect(new URL('/auth/verify?error=verification-failed', request.url))
    }

    // Redirect to success page
    return NextResponse.redirect(new URL('/auth/verify?success=true', request.url))
  } catch (error) {
    console.error('Verify email GET error:', error)
    return NextResponse.redirect(new URL('/auth/verify?error=internal-error', request.url))
  }
}
