import { createClient } from "@/lib/supabase/server"
import { emailVerificationService } from "@/lib/email/email-service"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const token = searchParams.get("token") // Custom verification token
  const provider = searchParams.get("provider")
  const flow = searchParams.get("flow")
  const next = searchParams.get("next") ?? "/dashboard"

  // Handle custom email verification token
  if (token) {
    try {
      const verificationResult = await emailVerificationService.verifyToken(token)
      
      if (verificationResult.valid && verificationResult.email) {
        const supabase = await createClient()
        
        // Get user by email and confirm their email
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
        
        if (!userError && userData) {
          const user = userData.users.find(u => u.email === verificationResult.email)
          
          if (user) {
            // Update user's email confirmation
            await supabase.auth.admin.updateUserById(user.id, { email_confirm: true })
            
            // Redirect to verification success page
            return NextResponse.redirect(`${origin}/auth/verify?success=true`)
          }
        }
      }
      
      // If verification failed, redirect with error
      const errorParam = encodeURIComponent(verificationResult.error || 'Verification failed')
      return NextResponse.redirect(`${origin}/auth/verify?error=${errorParam}`)
    } catch (error) {
      console.error('Custom verification error:', error)
      return NextResponse.redirect(`${origin}/auth/verify?error=verification-failed`)
    }
  }

  // Handle standard Supabase auth code exchange
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // For Google OAuth signup flow, check if user needs username setup
      if (provider === 'google' && flow === 'signup') {
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          
          if (!userError && user) {
            // Check if user profile exists and has username
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('username')
              .eq('user_id', user.id)
              .single()
            
            // If no profile exists or no username, redirect to username setup
            if (profileError || !profile?.username) {
              const redirectUrl = new URL('/auth/username-setup', origin)
              redirectUrl.searchParams.set('redirectTo', next)
              return NextResponse.redirect(redirectUrl.toString())
            }
          }
        } catch (error) {
          console.error('Error checking user profile:', error)
          // Continue to default redirect if profile check fails
        }
      }
      
      const forwardedHost = request.headers.get("x-forwarded-host") // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development"
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
