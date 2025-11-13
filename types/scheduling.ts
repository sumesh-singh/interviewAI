import type { SessionCreateParams } from '@/lib/session-manager'

export interface ScheduledSession {
  id: string
  user_id: string
  session_config: SessionCreateParams
  start_time: string
  end_time?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  calendar_event_id?: string
  google_calendar_id?: string
  created_at: string
  updated_at: string
}

export interface CreateScheduledSessionRequest {
  session_config: SessionCreateParams
  start_time: string
  end_time?: string
  sync_to_calendar?: boolean
}

export interface UpdateScheduledSessionRequest {
  session_config?: SessionCreateParams
  start_time?: string
  end_time?: string
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  sync_to_calendar?: boolean
}

export interface ScheduledSessionResponse {
  id: string
  user_id: string
  session_config: SessionCreateParams
  start_time: string
  end_time?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  calendar_event_id?: string
  google_calendar_id?: string
  calendar_synced: boolean
  created_at: string
  updated_at: string
}
