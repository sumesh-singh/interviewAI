"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ProfileData } from "@/types/dashboard"

interface ProfileStepFormProps {
  step: number
  data: Partial<ProfileData>
  onNext: (stepData: any) => void
  onBack: () => void
  isFirstStep: boolean
  isLastStep: boolean
}

export default function ProfileStepForm({ step, data, onNext, onBack, isFirstStep, isLastStep }: ProfileStepFormProps) {
  const [stepData, setStepData] = useState<any>({})

  useEffect(() => {
    // Initialize step data based on current step
    switch (step) {
      case 0:
        setStepData(data.basicInfo || {})
        break
      case 1:
        setStepData(data.background || {})
        break
      case 2:
        setStepData(data.preferences || {})
        break
      case 3:
        setStepData(data.goals || {})
        break
    }
  }, [step, data])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext(stepData)
  }

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={stepData.name || ""}
                onChange={(e) => setStepData({ ...stepData, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="experienceLevel">Experience Level</Label>
              <select
                id="experienceLevel"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={stepData.experienceLevel || ""}
                onChange={(e) => setStepData({ ...stepData, experienceLevel: e.target.value })}
              >
                <option value="">Select experience level</option>
                <option value="entry">Entry Level (0-2 years)</option>
                <option value="mid">Mid Level (3-5 years)</option>
                <option value="senior">Senior Level (6-10 years)</option>
                <option value="executive">Executive (10+ years)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="targetRole">Target Role</Label>
              <Input
                id="targetRole"
                value={stepData.targetRole || ""}
                onChange={(e) => setStepData({ ...stepData, targetRole: e.target.value })}
                placeholder="e.g., Software Engineer, Product Manager"
              />
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={stepData.industry || ""}
                onChange={(e) => setStepData({ ...stepData, industry: e.target.value })}
                placeholder="e.g., Technology, Finance, Healthcare"
              />
            </div>
            <div>
              <Label htmlFor="currentRole">Current Role</Label>
              <Input
                id="currentRole"
                value={stepData.currentRole || ""}
                onChange={(e) => setStepData({ ...stepData, currentRole: e.target.value })}
                placeholder="Your current job title"
              />
            </div>
            <div>
              <Label htmlFor="yearsExperience">Years of Experience</Label>
              <Input
                id="yearsExperience"
                type="number"
                value={stepData.yearsExperience || ""}
                onChange={(e) => setStepData({ ...stepData, yearsExperience: Number.parseInt(e.target.value) })}
                placeholder="Total years of professional experience"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label>Interview Types (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {["Technical", "Behavioral", "System Design", "Case Study", "Presentation", "Panel"].map((type) => (
                  <label key={type} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={stepData.interviewTypes?.includes(type) || false}
                      onChange={(e) => {
                        const types = stepData.interviewTypes || []
                        if (e.target.checked) {
                          setStepData({ ...stepData, interviewTypes: [...types, type] })
                        } else {
                          setStepData({ ...stepData, interviewTypes: types.filter((t: string) => t !== type) })
                        }
                      }}
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <select
                id="difficulty"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={stepData.difficulty || ""}
                onChange={(e) => setStepData({ ...stepData, difficulty: e.target.value })}
              >
                <option value="">Select difficulty</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="improvements">What would you like to improve?</Label>
              <Textarea
                id="improvements"
                value={stepData.improvements?.join(", ") || ""}
                onChange={(e) => setStepData({ ...stepData, improvements: e.target.value.split(", ") })}
                placeholder="e.g., Communication skills, Technical knowledge, Confidence"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="targetCompanies">Target Companies</Label>
              <Textarea
                id="targetCompanies"
                value={stepData.targetCompanies?.join(", ") || ""}
                onChange={(e) => setStepData({ ...stepData, targetCompanies: e.target.value.split(", ") })}
                placeholder="e.g., Google, Microsoft, Apple"
                rows={3}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {renderStepContent()}

      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={onBack} disabled={isFirstStep}>
          Back
        </Button>
        <Button type="submit">{isLastStep ? "Complete Setup" : "Next"}</Button>
      </div>
    </form>
  )
}
