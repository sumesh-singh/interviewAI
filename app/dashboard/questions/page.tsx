"use client"

import { useState } from "react"
import ProtectedRoute from "@/components/protected-route"
import DashboardLayout from "@/components/dashboard-layout"
import { QuestionBankList } from "@/components/question-bank-list"
import { QuestionBankManager } from "@/components/question-bank-manager"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import type { QuestionBank } from "@/types/question-bank"
import { useQuestionBanks } from "@/hooks/use-question-banks"

export default function QuestionsPage() {
  const { createQuestionBank, updateQuestionBank, refetch } = useQuestionBanks()
  const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_public: false,
  })
  const [saving, setSaving] = useState(false)

  const handleCreate = () => {
    setEditingBank(null)
    setFormData({ name: "", description: "", is_public: false })
    setDialogOpen(true)
  }

  const handleEdit = (bank: QuestionBank) => {
    setEditingBank(bank)
    setFormData({
      name: bank.name,
      description: bank.description || "",
      is_public: bank.is_public,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingBank) {
        await updateQuestionBank(editingBank.id, formData)
      } else {
        const newBank = await createQuestionBank(formData)
        if (newBank) {
          setSelectedBank(newBank)
        }
      }
      setDialogOpen(false)
      refetch()
    } catch (err) {
      console.error("Error saving question bank:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {selectedBank ? (
          <QuestionBankManager
            bank={selectedBank}
            onBack={() => {
              setSelectedBank(null)
              refetch()
            }}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Question Banks</h1>
                <p className="text-gray-600">Create and manage your custom interview question collections</p>
              </div>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create Question Bank
              </Button>
            </div>

            <QuestionBankList
              onEdit={(bank) => {
                setSelectedBank(bank)
              }}
              onCreate={handleCreate}
            />
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBank ? "Edit Question Bank" : "Create Question Bank"}
              </DialogTitle>
              <DialogDescription>
                {editingBank
                  ? "Update your question bank details"
                  : "Create a new collection of interview questions"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Frontend Engineer Questions"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose of this question bank..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_public">Make Public</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow others to view and use this question bank
                  </p>
                </div>
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || !formData.name.trim()}>
                  {saving ? "Saving..." : editingBank ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
