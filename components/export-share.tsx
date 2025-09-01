"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Download, 
  Share2, 
  Mail, 
  FileText, 
  Code2, 
  Copy, 
  Link,
  CheckCircle,
  ExternalLink
} from "lucide-react"
import { sessionManager } from "@/lib/session-manager"
import { scoringSystem } from "@/lib/scoring-system"
import type { StoredSession } from "@/lib/offline-storage"
import type { DetailedScore } from "@/lib/scoring-system"

interface ExportShareProps {
  sessionId: string
  sessionData: StoredSession
  detailedScore?: DetailedScore
}

export function ExportShare({ sessionId, sessionData, detailedScore }: ExportShareProps) {
  const [activeTab, setActiveTab] = useState("export")
  const [shareEmail, setShareEmail] = useState("")
  const [shareMessage, setShareMessage] = useState("")
  const [exportFormat, setExportFormat] = useState<"json" | "pdf" | "markdown">("json")
  const [isExporting, setIsExporting] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const exportData = {
    session: sessionData.session,
    responses: sessionData.responses,
    score: detailedScore,
    exportedAt: new Date().toISOString(),
    metadata: {
      totalQuestions: sessionData.session.questions.length,
      answeredQuestions: sessionData.responses.length,
      duration: sessionData.session.endTime && sessionData.session.startTime
        ? Math.round((new Date(sessionData.session.endTime).getTime() - new Date(sessionData.session.startTime).getTime()) / 1000 / 60)
        : 0,
      completionRate: Math.round((sessionData.responses.length / sessionData.session.questions.length) * 100)
    }
  }

  const handleExport = async (format: "json" | "pdf" | "markdown") => {
    setIsExporting(true)
    
    try {
      switch (format) {
        case "json":
          exportAsJSON()
          break
        case "pdf":
          await exportAsPDF()
          break
        case "markdown":
          exportAsMarkdown()
          break
      }
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const exportAsJSON = () => {
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json"
    })
    downloadBlob(blob, `interview-${sessionId}.json`)
  }

  const exportAsMarkdown = () => {
    const markdown = generateMarkdownReport()
    const blob = new Blob([markdown], { type: "text/markdown" })
    downloadBlob(blob, `interview-report-${sessionId}.md`)
  }

  const exportAsPDF = async () => {
    // For a real implementation, you'd use a library like jsPDF or Puppeteer
    // For now, we'll create a comprehensive HTML report that can be printed as PDF
    const htmlReport = generateHTMLReport()
    
    // Create a new window with the report
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlReport)
      printWindow.document.close()
      
      // Trigger print dialog
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  const generateMarkdownReport = (): string => {
    const session = sessionData.session
    const responses = sessionData.responses
    
    return `# Interview Report

## Session Information
- **Session ID**: ${sessionId}
- **Type**: ${session.type}
- **Difficulty**: ${session.difficulty}
- **Date**: ${new Date(sessionData.createdAt).toLocaleDateString()}
- **Duration**: ${exportData.metadata.duration} minutes
- **Completion Rate**: ${exportData.metadata.completionRate}%

## Overall Score
${detailedScore ? `**${detailedScore.overallScore}/100** (${detailedScore.levelAssessment} level)` : 'Not available'}

${detailedScore ? `### Score Breakdown
- **Technical Accuracy**: ${detailedScore.breakdown.technicalAccuracy}/100
- **Communication Skills**: ${detailedScore.breakdown.communicationSkills}/100
- **Problem Solving**: ${detailedScore.breakdown.problemSolving}/100
- **Confidence**: ${detailedScore.breakdown.confidence}/100
- **Relevance**: ${detailedScore.breakdown.relevance}/100
- **Clarity**: ${detailedScore.breakdown.clarity}/100
- **Structure**: ${detailedScore.breakdown.structure}/100
- **Examples**: ${detailedScore.breakdown.examples}/100` : ''}

## Questions and Responses

${session.questions.map((question, index) => {
  const response = responses.find(r => r.questionId === question.id)
  return `### Question ${index + 1}
**Type**: ${question.type} | **Difficulty**: ${question.difficulty}

**Question**: ${question.question}

**Your Response**: ${response ? response.response : 'Not answered'}

**Response Time**: ${response ? Math.round(response.duration) : 0} seconds

---`
}).join('\n')}

${detailedScore ? `## Feedback Summary

### Strengths
${detailedScore.strengths.map(s => `- ${s}`).join('\n')}

### Areas for Improvement
${detailedScore.weaknesses.map(w => `- ${w}`).join('\n')}

### Recommendations
${detailedScore.recommendations.map(r => `- ${r}`).join('\n')}

### Improvement Plan

#### Short-term (Next 2 weeks)
${detailedScore.improvementPlan.shortTerm.map(s => `- ${s}`).join('\n')}

#### Long-term (Next 3 months)
${detailedScore.improvementPlan.longTerm.map(l => `- ${l}`).join('\n')}` : ''}

---
*Report generated on ${new Date().toLocaleString()} by AI Voice Interview Assistant*`
  }

  const generateHTMLReport = (): string => {
    const session = sessionData.session
    const responses = sessionData.responses
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Interview Report - ${sessionId}</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .score-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
            .score-item { background: #f5f5f5; padding: 15px; border-radius: 8px; }
            .question-section { margin: 30px 0; padding: 20px; border-left: 4px solid #007bff; background: #f8f9fa; }
            .strengths { background: #d4edda; padding: 15px; border-radius: 8px; margin: 10px 0; }
            .weaknesses { background: #f8d7da; padding: 15px; border-radius: 8px; margin: 10px 0; }
            @media print { body { margin: 0; } }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Interview Performance Report</h1>
            <p><strong>Session:</strong> ${sessionId} | <strong>Date:</strong> ${new Date(sessionData.createdAt).toLocaleDateString()}</p>
            <p><strong>Type:</strong> ${session.type} | <strong>Difficulty:</strong> ${session.difficulty} | <strong>Duration:</strong> ${exportData.metadata.duration} minutes</p>
        </div>

        ${detailedScore ? `
        <div class="overall-score">
            <h2>Overall Performance</h2>
            <div style="text-align: center; font-size: 2em; color: #007bff; margin: 20px 0;">
                ${detailedScore.overallScore}/100
            </div>
            <div style="text-align: center;">
                <span style="background: #007bff; color: white; padding: 8px 16px; border-radius: 20px; text-transform: capitalize;">
                    ${detailedScore.levelAssessment} Level
                </span>
            </div>
        </div>

        <div class="score-breakdown">
            <h3>Detailed Scores</h3>
            <div class="score-grid">
                <div class="score-item"><strong>Technical Accuracy:</strong> ${detailedScore.breakdown.technicalAccuracy}/100</div>
                <div class="score-item"><strong>Communication:</strong> ${detailedScore.breakdown.communicationSkills}/100</div>
                <div class="score-item"><strong>Problem Solving:</strong> ${detailedScore.breakdown.problemSolving}/100</div>
                <div class="score-item"><strong>Confidence:</strong> ${detailedScore.breakdown.confidence}/100</div>
                <div class="score-item"><strong>Relevance:</strong> ${detailedScore.breakdown.relevance}/100</div>
                <div class="score-item"><strong>Clarity:</strong> ${detailedScore.breakdown.clarity}/100</div>
                <div class="score-item"><strong>Structure:</strong> ${detailedScore.breakdown.structure}/100</div>
                <div class="score-item"><strong>Examples:</strong> ${detailedScore.breakdown.examples}/100</div>
            </div>
        </div>
        ` : ''}

        <div class="questions-responses">
            <h2>Questions & Responses</h2>
            ${session.questions.map((question, index) => {
              const response = responses.find(r => r.questionId === question.id)
              return `
              <div class="question-section">
                  <h3>Question ${index + 1}</h3>
                  <div style="margin-bottom: 10px;">
                      <span style="background: #e3f2fd; padding: 4px 8px; border-radius: 4px; font-size: 0.8em;">${question.type}</span>
                      <span style="background: #fff3e0; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; margin-left: 5px;">${question.difficulty}</span>
                  </div>
                  <p><strong>Question:</strong> ${question.question}</p>
                  <p><strong>Your Response:</strong></p>
                  <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
                      ${response ? response.response : 'Not answered'}
                  </div>
                  <p><strong>Response Time:</strong> ${response ? Math.round(response.duration) : 0} seconds</p>
              </div>
              `
            }).join('')}
        </div>

        ${detailedScore ? `
        <div class="feedback-section">
            <h2>Performance Feedback</h2>
            
            <div class="strengths">
                <h3 style="color: #155724;">Strengths</h3>
                <ul>
                    ${detailedScore.strengths.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>

            <div class="weaknesses">
                <h3 style="color: #721c24;">Areas for Improvement</h3>
                <ul>
                    ${detailedScore.weaknesses.map(w => `<li>${w}</li>`).join('')}
                </ul>
            </div>

            <div style="margin: 20px 0;">
                <h3>Recommendations</h3>
                <ul>
                    ${detailedScore.recommendations.map(r => `<li>${r}</li>`).join('')}
                </ul>
            </div>
        </div>
        ` : ''}

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; color: #666; font-size: 0.9em;">
            Report generated on ${new Date().toLocaleString()} by AI Voice Interview Assistant
        </div>
    </body>
    </html>
    `
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const generateShareableLink = (): string => {
    // In a real implementation, you'd upload the data to a cloud service
    // For now, we'll create a data URL that contains the report
    const reportData = btoa(JSON.stringify(exportData))
    return `${window.location.origin}/shared-report?data=${reportData}`
  }

  const shareViaEmail = () => {
    const subject = `Interview Performance Report - ${sessionId}`
    const body = `Hi,

I wanted to share my interview practice results with you.

Session Details:
- Type: ${sessionData.session.type}
- Difficulty: ${sessionData.session.difficulty}
- Date: ${new Date(sessionData.createdAt).toLocaleDateString()}
- Completion Rate: ${exportData.metadata.completionRate}%
${detailedScore ? `- Overall Score: ${detailedScore.overallScore}/100` : ''}

You can view the full report by downloading the attachment or clicking the link below.

${shareMessage}

Best regards`

    const mailtoLink = `mailto:${shareEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoLink)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Share2 className="h-5 w-5" />
          <span>Export & Share Results</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="share">Share</TabsTrigger>
            <TabsTrigger value="link">Link</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 mt-4">
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Code2 className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">JSON Data</p>
                    <p className="text-sm text-muted-foreground">Raw data for developers</p>
                  </div>
                </div>
                <Button 
                  onClick={() => handleExport("json")}
                  disabled={isExporting}
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">PDF Report</p>
                    <p className="text-sm text-muted-foreground">Print-ready format</p>
                  </div>
                </div>
                <Button 
                  onClick={() => handleExport("pdf")}
                  disabled={isExporting}
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium">Markdown</p>
                    <p className="text-sm text-muted-foreground">GitHub-compatible format</p>
                  </div>
                </div>
                <Button 
                  onClick={() => handleExport("markdown")}
                  disabled={isExporting}
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Export Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Questions:</span>
                  <span className="ml-2 font-medium">{exportData.metadata.totalQuestions}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Answered:</span>
                  <span className="ml-2 font-medium">{exportData.metadata.answeredQuestions}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="ml-2 font-medium">{exportData.metadata.duration}m</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Completion:</span>
                  <span className="ml-2 font-medium">{exportData.metadata.completionRate}%</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="share" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Email Address</label>
                <Input
                  placeholder="mentor@example.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Personal Message (Optional)</label>
                <Textarea
                  placeholder="Add a personal message to include with your report..."
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <Button 
                onClick={shareViaEmail}
                disabled={!shareEmail}
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                Share via Email
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  This will open your default email client with a pre-filled message
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Shareable Link</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Generate a link that others can use to view your interview report
                </p>
                
                <div className="flex space-x-2">
                  <Input 
                    value={generateShareableLink()}
                    readOnly 
                    className="flex-1"
                  />
                  <Button
                    onClick={() => copyToClipboard(generateShareableLink())}
                    size="sm"
                    variant="outline"
                  >
                    {copySuccess ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                
                {copySuccess && (
                  <p className="text-sm text-green-600 mt-2">Link copied to clipboard!</p>
                )}
              </div>

              <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <ExternalLink className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Privacy Notice</p>
                    <p className="text-xs text-amber-700">
                      The shared link contains your interview data. Only share with trusted individuals.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(generateMarkdownReport())}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Report
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(exportData, null, 2))}
                  >
                    <Code2 className="h-3 w-3 mr-1" />
                    Copy JSON
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Quick export buttons for common use cases
interface QuickExportProps {
  sessionId: string
  format?: "json" | "markdown" | "pdf"
  size?: "sm" | "default" | "lg"
}

export function QuickExportButton({ sessionId, format = "json", size = "default" }: QuickExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleQuickExport = async () => {
    setIsExporting(true)
    try {
      const sessionData = sessionManager.getSessionWithResponses(sessionId)
      if (!sessionData) throw new Error("Session not found")

      // Export logic would go here
      console.log(`Exporting ${format} for session ${sessionId}`)
    } catch (error) {
      console.error("Quick export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const getIcon = () => {
    switch (format) {
      case "pdf": return <FileText className="h-4 w-4" />
      case "markdown": return <FileText className="h-4 w-4" />
      default: return <Download className="h-4 w-4" />
    }
  }

  return (
    <Button
      onClick={handleQuickExport}
      disabled={isExporting}
      size={size}
      variant="outline"
    >
      {getIcon()}
      {size !== "sm" && (
        <span className="ml-2">
          Export {format.toUpperCase()}
        </span>
      )}
    </Button>
  )
}
