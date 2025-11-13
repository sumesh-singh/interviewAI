"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Upload, FileJson, FileSpreadsheet, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Question } from "@/types/question-bank"
import { useQuestionBank } from "@/hooks/use-question-banks"

interface QuestionImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bankId: string
  onImported?: () => void
}

export function QuestionImportModal({ open, onOpenChange, bankId, onImported }: QuestionImportModalProps) {
  const { bulkAddQuestions } = useQuestionBank(bankId)
  const [previewData, setPreviewData] = useState<Partial<Question>[]>([])
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, format: "csv" | "json") => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string

        if (format === "json") {
          const parsed = JSON.parse(content)
          const questions = Array.isArray(parsed) ? parsed : [parsed]
          setPreviewData(validateQuestions(questions))
        } else {
          const parsed = parseCSV(content)
          setPreviewData(validateQuestions(parsed))
        }
      } catch (err) {
        setError(`Failed to parse ${format.toUpperCase()} file. Please check the format.`)
        console.error("Parse error:", err)
      }
    }

    reader.readAsText(file)
    event.target.value = ""
  }

  const parseCSV = (content: string): Partial<Question>[] => {
    const lines = content.trim().split("\n")
    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header row and one data row")
    }

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase())
    const questions: Partial<Question>[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim())
      const question: any = {}

      headers.forEach((header, index) => {
        const value = values[index] || ""

        if (header === "question") {
          question.question = value
        } else if (header === "type") {
          question.type = value
        } else if (header === "difficulty") {
          question.difficulty = value
        } else if (header === "follow_up" || header === "followup") {
          question.follow_up = value ? value.split(";").map(f => f.trim()).filter(Boolean) : []
        } else if (header === "tags") {
          question.tags = value ? value.split(";").map(t => t.trim()).filter(Boolean) : []
        } else if (header === "time_limit" || header === "timelimit") {
          question.time_limit = Number.parseInt(value) || 180
        }
      })

      if (question.question) {
        questions.push(question)
      }
    }

    return questions
  }

  const validateQuestions = (questions: any[]): Partial<Question>[] => {
    return questions.map((q) => ({
      question: q.question || "",
      type: ["behavioral", "technical", "situational"].includes(q.type) ? q.type : "behavioral",
      difficulty: ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : "medium",
      follow_up: Array.isArray(q.follow_up) ? q.follow_up : q.followUp ? (Array.isArray(q.followUp) ? q.followUp : []) : [],
      tags: Array.isArray(q.tags) ? q.tags : [],
      time_limit: typeof q.time_limit === "number" ? q.time_limit : (typeof q.timeLimit === "number" ? q.timeLimit : 180),
    }))
  }

  const handleImport = async () => {
    if (previewData.length === 0) return

    setImporting(true)
    try {
      const validQuestions = previewData.filter(q => q.question && q.question.trim().length > 0)
      await bulkAddQuestions(validQuestions as any)
      onImported?.()
      onOpenChange(false)
      setPreviewData([])
    } catch (err) {
      setError("Failed to import questions. Please try again.")
      console.error("Import error:", err)
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = (format: "csv" | "json") => {
    const template = format === "csv"
      ? "question,type,difficulty,follow_up,tags,time_limit\n" +
        '"Tell me about a time...",behavioral,medium,"What did you learn?;How would you improve?","leadership;communication",180\n' +
        '"Explain the difference between...",technical,hard,"Can you give an example?","javascript;fundamentals",240'
      : JSON.stringify([
          {
            question: "Tell me about a time...",
            type: "behavioral",
            difficulty: "medium",
            follow_up: ["What did you learn?", "How would you improve?"],
            tags: ["leadership", "communication"],
            time_limit: 180
          },
          {
            question: "Explain the difference between...",
            type: "technical",
            difficulty: "hard",
            follow_up: ["Can you give an example?"],
            tags: ["javascript", "fundamentals"],
            time_limit: 240
          }
        ], null, 2)

    const blob = new Blob([template], { type: format === "csv" ? "text/csv" : "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `question-template.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Questions</DialogTitle>
          <DialogDescription>
            Upload a CSV or JSON file to bulk import questions into your question bank
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="csv" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="csv">CSV Format</TabsTrigger>
            <TabsTrigger value="json">JSON Format</TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-upload">Upload CSV File</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => document.getElementById("csv-upload")?.click()}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Choose CSV File
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => downloadTemplate("csv")}
                >
                  Download Template
                </Button>
              </div>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "csv")}
              />
              <p className="text-xs text-muted-foreground">
                CSV format: question, type, difficulty, follow_up (semicolon separated), tags (semicolon separated), time_limit
              </p>
            </div>
          </TabsContent>

          <TabsContent value="json" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="json-upload">Upload JSON File</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => document.getElementById("json-upload")?.click()}
                >
                  <FileJson className="w-4 h-4 mr-2" />
                  Choose JSON File
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => downloadTemplate("json")}
                >
                  Download Template
                </Button>
              </div>
              <input
                id="json-upload"
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "json")}
              />
              <p className="text-xs text-muted-foreground">
                JSON array of objects with: question, type, difficulty, follow_up, tags, time_limit
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {previewData.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Preview ({previewData.length} questions)</h3>
            <div className="border rounded-lg max-h-[300px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Tags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 10).map((q, index) => (
                    <TableRow key={index}>
                      <TableCell className="max-w-xs truncate">{q.question}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{q.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{q.difficulty}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {q.tags?.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {q.tags && q.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{q.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {previewData.length > 10 && (
              <p className="text-sm text-muted-foreground">
                Showing 10 of {previewData.length} questions
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={previewData.length === 0 || importing}
          >
            {importing ? "Importing..." : `Import ${previewData.length} Questions`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
