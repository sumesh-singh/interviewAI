import ProtectedRoute from "@/components/protected-route"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { PlayCircle, Clock, Users, Brain } from "lucide-react"

export default function PracticePage() {
  const practiceTypes = [
    {
      title: "Technical Interview",
      description: "Practice coding problems and technical questions",
      duration: "30-60 min",
      difficulty: "Intermediate",
      icon: Brain,
    },
    {
      title: "Behavioral Interview",
      description: "Work on storytelling and soft skills",
      duration: "20-40 min",
      difficulty: "Beginner",
      icon: Users,
    },
    {
      title: "System Design",
      description: "Design scalable systems and architectures",
      duration: "45-90 min",
      difficulty: "Advanced",
      icon: Clock,
    },
  ]

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Practice Interviews</h1>
            <p className="text-gray-600">Choose an interview type to start practicing</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {practiceTypes.map((type, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <type.icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{type.title}</h3>
                    <p className="text-sm text-gray-500">{type.difficulty}</p>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{type.description}</p>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{type.duration}</span>
                  <Button size="sm">
                    <PlayCircle className="w-4 h-4 mr-1" />
                    Start
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
