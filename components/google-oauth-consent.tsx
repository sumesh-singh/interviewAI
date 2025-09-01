"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, Eye, User, Mail, AlertCircle } from "lucide-react"
import { googleOAuthService } from "@/lib/auth/google-oauth"

interface GoogleOAuthConsentProps {
  children: React.ReactNode
  onProceed: () => void
  type?: 'signup' | 'login'
}

export default function GoogleOAuthConsent({ children, onProceed, type = 'signup' }: GoogleOAuthConsentProps) {
  const [open, setOpen] = useState(false)
  const [hasConsented, setHasConsented] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const permissions = googleOAuthService.getRequestedPermissions()
  const privacyInfo = googleOAuthService.getPrivacyInfo()

  const handleProceed = async () => {
    if (!hasConsented) return

    setIsLoading(true)
    try {
      await onProceed()
      setOpen(false)
    } catch (error) {
      console.error('OAuth error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Connect with Google
          </DialogTitle>
          <DialogDescription>
            {type === 'signup' 
              ? 'Create your account using your Google account with your permission.'
              : 'Sign in to your account using your Google account.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* What we'll access */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              What we'll access from your Google account:
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {permissions.map((permission, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                  {permission}
                </li>
              ))}
            </ul>
          </div>

          {/* How we'll use the data */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              How we'll use this information:
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {privacyInfo.dataUsage.map((usage, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                  {usage}
                </li>
              ))}
            </ul>
          </div>

          {/* Privacy assurance */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Mail className="h-4 w-4" />
              Your privacy matters
            </h4>
            <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
              {privacyInfo.dataSharing.map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="h-1 w-1 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Additional note for signup */}
          {type === 'signup' && (
            <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    After connecting with Google
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    You'll be asked to choose a unique username for your AI Interview Assistant account. 
                    Your Google information will be used to pre-fill your profile.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Consent checkbox */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="consent"
              checked={hasConsented}
              onCheckedChange={(checked) => setHasConsented(checked as boolean)}
            />
            <Label htmlFor="consent" className="text-sm leading-relaxed">
              I understand and consent to AI Interview Assistant accessing my Google account information 
              as described above. I can revoke this access at any time through my Google account settings.
            </Label>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProceed}
              disabled={!hasConsented || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Fix Label import
import { Label } from "@/components/ui/label"
