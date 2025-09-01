"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, Mail, RefreshCw } from "lucide-react"
import AuthLayout from "@/components/auth-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("")
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [resendError, setResendError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [isVerifying, setIsVerifying] = useState(false)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const success = searchParams.get('success')
  const error = searchParams.get('error')
  const token = searchParams.get('token')

  // Handle automatic verification if token is present in URL
  useEffect(() => {
    if (token && !success && !error) {
      handleTokenVerification(token)
    }
  }, [token, success, error])

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleTokenVerification = async (verificationToken: string) => {
    setIsVerifying(true)
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verificationToken }),
      })

      const data = await response.json()

      if (data.success) {
        router.push('/auth/verify?success=true')
      } else {
        const errorParam = encodeURIComponent(data.error || 'Verification failed')
        router.push(`/auth/verify?error=${errorParam}`)
      }
    } catch (error) {
      console.error('Verification error:', error)
      router.push('/auth/verify?error=verification-failed')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email || countdown > 0) return

    setIsResending(true)
    setResendMessage(null)
    setResendError(null)

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        setResendMessage(data.message)
        setCountdown(120) // 2 minute cooldown
      } else {
        setResendError(data.error || 'Failed to send verification email')
      }
    } catch (error) {
      setResendError('Network error. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'missing-token':
        return 'No verification token provided.'
      case 'user-not-found':
        return 'User not found. Please register first.'
      case 'verification-failed':
        return 'Verification failed. Please try again.'
      case 'internal-error':
        return 'An internal error occurred. Please try again later.'
      default:
        return decodeURIComponent(errorCode)
    }
  }

  if (isVerifying) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold">Verifying Email</CardTitle>
            <CardDescription>
              Please wait while we verify your email address...
            </CardDescription>
          </CardHeader>
        </Card>
      </AuthLayout>
    )
  }

  if (success) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Email Verified!</CardTitle>
            <CardDescription>
              Your email has been successfully verified.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              You can now sign in to your AI Interview Assistant account.
            </p>
            <Button asChild className="w-full">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </AuthLayout>
    )
  }

  if (error) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Verification Failed</CardTitle>
            <CardDescription>
              {getErrorMessage(error)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The verification link may have expired (links expire after 2 minutes) or already been used.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resend-email">Enter your email to resend verification</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="resend-email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {resendMessage && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{resendMessage}</AlertDescription>
                </Alert>
              )}

              {resendError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{resendError}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleResendVerification}
                disabled={!email || isResending || countdown > 0}
                className="w-full"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>

              <div className="flex flex-col gap-2">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/auth/register">Back to Sign Up</Link>
                </Button>
                <Button variant="ghost" asChild className="w-full">
                  <Link href="/auth/login">Already verified? Sign In</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </AuthLayout>
    )
  }

  // Default state - show verification instructions
  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          <CardDescription>
            We've sent you a verification link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Please check your email and click the verification link to activate your account. 
              The link will expire in 2 minutes for security.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resend-email">Need to resend? Enter your email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="resend-email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {resendMessage && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{resendMessage}</AlertDescription>
              </Alert>
            )}

            {resendError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{resendError}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleResendVerification}
              disabled={!email || isResending || countdown > 0}
              className="w-full"
              variant="outline"
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <div className="flex flex-col gap-2">
              <Button variant="ghost" asChild className="w-full">
                <Link href="/auth/login">Already verified? Sign In</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
