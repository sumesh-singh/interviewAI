"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Edit,
  Trash2,
  X,
  CheckCircle2,
  LayoutList,
  CalendarDays,
} from "lucide-react"
import { useSchedule } from "@/hooks/use-schedule"
import { interviewTemplates } from "@/data/interview-templates"
import type { ScheduledSession, CreateSessionInput } from "@/types/schedule"
import LoadingSpinner from "@/components/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { format, isSameDay, parseISO } from "date-fns"

interface SchedulePlannerProps {
  initialView?: "calendar" | "list"
}

export default function SchedulePlanner({ initialView = "calendar" }: SchedulePlannerProps) {
  const [view, setView] = useState<"calendar" | "list">(initialView)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<ScheduledSession | null>(null)
  const [formData, setFormData] = useState({
    template_id: "",
    time: "",
    notes: "",
  })

  const { sessions, isLoading, fetchSessions, createSession, updateSession, deleteSession, cancelSession } = useSchedule()
  const { toast } = useToast()

  useEffect(() => {
    fetchSessions({ status: "scheduled" })
  }, [fetchSessions])

  const sessionsOnSelectedDate = useMemo(() => {
    if (!selectedDate) return []
    return sessions.filter((session) =>
      isSameDay(parseISO(session.scheduled_date), selectedDate)
    )
  }, [sessions, selectedDate])

  const upcomingSessions = useMemo(() => {
    const now = new Date()
    return sessions
      .filter((session) => new Date(session.scheduled_date) >= now)
      .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
  }, [sessions])

  const datesWithSessions = useMemo(() => {
    return sessions.map((session) => parseISO(session.scheduled_date))
  }, [sessions])

  const handleCreateSession = async () => {
    if (!formData.template_id || !formData.time || !selectedDate) {
      toast({
        title: "Missing Information",
        description: "Please select a template, date, and time.",
        variant: "destructive",
      })
      return
    }

    try {
      const scheduledDateTime = new Date(selectedDate)
      const [hours, minutes] = formData.time.split(":")
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes))

      const input: CreateSessionInput = {
        template_id: formData.template_id,
        scheduled_date: scheduledDateTime.toISOString(),
        notes: formData.notes || undefined,
      }

      await createSession(input)

      toast({
        title: "Session Scheduled",
        description: "Your practice session has been scheduled successfully.",
      })

      setIsCreateDialogOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to schedule session",
        variant: "destructive",
      })
    }
  }

  const handleEditSession = async () => {
    if (!selectedSession || !formData.time) {
      return
    }

    try {
      const scheduledDateTime = selectedDate ? new Date(selectedDate) : new Date(selectedSession.scheduled_date)
      const [hours, minutes] = formData.time.split(":")
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes))

      await updateSession(selectedSession.id, {
        scheduled_date: scheduledDateTime.toISOString(),
        notes: formData.notes || undefined,
      })

      toast({
        title: "Session Updated",
        description: "Your practice session has been updated successfully.",
      })

      setIsEditDialogOpen(false)
      setSelectedSession(null)
      resetForm()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update session",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSession = async () => {
    if (!selectedSession) return

    try {
      await deleteSession(selectedSession.id)

      toast({
        title: "Session Deleted",
        description: "The practice session has been deleted.",
      })

      setIsDeleteDialogOpen(false)
      setSelectedSession(null)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete session",
        variant: "destructive",
      })
    }
  }

  const handleCancelSession = async (session: ScheduledSession) => {
    try {
      await cancelSession(session.id)

      toast({
        title: "Session Cancelled",
        description: "The practice session has been cancelled.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel session",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (session: ScheduledSession) => {
    setSelectedSession(session)
    const sessionDate = parseISO(session.scheduled_date)
    setSelectedDate(sessionDate)
    setFormData({
      template_id: session.template_id,
      time: format(sessionDate, "HH:mm"),
      notes: session.notes || "",
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (session: ScheduledSession) => {
    setSelectedSession(session)
    setIsDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      template_id: "",
      time: "",
      notes: "",
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "hard":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "technical":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "behavioral":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "mixed":
        return "bg-indigo-100 text-indigo-800 border-indigo-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Tabs value={view} onValueChange={(v) => setView(v as "calendar" | "list")} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" aria-hidden="true" />
                Calendar View
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <LayoutList className="w-4 h-4" aria-hidden="true" />
                List View
              </TabsTrigger>
            </TabsList>
            <Button
              onClick={() => {
                resetForm()
                setIsCreateDialogOpen(true)
              }}
              aria-label="Schedule new session"
            >
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              Schedule Session
            </Button>
          </div>

          <TabsContent value="calendar" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Select a Date</CardTitle>
                  <CardDescription>Choose a date to view or schedule practice sessions</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    modifiers={{
                      scheduled: datesWithSessions,
                    }}
                    modifiersStyles={{
                      scheduled: {
                        fontWeight: "bold",
                        textDecoration: "underline",
                      },
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
                  </CardTitle>
                  <CardDescription>
                    {sessionsOnSelectedDate.length > 0
                      ? `${sessionsOnSelectedDate.length} session${sessionsOnSelectedDate.length > 1 ? "s" : ""} scheduled`
                      : "No sessions scheduled"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : sessionsOnSelectedDate.length > 0 ? (
                    <div className="space-y-3" role="list" aria-label="Sessions on selected date">
                      {sessionsOnSelectedDate.map((session) => (
                        <div
                          key={session.id}
                          className="p-3 border rounded-lg space-y-2"
                          role="listitem"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{session.template_name}</h4>
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                                <Clock className="w-3 h-3" aria-hidden="true" />
                                <span>{format(parseISO(session.scheduled_date), "h:mm a")}</span>
                                <span>•</span>
                                <span>{session.duration} min</span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(session)}
                                aria-label={`Edit ${session.template_name} session`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(session)}
                                aria-label={`Delete ${session.template_name} session`}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline" className={getDifficultyColor(session.difficulty)}>
                              {session.difficulty}
                            </Badge>
                            <Badge variant="outline" className={getTypeColor(session.interview_type)}>
                              {session.interview_type}
                            </Badge>
                            {session.google_calendar_event_id && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle2 className="w-3 h-3 mr-1" aria-hidden="true" />
                                Synced
                              </Badge>
                            )}
                          </div>
                          {session.notes && (
                            <p className="text-xs text-gray-600 mt-2">{session.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
                      <p className="text-sm">No sessions scheduled for this date</p>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          resetForm()
                          setIsCreateDialogOpen(true)
                        }}
                        className="mt-2"
                      >
                        Schedule a session
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>
                  All your scheduled practice sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" label="Loading sessions..." />
                  </div>
                ) : upcomingSessions.length > 0 ? (
                  <div className="space-y-4" role="list" aria-label="Upcoming practice sessions">
                    {upcomingSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-4 border rounded-lg space-y-3"
                        role="listitem"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{session.template_name}</h4>
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                              <CalendarIcon className="w-4 h-4" aria-hidden="true" />
                              <span>{format(parseISO(session.scheduled_date), "EEEE, MMMM d, yyyy")}</span>
                              <span>•</span>
                              <Clock className="w-4 h-4" aria-hidden="true" />
                              <span>{format(parseISO(session.scheduled_date), "h:mm a")}</span>
                              <span>•</span>
                              <span>{session.duration} minutes</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(session)}
                              aria-label={`Edit ${session.template_name} session`}
                            >
                              <Edit className="w-4 h-4 mr-2" aria-hidden="true" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelSession(session)}
                              aria-label={`Cancel ${session.template_name} session`}
                            >
                              <X className="w-4 h-4 mr-2" aria-hidden="true" />
                              Cancel
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(session)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              aria-label={`Delete ${session.template_name} session`}
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={getDifficultyColor(session.difficulty)}>
                            {session.difficulty}
                          </Badge>
                          <Badge variant="outline" className={getTypeColor(session.interview_type)}>
                            {session.interview_type}
                          </Badge>
                          {session.google_calendar_event_id && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" aria-hidden="true" />
                              Synced to Calendar
                            </Badge>
                          )}
                        </div>
                        {session.notes && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            {session.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CalendarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" aria-hidden="true" />
                    <h3 className="text-lg font-medium mb-2">No Scheduled Sessions</h3>
                    <p className="text-sm mb-4">Get started by scheduling your first practice session</p>
                    <Button
                      onClick={() => {
                        resetForm()
                        setIsCreateDialogOpen(true)
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                      Schedule Your First Session
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" aria-describedby="create-session-description">
          <DialogHeader>
            <DialogTitle>Schedule Practice Session</DialogTitle>
            <DialogDescription id="create-session-description">
              Choose a template, date, and time for your practice session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template">Interview Template</Label>
              <Select
                value={formData.template_id}
                onValueChange={(value) => setFormData({ ...formData, template_id: value })}
              >
                <SelectTrigger id="template" aria-label="Select interview template">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {interviewTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-gray-500">
                          {template.duration} min • {template.difficulty} • {template.category}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <div className="text-sm font-medium">
                  {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Not selected"}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  aria-label="Select time for session"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes or reminders for this session"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                aria-label="Session notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSession}>
              <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
              Schedule Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" aria-describedby="edit-session-description">
          <DialogHeader>
            <DialogTitle>Edit Practice Session</DialogTitle>
            <DialogDescription id="edit-session-description">
              Update the date, time, or notes for this session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <div className="text-sm font-medium">{selectedSession?.template_name}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <div className="text-sm font-medium">
                  {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Not selected"}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  aria-label="Update time for session"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes (Optional)</Label>
              <Textarea
                id="edit-notes"
                placeholder="Add any notes or reminders for this session"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                aria-label="Update session notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSession}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this practice session? This action cannot be undone.
              {selectedSession?.google_calendar_event_id && (
                <span className="block mt-2 text-yellow-700">
                  Note: This will also remove the event from your Google Calendar.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession} className="bg-red-600 hover:bg-red-700">
              Delete Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
