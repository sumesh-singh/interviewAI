"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { createClient } from "@/lib/supabase/client"
import { googleOAuthService } from "@/lib/auth/google-oauth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Check, X, Loader2 } from "lucide-react"
import AuthLayout from "@/components/auth-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UsernameForm {
  username: string
}

interface UserInfo {
  name: string
  email: string
  picture?: string
}

export default function UsernameSetupPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UsernameForm>()

  const username = watch("username")

  // Load user information
  useEffect(() => {
    loadUserInfo()
  }, [])

  // Check username availability when user types
  useEffect(() => {
    if (username && username.length >= 3) {
      checkUsernameAvailability(username)
    } else {
      setUsernameAvailable(null)
    }
  }, [username])

  const loadUserInfo = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/auth/login')
        return
      }

      // Get user info from session or Google API
      const googleInfo = await googleOAuthService.getGoogleUserInfo()
      
      if (googleInfo) {
        setUserInfo({
          name: googleInfo.name,
          email: googleInfo.email,
          picture: googleInfo.picture
        })
      } else {
        // Fallback to user metadata
        setUserInfo({
          name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          email: user.email || '',
          picture: user.user_metadata?.avatar_url
        })
      }
    } catch (error) {
      console.error('Error loading user info:', error)
      setError('Failed to load user information')
    }
  }

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setIsCheckingUsername(true)
    
    try {
      const { data, error } = await supabase
        .rpc('is_username_available', { requested_username: usernameToCheck })

      if (error) {
        // Print the error as a string and as an object
        console.error('Error checking username:', error, JSON.stringify(error));
        setUsernameAvailable(null);
      } else {
        setUsernameAvailable(data);
      }
    } catch (error) {
      console.error('Error checking username:', error)
      setUsernameAvailable(null)
    } finally {
      setIsCheckingUsername(false)
    }
  }

  const onSubmit = async (data: UsernameForm) => {
    if (!usernameAvailable) {
      setError('Please choose an available username')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Update user profile with username
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ 
          username: data.username,
          full_name: userInfo?.name,
          avatar_url: userInfo?.picture
        })
        .eq('user_id', user.id)

      if (profileError) {
        throw new Error(profileError.message)
      }

      // Get the intended redirect destination
      const redirectTo = searchParams.get('redirectTo') || '/dashboard'
      router.push(redirectTo)
    } catch (error: any) {
      setError(error.message || 'Failed to set username')
    } finally {
      setIsLoading(false)
    }
  }

  const generateUsername = () => {
    if (!userInfo?.name) return ''
    
    // Generate username from name (remove spaces, lowercase, add random number)
    const baseName = userInfo.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 12)
    
    // Use client-side only random number generation to avoid hydration issues
    const randomNum = typeof window !== 'undefined' 
      ? Math.floor(Math.random() * 1000) 
      : 123 // fallback for SSR
    return `${baseName}${randomNum}`
  }

  const handleGenerateUsername = () => {
    const generated = generateUsername()
    if (generated) {
      // Use form's setValue if available, or direct manipulation
      const usernameInput = document.getElementById('username') as HTMLInputElement
      if (usernameInput) {
        usernameInput.value = generated
        usernameInput.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }
  }

  if (!userInfo) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold">Setting up your account</CardTitle>
            <CardDescription>Please wait...</CardDescription>
          </CardHeader>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userInfo.picture} alt={userInfo.name} />
              <AvatarFallback className="text-lg">
                {userInfo.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl font-bold">Choose your username</CardTitle>
          <CardDescription>Welcome, {userInfo.name}! Please choose a username for your account.</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Account connected:</strong> {userInfo.email}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  className="pl-10 pr-10"
                  {...register("username", {
                    required: "Username is required",
                    minLength: {
                      value: 3,
                      message: "Username must be at least 3 characters",
                    },
                    maxLength: {
                      value: 20,
                      message: "Username must be less than 20 characters",
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: "Username can only contain letters, numbers, and underscores",
                    },
                  })}
                />
                
                {/* Username availability indicator */}
                <div className="absolute right-3 top-3 h-4 w-4">
                  {isCheckingUsername ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : usernameAvailable === true ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : usernameAvailable === false ? (
                    <X className="h-4 w-4 text-red-600" />
                  ) : null}
                </div>
              </div>
              
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username.message}</p>
              )}
              
              {usernameAvailable === false && (
                <p className="text-sm text-destructive">This username is already taken</p>
              )}
              
              {usernameAvailable === true && (
                <p className="text-sm text-green-600">This username is available!</p>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateUsername}
              className="w-full"
            >
              Generate Username
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !usernameAvailable || isCheckingUsername}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up account...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </form>

          <div className="pt-4 border-t">
            <div className="space-y-2 text-xs text-muted-foreground">
              <p><strong>Privacy Note:</strong></p>
              <p>We've collected the following information from your Google account with your consent:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Name: {userInfo.name}</li>
                <li>Email: {userInfo.email}</li>
                <li>Profile Picture: {userInfo.picture ? 'Yes' : 'No'}</li>
              </ul>
              <p>This information is used solely for your account setup and can be modified later in your profile settings.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
