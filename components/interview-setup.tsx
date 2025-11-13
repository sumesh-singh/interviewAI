"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Target, Play, Sparkles } from "lucide-react"
import { TemplateBrowser } from "./template-browser"
import { interviewTemplates, getTemplatesByIndustry } from "@/data/interview-templates"
import { industries, getIndustryById } from "@/data/industries"
import type { InterviewTemplate } from "@/data/interview-templates"

interface InterviewSetupProps {
  onStartInterview: (config: {
    type: "behavioral" | "technical" | "mixed"
    duration: number
    difficulty: "easy" | "medium" | "hard"
    questionBankId?: string
  }) => void
  onStartTemplate?: (template: InterviewTemplate) => void
}

export function InterviewSetup({ onStartInterview, onStartTemplate }: InterviewSetupProps) {
  const [type, setType] = useState<"behavioral" | "technical" | "mixed">("mixed")
  const [duration, setDuration] = useState<number>(30)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [questionBankId, setQuestionBankId] = useState<string>("")
  const { questionBanks, loading } = useQuestionBanks()
  const [showTemplates, setShowTemplates] = useState(false)

  const handleStart = () => {
    onStartInterview({ 
      type, 
      duration, 
      difficulty,
      questionBankId: questionBankId || undefined
    })
  }

  const handleSelectTemplate = (template: InterviewTemplate) => {
    if (onStartTemplate) {
      onStartTemplate(template)
    }
  }

  const handleCustomSetup = (config: {
    type: "behavioral" | "technical" | "mixed"
    duration: number
    difficulty: "easy" | "medium" | "hard"
  }) => {
    setType(config.type)
    setDuration(config.duration)
    setDifficulty(config.difficulty)
    setShowTemplates(false)
  }

  // Get recommended templates based on user preferences
  const recommendedTemplates = interviewTemplates
    .filter(template => template.difficulty === difficulty)
    .slice(0, 3)

  const industryTemplates = industries.slice(0, 4).map(industry => {
    const templates = getTemplatesByIndustry(industry.id)
    return {
      industry,
      template: templates.length > 0 ? templates[0] : null
    }
  }).filter(item => item.template !== null)

  if (showTemplates) {
    return (
      <TemplateBrowser 
        onSelectTemplate={handleSelectTemplate}
        onStartCustom={handleCustomSetup}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Interview Practice</h1>
        <p className="text-muted-foreground">Choose your practice approach</p>
      </div>

      {/* Industry Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Industry-Specific Templates
          </CardTitle>
          <CardDescription>
            Curated interview templates tailored to specific industries and roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {industryTemplates.map(({ industry, template }) => (
              <Card key={industry.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="text-center space-y-2">
                    <div className="text-2xl">{industry.icon}</div>
                    <h3 className="font-semibold">{industry.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {template?.role}
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => template && handleSelectTemplate(template)}
                    >
                      Start Practice
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              onClick={() => setShowTemplates(true)}
            >
              Browse All Templates
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Templates */}
      {recommendedTemplates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Recommended for {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level
            </CardTitle>
            <CardDescription>
              Templates matching your selected difficulty level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendedTemplates.map(template => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">{template.name}</h3>
                      <p className="text-xs text-muted-foreground overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {template.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{template.duration} min</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSelectTemplate(template)}
                        >
                          Start
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Setup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Custom Session
          </CardTitle>
          <CardDescription>Configure your own practice interview session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Interview Type</label>
              <Select value={type} onValueChange={(value: any) => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Duration</label>
              <Select value={duration.toString()} onValueChange={(value) => setDuration(Number.parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty</label>
              <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleStart} className="w-full" size="lg">
            <Play className="h-5 w-5 mr-2" />
            Start Custom Session
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Question Bank (Optional)
          </CardTitle>
          <CardDescription>
            Use questions from your custom question bank
            {!loading && questionBanks.length === 0 && (
              <span className="block mt-1">
                <Link href="/dashboard/questions" className="text-purple-600 hover:underline">
                  Create your first question bank →
                </Link>
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={questionBankId} onValueChange={setQuestionBankId} disabled={loading || questionBanks.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder="Use AI-generated questions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Use AI-generated questions</SelectItem>
              {questionBanks.map((bank) => (
                <SelectItem key={bank.id} value={bank.id}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Button onClick={handleStart} className="w-full" size="lg">
        <Play className="h-5 w-5 mr-2" />
        Start Interview Session
      </Button>
    </div>
  )
}
