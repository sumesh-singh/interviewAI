import { createClient } from '@/lib/supabase/client'

export interface GoogleUserProfile {
  id: string
  email: string
  name: string
  picture: string
  given_name: string
  family_name: string
  email_verified: boolean
}

export class GoogleOAuthService {
  private supabase = createClient()

  /**
   * Initiate Google OAuth sign-in flow
   * Requests access to basic profile information and email
   */
  async signInWithGoogle(redirectTo?: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo || `${window.location.origin}/auth/callback?provider=google`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'openid email profile', // Only request essential information
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      return { success: true, data }
    } catch (error) {
      console.error('Google OAuth error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to initiate Google authentication'
      }
    }
  }

  /**
   * Sign up with Google OAuth
   */
  async signUpWithGoogle() {
    return this.signInWithGoogle(`${window.location.origin}/auth/callback?provider=google&flow=signup`)
  }

  /**
   * Check if user needs to set a username after Google OAuth
   */
  async needsUsernameSetup(userId: string): Promise<boolean> {
    try {
      const { data: profile, error } = await this.supabase
        .from('user_profiles')
        .select('username')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking username:', error)
        return true // Assume needs setup if we can't check
      }

      return !profile?.username
    } catch (error) {
      console.error('Error checking username setup:', error)
      return true
    }
  }

  /**
   * Get the Google user information from the current session
   */
  async getGoogleUserInfo(): Promise<GoogleUserProfile | null> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession()
      
      if (error || !session?.provider_token) {
        return null
      }

      // Use the provider token to get additional user info from Google
      const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${session.provider_token}`)
      
      if (!response.ok) {
        return null
      }

      const userInfo = await response.json()
      return userInfo as GoogleUserProfile
    } catch (error) {
      console.error('Error fetching Google user info:', error)
      return null
    }
  }

  /**
   * Get user permissions granted during OAuth
   */
  getRequestedPermissions(): string[] {
    return [
      'View your basic profile info (name, profile picture)',
      'Access your email address',
      'Verify your email address'
    ]
  }

  /**
   * Get privacy information about Google OAuth integration
   */
  getPrivacyInfo() {
    return {
      dataCollected: [
        'Email address (for account identification)',
        'Full name (for personalization)',
        'Profile picture (optional, for avatar)',
        'Google account ID (for account linking)'
      ],
      dataUsage: [
        'Create and manage your account',
        'Personalize your experience',
        'Send important account notifications',
        'Provide customer support when needed'
      ],
      dataSharing: [
        'We do not share your Google data with third parties',
        'Data is stored securely in our database',
        'You can delete your account and data at any time'
      ]
    }
  }
}

export const googleOAuthService = new GoogleOAuthService()
