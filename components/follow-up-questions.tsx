"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, Brain, MessageSquare, Lightbulb } from "lucide-react"
import { openAIService } from "@/lib/openai"
import { LoadingSpinner } from "@/components/loading-spinner"
import type { InterviewQuestion } from "@/types/interview"

interface FollowUpQuestionsProps {
  originalQuestion: InterviewQuestion
  userResponse: string
  role: string
  onFollowUpComplete?: (question: string, response: string) => void
  isActive: boolean
}

export function FollowUpQuestions({ 
  originalQuestion, 
  userResponse, 
  role, 
  onFollowUpComplete,
  isActive 
}: FollowUpQuestionsProps) {
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([])
  const [selectedFollowUp, setSelectedFollowUp] = useState<string | null>(null)
  const [followUpResponse, setFollowUpResponse] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualQuestion, setManualQuestion] = useState("")

  useEffect(() => {
    if (userResponse && userResponse.length > 20) {
      generateFollowUpQuestions()
    }
  }, [userResponse, originalQuestion.question, role])

  const generateFollowUpQuestions = async () => {
    if (!navigator.onLine) {
      // Use predefined follow-up questions when offline
      setFollowUpQuestions(originalQuestion.followUp || [])
      return
    }

    setIsGenerating(true)
    try {
      // Generate multiple follow-up questions
      const followUpPromises = Array(3).fill(0).map(() =>
        openAIService.generateFollowUp(originalQuestion.question, userResponse, role)
      )

      const generatedQuestions = await Promise.all(followUpPromises)
      const uniqueQuestions = Array.from(new Set(
        [...generatedQuestions.filter(q => q.length > 0), ...(originalQuestion.followUp || [])]
      )).slice(0, 4)

      setFollowUpQuestions(uniqueQuestions)
    } catch (error) {
      console.error('Failed to generate follow-up questions:', error)
      // Fallback to predefined follow-up questions
      setFollowUpQuestions(originalQuestion.followUp || [])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFollowUpSelection = (question: string) => {
    setSelectedFollowUp(question)
    setFollowUpResponse("")
  }

  const handleResponseSubmit = () => {
    if (selectedFollowUp && followUpResponse.trim()) {
      onFollowUpComplete?.(selectedFollowUp, followUpResponse.trim())
      // Reset for next follow-up
      setSelectedFollowUp(null)
      setFollowUpResponse("")
    }
  }

  const handleManualQuestionSubmit = () => {
    if (manualQuestion.trim()) {
      setSelectedFollowUp(manualQuestion.trim())
      setManualQuestion("")
      setShowManualInput(false)
    }
  }

  const getQuestionTypeIcon = (question: string) => {
    const lowerQ = question.toLowerCase()
    if (lowerQ.includes('example') || lowerQ.includes('experience')) {
      return <MessageSquare className="h-4 w-4" />
    }
    if (lowerQ.includes('how') || lowerQ.includes('what') || lowerQ.includes('why')) {
      return <Brain className="h-4 w-4" />
    }
    return <Lightbulb className="h-4 w-4" />
  }

  const getQuestionCategory = (question: string) => {
    const lowerQ = question.toLowerCase()
    if (lowerQ.includes('example') || lowerQ.includes('tell me about')) {
      return 'Behavioral'
    }
    if (lowerQ.includes('how would you') || lowerQ.includes('what would you do')) {
      return 'Situational'
    }
    if (lowerQ.includes('explain') || lowerQ.includes('describe how')) {
      return 'Technical'
    }
    return 'Clarification'
  }

  return (
    <div className="space-y-4">
      {/* Follow-up Questions Generation */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <span>Follow-up Questions</span>
            {isGenerating && <LoadingSpinner size="sm" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isGenerating ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Generating personalized follow-up questions based on your response...
              </p>
            </div>
          ) : followUpQuestions.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Based on your previous response, here are some follow-up questions:
              </p>
              
              <div className="grid gap-2">
                {followUpQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant={selectedFollowUp === question ? "default" : "outline"}
                    onClick={() => handleFollowUpSelection(question)}
                    disabled={!isActive}
                    className="justify-start text-left h-auto p-3 whitespace-normal"
                  >
                    <div className="flex items-start space-x-2 w-full">
                      {getQuestionTypeIcon(question)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {getQuestionCategory(question)}
                          </Badge>
                        </div>
                        <p className="text-sm">{question}</p>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>

              {/* Manual Question Input */}
              <div className="pt-2 border-t">
                {!showManualInput ? (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowManualInput(true)}
                    className="text-xs"
                  >
                    + Add custom follow-up question
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Enter your own follow-up question..."
                      value={manualQuestion}
                      onChange={(e) => setManualQuestion(e.target.value)}
                      className="min-h-[60px] text-sm"
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={handleManualQuestionSubmit}>
                        Use Question
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setShowManualInput(false)
                          setManualQuestion("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Complete your response to the main question to see follow-up questions.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Follow-up Response */}
      {selectedFollowUp && (
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ArrowRight className="h-5 w-5 text-green-600" />
              <span>Follow-up Response</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-white rounded-lg border">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {getQuestionCategory(selectedFollowUp)}
                </Badge>
              </div>
              <p className="text-sm font-medium">{selectedFollowUp}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Your Response:</label>
              <Textarea
                placeholder="Provide your response to the follow-up question..."
                value={followUpResponse}
                onChange={(e) => setFollowUpResponse(e.target.value)}
                className="min-h-[120px]"
                disabled={!isActive}
              />
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={handleResponseSubmit}
                disabled={!followUpResponse.trim() || !isActive}
                className="flex-1"
              >
                Submit Response
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => setSelectedFollowUp(null)}
              >
                Skip
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Follow-up Question Manager - tracks all follow-ups in a session
interface FollowUpManagerProps {
  sessionId: string
}

export function FollowUpManager({ sessionId }: FollowUpManagerProps) {
  const [followUps, setFollowUps] = useState<Array<{
    originalQuestion: string
    originalResponse: string
    followUpQuestion: string
    followUpResponse: string
    timestamp: Date
  }>>([])

  useEffect(() => {
    loadFollowUps()
  }, [sessionId])

  const loadFollowUps = () => {
    try {
      const stored = localStorage.getItem(`follow-ups-${sessionId}`)
      if (stored) {
        setFollowUps(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load follow-ups:', error)
    }
  }

  const addFollowUp = (
    originalQuestion: string,
    originalResponse: string,
    followUpQuestion: string,
    followUpResponse: string
  ) => {
    const newFollowUp = {
      originalQuestion,
      originalResponse,
      followUpQuestion,
      followUpResponse,
      timestamp: new Date()
    }

    const updated = [...followUps, newFollowUp]
    setFollowUps(updated)

    try {
      localStorage.setItem(`follow-ups-${sessionId}`, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save follow-up:', error)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Follow-up History</span>
            <Badge variant="outline">{followUps.length}</Badge>
          </CardTitle>
        </CardHeader>
        {followUps.length > 0 && (
          <CardContent className="space-y-4">
            {followUps.map((followUp, index) => (
              <div key={index} className="p-3 border rounded-lg space-y-2">
                <div className="text-xs text-muted-foreground">
                  {followUp.timestamp.toLocaleString()}
                </div>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Original Q:</p>
                    <p className="text-sm">{followUp.originalQuestion}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-green-700">Follow-up Q:</p>
                    <p className="text-sm">{followUp.followUpQuestion}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-purple-700">Response:</p>
                    <p className="text-sm text-muted-foreground">{followUp.followUpResponse}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  )
}

// Smart Follow-up Suggestions based on response analysis
interface SmartFollowUpProps {
  response: string
  questionType: 'behavioral' | 'technical' | 'situational'
  onSuggestionSelect: (question: string) => void
}

export function SmartFollowUpSuggestions({ 
  response, 
  questionType, 
  onSuggestionSelect 
}: SmartFollowUpProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    generateSmartSuggestions()
  }, [response, questionType])

  const generateSmartSuggestions = () => {
    const responseText = response.toLowerCase()
    const suggestions: string[] = []

    // Behavioral question follow-ups
    if (questionType === 'behavioral') {
      if (responseText.includes('challenge') || responseText.includes('difficult')) {
        suggestions.push("What did you learn from this experience?")
        suggestions.push("How would you handle a similar situation differently now?")
      }
      if (responseText.includes('team') || responseText.includes('collaborate')) {
        suggestions.push("How did you handle any conflicts within the team?")
        suggestions.push("What role did you typically play in team dynamics?")
      }
      if (responseText.includes('project') || responseText.includes('worked on')) {
        suggestions.push("What was the most challenging aspect of this project?")
        suggestions.push("How did you measure the success of this project?")
      }
    }

    // Technical question follow-ups
    if (questionType === 'technical') {
      if (responseText.includes('algorithm') || responseText.includes('solution')) {
        suggestions.push("What is the time complexity of your solution?")
        suggestions.push("How would you optimize this further?")
      }
      if (responseText.includes('database') || responseText.includes('data')) {
        suggestions.push("How would you handle scaling this for larger datasets?")
        suggestions.push("What indexing strategies would you consider?")
      }
      if (responseText.includes('api') || responseText.includes('service')) {
        suggestions.push("How would you handle error scenarios?")
        suggestions.push("What security considerations would you implement?")
      }
    }

    // Situational question follow-ups
    if (questionType === 'situational') {
      if (responseText.includes('approach') || responseText.includes('strategy')) {
        suggestions.push("What potential risks do you see with this approach?")
        suggestions.push("How would you modify this strategy if resources were limited?")
      }
      if (responseText.includes('decision') || responseText.includes('choose')) {
        suggestions.push("What factors were most important in your decision-making?")
        suggestions.push("How would you communicate this decision to stakeholders?")
      }
    }

    // Generic follow-ups based on response characteristics
    if (responseText.length < 100) {
      suggestions.push("Can you provide a specific example to illustrate your point?")
    }
    if (!responseText.includes('example') && !responseText.includes('instance')) {
      suggestions.push("Do you have a concrete example from your experience?")
    }
    if (responseText.includes('i think') || responseText.includes('i believe')) {
      suggestions.push("What evidence or experience supports this belief?")
    }

    setSuggestions(suggestions.slice(0, 3)) // Limit to top 3
  }

  if (suggestions.length === 0) return null

  return (
    <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Lightbulb className="h-4 w-4 text-indigo-600" />
          <span>Smart Suggestions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Based on your response, you might want to explore:
        </p>
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={() => onSuggestionSelect(suggestion)}
            className="justify-start text-left h-auto p-2 text-xs whitespace-normal w-full"
          >
            {suggestion}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
