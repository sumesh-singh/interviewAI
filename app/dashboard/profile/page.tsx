import ProtectedRoute from "@/components/protected-route"
import DashboardLayout from "@/components/dashboard-layout"
import MultiStepForm from "@/components/multi-step-form"

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <MultiStepForm />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
