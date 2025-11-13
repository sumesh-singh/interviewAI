"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { QuestionBank, Question, QuestionBankWithQuestions, PendingQuestionBankChange } from "@/types/question-bank"
import { useToast } from "./use-toast"

const PENDING_CHANGES_KEY = "pending-question-bank-changes"

export function useQuestionBanks() {
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const fetchQuestionBanks = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("User not authenticated")
      }

      const { data, error: fetchError } = await supabase
        .from("question_banks")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      if (fetchError) throw fetchError

      setQuestionBanks(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch question banks"
      setError(errorMessage)
      console.error("Error fetching question banks:", err)
    } finally {
      setLoading(false)
    }
  }

  const createQuestionBank = async (bank: Omit<QuestionBank, "id" | "user_id" | "created_at" | "updated_at">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("User not authenticated")
      }

      if (!navigator.onLine) {
        savePendingChange({
          id: crypto.randomUUID(),
          type: "create",
          timestamp: new Date(),
          data: { ...bank, user_id: user.id }
        })
        toast({
          title: "Offline",
          description: "Question bank will be created when you're back online",
        })
        return null
      }

      const { data, error: createError } = await supabase
        .from("question_banks")
        .insert({
          ...bank,
          user_id: user.id
        })
        .select()
        .single()

      if (createError) throw createError

      await fetchQuestionBanks()
      toast({
        title: "Success",
        description: "Question bank created successfully",
      })

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create question bank"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      console.error("Error creating question bank:", err)
      return null
    }
  }

  const updateQuestionBank = async (id: string, updates: Partial<QuestionBank>) => {
    try {
      if (!navigator.onLine) {
        savePendingChange({
          id: crypto.randomUUID(),
          type: "update",
          timestamp: new Date(),
          data: updates,
          bankId: id
        })
        toast({
          title: "Offline",
          description: "Changes will be synced when you're back online",
        })
        return false
      }

      const { error: updateError } = await supabase
        .from("question_banks")
        .update(updates)
        .eq("id", id)

      if (updateError) throw updateError

      await fetchQuestionBanks()
      toast({
        title: "Success",
        description: "Question bank updated successfully",
      })

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update question bank"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      console.error("Error updating question bank:", err)
      return false
    }
  }

  const deleteQuestionBank = async (id: string) => {
    try {
      if (!navigator.onLine) {
        savePendingChange({
          id: crypto.randomUUID(),
          type: "delete",
          timestamp: new Date(),
          data: {},
          bankId: id
        })
        toast({
          title: "Offline",
          description: "Deletion will be processed when you're back online",
        })
        return false
      }

      const { error: deleteError } = await supabase
        .from("question_banks")
        .delete()
        .eq("id", id)

      if (deleteError) throw deleteError

      await fetchQuestionBanks()
      toast({
        title: "Success",
        description: "Question bank deleted successfully",
      })

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete question bank"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      console.error("Error deleting question bank:", err)
      return false
    }
  }

  const duplicateQuestionBank = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const { data: bank, error: fetchError } = await supabase
        .from("question_banks")
        .select("*, questions(*)")
        .eq("id", id)
        .single()

      if (fetchError) throw fetchError

      const { data: newBank, error: createError } = await supabase
        .from("question_banks")
        .insert({
          user_id: user.id,
          name: `${bank.name} (Copy)`,
          description: bank.description,
          is_public: false
        })
        .select()
        .single()

      if (createError) throw createError

      if (bank.questions && bank.questions.length > 0) {
        const questionsToInsert = bank.questions.map((q: Question) => ({
          question_bank_id: newBank.id,
          type: q.type,
          difficulty: q.difficulty,
          question: q.question,
          follow_up: q.follow_up,
          tags: q.tags,
          time_limit: q.time_limit
        }))

        const { error: questionsError } = await supabase
          .from("questions")
          .insert(questionsToInsert)

        if (questionsError) throw questionsError
      }

      await fetchQuestionBanks()
      toast({
        title: "Success",
        description: "Question bank duplicated successfully",
      })

      return newBank
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to duplicate question bank"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      console.error("Error duplicating question bank:", err)
      return null
    }
  }

  const syncPendingChanges = async () => {
    if (!navigator.onLine) return

    const pendingChanges = getPendingChanges()
    if (pendingChanges.length === 0) return

    try {
      for (const change of pendingChanges) {
        if (change.type === "create" && change.data.name) {
          await createQuestionBank(change.data as any)
        } else if (change.type === "update" && change.bankId) {
          await updateQuestionBank(change.bankId, change.data)
        } else if (change.type === "delete" && change.bankId) {
          await deleteQuestionBank(change.bankId)
        }
      }
      clearPendingChanges()
      toast({
        title: "Synced",
        description: "All offline changes have been synced",
      })
    } catch (err) {
      console.error("Error syncing pending changes:", err)
    }
  }

  useEffect(() => {
    fetchQuestionBanks()

    const handleOnline = () => {
      syncPendingChanges()
      fetchQuestionBanks()
    }

    window.addEventListener("online", handleOnline)

    return () => {
      window.removeEventListener("online", handleOnline)
    }
  }, [])

  return {
    questionBanks,
    loading,
    error,
    refetch: fetchQuestionBanks,
    createQuestionBank,
    updateQuestionBank,
    deleteQuestionBank,
    duplicateQuestionBank,
    syncPendingChanges
  }
}

export function useQuestionBank(bankId: string | null) {
  const [bank, setBank] = useState<QuestionBankWithQuestions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const fetchBank = async () => {
    if (!bankId) {
      setBank(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("question_banks")
        .select("*, questions(*)")
        .eq("id", bankId)
        .single()

      if (fetchError) throw fetchError

      setBank(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch question bank"
      setError(errorMessage)
      console.error("Error fetching question bank:", err)
    } finally {
      setLoading(false)
    }
  }

  const addQuestion = async (question: Omit<Question, "id" | "question_bank_id" | "created_at" | "updated_at">) => {
    if (!bankId) return null

    try {
      if (!navigator.onLine) {
        savePendingChange({
          id: crypto.randomUUID(),
          type: "create",
          timestamp: new Date(),
          data: { ...question, question_bank_id: bankId }
        })
        toast({
          title: "Offline",
          description: "Question will be added when you're back online",
        })
        return null
      }

      const { data, error: createError } = await supabase
        .from("questions")
        .insert({
          ...question,
          question_bank_id: bankId
        })
        .select()
        .single()

      if (createError) throw createError

      await fetchBank()
      toast({
        title: "Success",
        description: "Question added successfully",
      })

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add question"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      console.error("Error adding question:", err)
      return null
    }
  }

  const updateQuestion = async (id: string, updates: Partial<Question>) => {
    try {
      if (!navigator.onLine) {
        savePendingChange({
          id: crypto.randomUUID(),
          type: "update",
          timestamp: new Date(),
          data: updates,
          questionId: id
        })
        toast({
          title: "Offline",
          description: "Changes will be synced when you're back online",
        })
        return false
      }

      const { error: updateError } = await supabase
        .from("questions")
        .update(updates)
        .eq("id", id)

      if (updateError) throw updateError

      await fetchBank()
      toast({
        title: "Success",
        description: "Question updated successfully",
      })

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update question"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      console.error("Error updating question:", err)
      return false
    }
  }

  const deleteQuestion = async (id: string) => {
    try {
      if (!navigator.onLine) {
        savePendingChange({
          id: crypto.randomUUID(),
          type: "delete",
          timestamp: new Date(),
          data: {},
          questionId: id
        })
        toast({
          title: "Offline",
          description: "Deletion will be processed when you're back online",
        })
        return false
      }

      const { error: deleteError } = await supabase
        .from("questions")
        .delete()
        .eq("id", id)

      if (deleteError) throw deleteError

      await fetchBank()
      toast({
        title: "Success",
        description: "Question deleted successfully",
      })

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete question"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      console.error("Error deleting question:", err)
      return false
    }
  }

  const bulkAddQuestions = async (questions: Omit<Question, "id" | "question_bank_id" | "created_at" | "updated_at">[]) => {
    if (!bankId) return false

    try {
      const questionsToInsert = questions.map(q => ({
        ...q,
        question_bank_id: bankId
      }))

      const { error: insertError } = await supabase
        .from("questions")
        .insert(questionsToInsert)

      if (insertError) throw insertError

      await fetchBank()
      toast({
        title: "Success",
        description: `${questions.length} questions imported successfully`,
      })

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to import questions"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      console.error("Error bulk adding questions:", err)
      return false
    }
  }

  useEffect(() => {
    fetchBank()
  }, [bankId])

  return {
    bank,
    loading,
    error,
    refetch: fetchBank,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    bulkAddQuestions
  }
}

function savePendingChange(change: PendingQuestionBankChange) {
  const changes = getPendingChanges()
  changes.push(change)
  localStorage.setItem(PENDING_CHANGES_KEY, JSON.stringify(changes))
}

function getPendingChanges(): PendingQuestionBankChange[] {
  try {
    const stored = localStorage.getItem(PENDING_CHANGES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function clearPendingChanges() {
  localStorage.removeItem(PENDING_CHANGES_KEY)
}
