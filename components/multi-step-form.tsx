"use client"

import { useState } from "react"
import ProgressIndicator from "./progress-indicator"
import ProfileStepForm from "./profile-step-form"
import type { ProfileData } from "@/types/dashboard"

const stepLabels = ["Basic Info", "Background", "Preferences", "Goals"]

export default function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Partial<ProfileData>>({})

  const handleNext = (stepData: any) => {
    const updatedData = { ...formData }

    switch (currentStep) {
      case 0:
        updatedData.basicInfo = stepData
        break
      case 1:
        updatedData.background = stepData
        break
      case 2:
        updatedData.preferences = stepData
        break
      case 3:
        updatedData.goals = stepData
        break
    }

    setFormData(updatedData)

    if (currentStep < stepLabels.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Handle form completion
      console.log("Profile setup complete:", updatedData)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
      <p className="text-gray-600 mb-8">Help us personalize your interview preparation experience.</p>

      <ProgressIndicator currentStep={currentStep} totalSteps={stepLabels.length} stepLabels={stepLabels} />

      <ProfileStepForm
        step={currentStep}
        data={formData}
        onNext={handleNext}
        onBack={handleBack}
        isFirstStep={currentStep === 0}
        isLastStep={currentStep === stepLabels.length - 1}
      />
    </div>
  )
}
