"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreVertical, Edit, Copy, Trash2, Plus, FileText } from "lucide-react"
import type { QuestionBank } from "@/types/question-bank"
import { useQuestionBanks } from "@/hooks/use-question-banks"
import { createClient } from "@/lib/supabase/client"

interface QuestionBankListProps {
  onEdit: (bank: QuestionBank) => void
  onCreate: () => void
}

export function QuestionBankList({ onEdit, onCreate }: QuestionBankListProps) {
  const { questionBanks, loading, deleteQuestionBank, duplicateQuestionBank } = useQuestionBanks()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null)
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetchQuestionCounts = async () => {
      const supabase = createClient()
      const counts: Record<string, number> = {}
      
      for (const bank of questionBanks) {
        const { count } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('question_bank_id', bank.id)
        
        counts[bank.id] = count || 0
      }
      
      setQuestionCounts(counts)
    }

    if (questionBanks.length > 0) {
      fetchQuestionCounts()
    }
  }, [questionBanks])

  const handleDelete = async () => {
    if (selectedBank) {
      await deleteQuestionBank(selectedBank.id)
      setDeleteDialogOpen(false)
      setSelectedBank(null)
    }
  }

  const handleDuplicate = async (bank: QuestionBank) => {
    await duplicateQuestionBank(bank.id)
  }

  const openDeleteDialog = (bank: QuestionBank) => {
    setSelectedBank(bank)
    setDeleteDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full" />
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (questionBanks.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardHeader>
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <CardTitle>No Question Banks Yet</CardTitle>
          <CardDescription>
            Create your first question bank to start organizing your interview questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create Question Bank
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {questionBanks.map((bank) => (
          <Card key={bank.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{bank.name}</CardTitle>
                  {bank.description && (
                    <CardDescription className="mt-1">{bank.description}</CardDescription>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(bank)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(bank)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openDeleteDialog(bank)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Questions: <span className="font-semibold">{questionCounts[bank.id] || 0}</span>
                </div>
                {bank.is_public && (
                  <Badge variant="secondary">Public</Badge>
                )}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Updated {new Date(bank.updated_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question Bank</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedBank?.name}"? This action cannot be undone
              and will delete all questions in this bank.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
