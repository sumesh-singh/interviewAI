"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"
import AuthLayout from "@/components/auth-layout"

export default function SignUpSuccessPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the new verification page
    router.replace("/auth/verify")
  }, [router])

  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
          </div>
          <CardTitle className="text-2xl font-bold">Redirecting...</CardTitle>
          <CardDescription>Taking you to the verification page</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            Please wait while we redirect you to the email verification page.
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
