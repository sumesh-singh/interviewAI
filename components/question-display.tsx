"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { InterviewQuestion } from "@/types/interview"
import { MessageSquare, Clock, Target } from "lucide-react"

interface QuestionDisplayProps {
  question: InterviewQuestion
  questionNumber: number
  totalQuestions: number
}

export function QuestionDisplay({ question, questionNumber, totalQuestions }: QuestionDisplayProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "behavioral":
        return <MessageSquare className="h-4 w-4" />
      case "technical":
        return <Target className="h-4 w-4" />
      case "situational":
        return <MessageSquare className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Question {questionNumber} of {totalQuestions}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center gap-1">
              {getTypeIcon(question.type)}
              {question.type}
            </Badge>
            <Badge className={getDifficultyColor(question.difficulty)}>{question.difficulty}</Badge>
            {question.timeLimit && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {Math.floor(question.timeLimit / 60)}m
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-lg leading-relaxed">{question.question}</p>

          {question.followUp && question.followUp.length > 0 && (
            <div className="border-l-4 border-blue-200 pl-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Follow-up questions:</p>
              <ul className="space-y-1">
                {question.followUp.map((followUp, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    • {followUp}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
