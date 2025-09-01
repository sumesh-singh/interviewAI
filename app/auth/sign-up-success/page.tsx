import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AuthLayout from "@/components/auth-layout"

export default function SignUpSuccessPage() {
  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Check your email</CardTitle>
          <CardDescription className="text-center">We've sent you a confirmation link</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            Please check your email and click the confirmation link to activate your account. Once confirmed, you can
            sign in to access your AI Interview Assistant dashboard.
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
