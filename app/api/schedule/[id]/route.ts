import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calendarService } from '@/lib/calendar-service'
import { z } from 'zod'
import type { UpdateScheduledSessionRequest, ScheduledSessionResponse } from '@/types/scheduling'

const updateSessionSchema = z.object({
  session_config: z.object({
    templateId: z.string().optional(),
    role: z.string().optional(),
    type: z.enum(['behavioral', 'technical', 'mixed']).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    duration: z.number().positive().optional(),
    customQuestions: z.array(z.any()).optional(),
  }).optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  sync_to_calendar: z.boolean().optional(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch session
    const { data: session, error } = await supabase
      .from('scheduled_sessions')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const response: ScheduledSessionResponse = {
      ...session,
      calendar_synced: !!session.calendar_event_id,
    }

    return NextResponse.json({ data: response })
  } catch (error) {
    console.error('Error in GET /api/schedule/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current session
    const { data: currentSession, error: fetchError } = await supabase
      .from('scheduled_sessions')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !currentSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const body = await request.json()
    const updateData = updateSessionSchema.parse(body)

    // Build update payload
    const payload: any = {}

    if (updateData.session_config) {
      payload.session_config = {
        ...currentSession.session_config,
        ...updateData.session_config,
      }
    }

    if (updateData.start_time) {
      payload.start_time = updateData.start_time
    }

    if (updateData.end_time) {
      payload.end_time = updateData.end_time
    }

    if (updateData.status) {
      payload.status = updateData.status
    }

    payload.updated_at = new Date().toISOString()

    // Update session in database
    const { data: updatedSession, error: updateError } = await supabase
      .from('scheduled_sessions')
      .update(payload)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError || !updatedSession) {
      console.error('Error updating session:', updateError)
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
    }

    // Sync changes to Google Calendar if needed
    if (updateData.sync_to_calendar && currentSession.calendar_event_id) {
      const isConnected = await calendarService.isCalendarConnected(user.id)
      if (isConnected) {
        const updatePayload: any = {}

        if (updateData.session_config?.type || updateData.session_config?.difficulty) {
          updatePayload.title = `Interview Practice - ${
            updateData.session_config?.type || currentSession.session_config.type
          } (${updateData.session_config?.difficulty || currentSession.session_config.difficulty})`
        }

        if (updateData.start_time) {
          updatePayload.startTime = new Date(updateData.start_time)
        }

        if (updateData.end_time) {
          updatePayload.endTime = new Date(updateData.end_time)
        }

        if (Object.keys(updatePayload).length > 0) {
          await calendarService.updateEvent(
            user.id,
            currentSession.calendar_event_id,
            updatePayload
          )
        }
      }
    }

    const response: ScheduledSessionResponse = {
      ...updatedSession,
      calendar_synced: !!updatedSession.calendar_event_id,
    }

    return NextResponse.json({ data: response })
  } catch (error) {
    console.error('Error in PATCH /api/schedule/[id]:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get session
    const { data: session, error: fetchError } = await supabase
      .from('scheduled_sessions')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Delete from Google Calendar if event exists
    if (session.calendar_event_id) {
      const isConnected = await calendarService.isCalendarConnected(user.id)
      if (isConnected) {
        await calendarService.deleteEvent(
          user.id,
          session.calendar_event_id,
          session.google_calendar_id || 'primary'
        )
      }
    }

    // Delete session from database
    const { error: deleteError } = await supabase
      .from('scheduled_sessions')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting session:', deleteError)
      return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 204 })
  } catch (error) {
    console.error('Error in DELETE /api/schedule/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
