"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import type { Question } from "@/types/question-bank"
import { useQuestionBank } from "@/hooks/use-question-banks"

interface QuestionEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bankId: string
  question?: Question
  onSave?: () => void
}

export function QuestionEditor({ open, onOpenChange, bankId, question, onSave }: QuestionEditorProps) {
  const { addQuestion, updateQuestion } = useQuestionBank(bankId)
  const [formData, setFormData] = useState({
    type: "behavioral" as "behavioral" | "technical" | "situational",
    difficulty: "medium" as "easy" | "medium" | "hard",
    question: "",
    timeLimit: 180,
  })
  const [followUps, setFollowUps] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [currentFollowUp, setCurrentFollowUp] = useState("")
  const [currentTag, setCurrentTag] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (question) {
      setFormData({
        type: question.type,
        difficulty: question.difficulty,
        question: question.question,
        timeLimit: question.time_limit || 180,
      })
      setFollowUps(question.follow_up || [])
      setTags(question.tags || [])
    } else {
      setFormData({
        type: "behavioral",
        difficulty: "medium",
        question: "",
        timeLimit: 180,
      })
      setFollowUps([])
      setTags([])
    }
  }, [question, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const questionData = {
        type: formData.type,
        difficulty: formData.difficulty,
        question: formData.question,
        follow_up: followUps.length > 0 ? followUps : undefined,
        tags: tags.length > 0 ? tags : undefined,
        time_limit: formData.timeLimit,
      }

      if (question) {
        await updateQuestion(question.id, questionData)
      } else {
        await addQuestion(questionData)
      }

      onSave?.()
      onOpenChange(false)
    } catch (err) {
      console.error("Error saving question:", err)
    } finally {
      setSaving(false)
    }
  }

  const addFollowUp = () => {
    if (currentFollowUp.trim()) {
      setFollowUps([...followUps, currentFollowUp.trim()])
      setCurrentFollowUp("")
    }
  }

  const removeFollowUp = (index: number) => {
    setFollowUps(followUps.filter((_, i) => i !== index))
  }

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()])
      setCurrentTag("")
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{question ? "Edit Question" : "Add Question"}</DialogTitle>
          <DialogDescription>
            {question ? "Update the question details below" : "Create a new interview question"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="situational">Situational</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
              >
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

          <div className="space-y-2">
            <Label htmlFor="question">Question *</Label>
            <Textarea
              id="question"
              placeholder="Enter your interview question..."
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              required
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
            <Input
              id="timeLimit"
              type="number"
              min="30"
              max="600"
              value={formData.timeLimit}
              onChange={(e) => setFormData({ ...formData, timeLimit: Number.parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label>Follow-up Questions</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a follow-up question..."
                value={currentFollowUp}
                onChange={(e) => setCurrentFollowUp(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addFollowUp()
                  }
                }}
              />
              <Button type="button" onClick={addFollowUp} size="icon" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {followUps.length > 0 && (
              <div className="space-y-2 mt-2">
                {followUps.map((followUp, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1 text-sm">{followUp}</span>
                    <Button
                      type="button"
                      onClick={() => removeFollowUp(index)}
                      size="icon"
                      variant="ghost"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button type="button" onClick={addTag} size="icon" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !formData.question.trim()}>
              {saving ? "Saving..." : question ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
