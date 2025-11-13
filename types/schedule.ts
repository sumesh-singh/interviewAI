export interface ScheduledSession {
  id: string
  user_id: string
  template_id: string
  template_name: string
  scheduled_date: string
  duration: number
  difficulty: "easy" | "medium" | "hard"
  interview_type: "technical" | "behavioral" | "mixed"
  status: "scheduled" | "completed" | "cancelled"
  reminder_sent: boolean
  google_calendar_event_id?: string | null
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateSessionInput {
  template_id: string
  scheduled_date: string
  notes?: string
}

export interface UpdateSessionInput {
  scheduled_date?: string
  notes?: string
  status?: "scheduled" | "completed" | "cancelled"
}

export interface CalendarEvent {
  id: string
  date: Date
  sessions: ScheduledSession[]
}

export interface GoogleCalendarConnection {
  connected: boolean
  email?: string
  last_synced?: string
}
