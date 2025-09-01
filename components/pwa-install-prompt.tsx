"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Download, Smartphone } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if running in standalone mode
    const checkStandalone = () => {
      if (typeof window !== 'undefined') {
        setIsStandalone(
          window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as any).standalone === true
        )
      }
    }

    // Check if iOS
    const checkIOS = () => {
      if (typeof window !== 'undefined') {
        setIsIOS(
          /iPad|iPhone|iPod/.test(navigator.userAgent) ||
          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
        )
      }
    }

    checkStandalone()
    checkIOS()

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Only show prompt if not already installed and not dismissed recently
      const lastDismissed = localStorage.getItem('pwa-install-dismissed')
      const daysSinceLastDismiss = lastDismissed 
        ? (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24)
        : 7

      if (daysSinceLastDismiss > 3) { // Show again after 3 days
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('PWA installation accepted')
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('Error during PWA installation:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // Don't show if already installed or dismissed
  if (isStandalone || !showPrompt) {
    return null
  }

  // iOS-specific install instructions
  if (isIOS && !isStandalone) {
    return (
      <Card className="fixed bottom-4 left-4 right-4 z-50 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Smartphone className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-sm">Install InterviewAI</h3>
                <Badge variant="secondary" className="text-xs">iOS</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Add to your home screen for the best experience
              </p>
              <p className="text-xs text-blue-600">
                Tap the share button <span className="font-mono">⬆</span> and select "Add to Home Screen"
              </p>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleDismiss}
              className="flex-shrink-0 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Standard PWA install prompt
  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Download className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-sm">Install InterviewAI</h3>
              <Badge variant="secondary" className="text-xs">PWA</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Install our app for offline access, faster loading, and a native experience
            </p>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                onClick={handleInstall}
                className="h-7 text-xs bg-green-600 hover:bg-green-700"
              >
                Install App
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleDismiss}
                className="h-7 text-xs"
              >
                Maybe Later
              </Button>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleDismiss}
            className="flex-shrink-0 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
