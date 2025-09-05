"use client"

import { useState, useEffect } from 'react'

export function useOffline() {
  const [isOffline, setIsOffline] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Set client-side flag
    setIsClient(true)

    // Check initial online status only on client
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine)
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [])

  // Only return offline status when on client-side
  return isClient && isOffline
}
