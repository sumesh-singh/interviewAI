import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

export interface VerificationToken {
  id: string
  email: string
  token: string
  expires_at: string
  used_at: string | null
  created_at: string
}

export class EmailVerificationService {
  private supabase = createClient()

  /**
   * Generate a new verification token that expires in 2 minutes
   */
  async generateVerificationToken(email: string): Promise<string> {
    const token = nanoid(32)
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000) // 2 minutes from now

    const { error } = await (await this.supabase)
      .from('email_verification_tokens')
      .insert({
        email,
        token,
        expires_at: expiresAt.toISOString(),
      })

    if (error) {
      throw new Error(`Failed to generate verification token: ${error.message}`)
    }

    return token
  }

  /**
   * Verify a token and mark it as used
   */
  async verifyToken(token: string): Promise<{ valid: boolean; email?: string; error?: string }> {
    const { data, error } = await (await this.supabase)
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !data) {
      return { valid: false, error: 'Invalid verification token' }
    }

    // Check if token has expired
    const now = new Date()
    const expiresAt = new Date(data.expires_at)
    
    if (now > expiresAt) {
      return { valid: false, error: 'Verification token has expired' }
    }

    // Check if token has already been used
    if (data.used_at) {
      return { valid: false, error: 'Verification token has already been used' }
    }

    // Mark token as used
    const { error: updateError } = await (await this.supabase)
      .from('email_verification_tokens')
      .update({ used_at: now.toISOString() })
      .eq('token', token)

    if (updateError) {
      return { valid: false, error: 'Failed to verify token' }
    }

    return { valid: true, email: data.email }
  }

  /**
   * Check if there's a pending (unused, unexpired) verification token for an email
   */
  async hasPendingVerification(email: string): Promise<boolean> {
    const { data, error } = await (await this.supabase)
      .from('email_verification_tokens')
      .select('expires_at, used_at')
      .eq('email', email)
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    return !error && data && data.length > 0
  }

  /**
   * Invalidate all existing tokens for an email (useful before creating a new one)
   */
  async invalidateExistingTokens(email: string): Promise<void> {
    await (await this.supabase)
      .from('email_verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('email', email)
      .is('used_at', null)
  }

  /**
   * Send verification email using your preferred email service
   * You'll need to configure this with your email provider (SendGrid, Resend, etc.)
   */
  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify?token=${token}`
    
    // For development, log the verification URL
    if (process.env.NODE_ENV === 'development') {
      console.log(`Verification URL for ${email}: ${verificationUrl}`)
    }

    try {
      // TODO: Replace this with your actual email service
      // Example with fetch to a webhook or email service API:
      
      const emailHtml = this.generateVerificationEmailHtml(email, verificationUrl)
      
      // If you have an email service configured, send the email here
      // Example:
      // const response = await fetch('YOUR_EMAIL_SERVICE_ENDPOINT', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     to: email,
      //     subject: 'Verify your email address',
      //     html: emailHtml
      //   })
      // })
      // return response.ok
      
      // For now, return true and log for development
      console.log('Email would be sent with HTML:', emailHtml)
      return true
    } catch (error) {
      console.error('Failed to send verification email:', error)
      return false
    }
  }

  /**
   * Generate HTML template for verification email
   */
  private generateVerificationEmailHtml(email: string, verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">AI Interview Assistant</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0;">Verify your email address</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #333; margin: 0 0 20px 0;">Welcome to AI Interview Assistant!</h2>
            
            <p>Hi there!</p>
            
            <p>Thank you for signing up for AI Interview Assistant. To complete your registration, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>Important:</strong> This verification link will expire in 2 minutes for security reasons. 
              If the link expires, you can request a new verification email from the sign-up page.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              If the button doesn't work, you can copy and paste this link into your browser:
              <br>
              <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              If you didn't create an account with AI Interview Assistant, you can safely ignore this email.
            </p>
          </div>
        </body>
      </html>
    `
  }
}

export const emailVerificationService = new EmailVerificationService()
