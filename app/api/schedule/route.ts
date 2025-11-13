import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calendarService } from '@/lib/calendar-service'
import { z } from 'zod'
import type { CreateScheduledSessionRequest, UpdateScheduledSessionRequest, ScheduledSessionResponse } from '@/types/scheduling'

const createSessionSchema = z.object({
  session_config: z.object({
    templateId: z.string().optional(),
    role: z.string().optional(),
    type: z.enum(['behavioral', 'technical', 'mixed']),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    duration: z.number().positive(),
    customQuestions: z.array(z.any()).optional(),
  }),
  start_time: z.string().datetime(),
  end_time: z.string().datetime().optional(),
  sync_to_calendar: z.boolean().optional().default(true),
})

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

export async function GET(request: NextRequest) {
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

    // Get query parameters for filtering
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const limit = url.searchParams.get('limit') || '50'
    const offset = url.searchParams.get('offset') || '0'

    let query = supabase
      .from('scheduled_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Error fetching scheduled sessions:', error)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    // Map sessions to response format
    const responses: ScheduledSessionResponse[] = sessions?.map((session) => ({
      ...session,
      calendar_synced: !!session.calendar_event_id,
    })) || []

    return NextResponse.json({
      data: responses,
      count: responses.length,
    })
  } catch (error) {
    console.error('Error in GET /api/schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { session_config, start_time, end_time, sync_to_calendar } =
      createSessionSchema.parse(body)

    // Create scheduled session in database
    const { data: session, error: insertError } = await supabase
      .from('scheduled_sessions')
      .insert({
        user_id: user.id,
        session_config,
        start_time,
        end_time,
        status: 'scheduled',
      })
      .select()
      .single()

    if (insertError || !session) {
      console.error('Error creating scheduled session:', insertError)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    // Sync to Google Calendar if enabled and user has calendar connected
    let calendarEventId: string | undefined
    if (sync_to_calendar) {
      const isConnected = await calendarService.isCalendarConnected(user.id)
      if (isConnected) {
        const calendarEvent = await calendarService.createEvent(user.id, {
          title: `Interview Practice - ${session_config.type} (${session_config.difficulty})`,
          description: `Interview practice session\nType: ${session_config.type}\nDifficulty: ${session_config.difficulty}\nDuration: ${session_config.duration} minutes`,
          startTime: new Date(start_time),
          endTime: new Date(end_time || new Date(new Date(start_time).getTime() + session_config.duration * 60000)),
          sessionId: session.id,
        })

        if (calendarEvent) {
          // Update session with calendar event ID
          const { error: updateError } = await supabase
            .from('scheduled_sessions')
            .update({
              calendar_event_id: calendarEvent.id,
              google_calendar_id: 'primary',
            })
            .eq('id', session.id)

          if (updateError) {
            console.error('Error updating session with calendar event ID:', updateError)
          } else {
            calendarEventId = calendarEvent.id
          }
        }
      }
    }

    // Build response
    const response: ScheduledSessionResponse = {
      ...session,
      calendar_synced: !!calendarEventId,
    }

    return NextResponse.json({ data: response }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/schedule:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
