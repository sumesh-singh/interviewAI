import type { SessionCreateParams } from './session-manager'

export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  startTime: string
  endTime: string
  conferenceData?: {
    entryPoints?: Array<{
      uri: string
      entryPointType: string
    }>
  }
}

export interface CalendarEventData {
  title: string
  description?: string
  startTime: Date
  endTime: Date
  sessionId?: string
}

// Helper to get Supabase client - will be called at runtime to avoid SSR issues
async function getSupabaseClient() {
  const { createClient } = await import('@/lib/supabase/server')
  return createClient()
}

export class CalendarService {
  private static instance: CalendarService
  private readonly GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3'
  private readonly GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

  private constructor() {}

  public static getInstance(): CalendarService {
    if (!CalendarService.instance) {
      CalendarService.instance = new CalendarService()
    }
    return CalendarService.instance
  }

  /**
   * Refresh Google Calendar access token using refresh token
   */
  async refreshAccessToken(userId: string): Promise<string | null> {
    try {
      const supabase = await getSupabaseClient()

      // Get the user's calendar tokens
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('google_calendar_refresh_token, google_calendar_token_expires_at')
        .eq('user_id', userId)
        .single()

      if (error || !profile?.google_calendar_refresh_token) {
        console.error('Failed to fetch calendar refresh token:', error)
        return null
      }

      // Check if token needs refresh (within 5 minutes of expiry)
      const expiresAt = new Date(profile.google_calendar_token_expires_at)
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)

      if (expiresAt > fiveMinutesFromNow) {
        // Token still valid
        return null // Will use existing access token
      }

      // Refresh the token
      const response = await fetch(this.GOOGLE_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: profile.google_calendar_refresh_token,
          grant_type: 'refresh_token',
        }).toString(),
      })

      if (!response.ok) {
        console.error('Failed to refresh Google Calendar token:', response.statusText)
        return null
      }

      const data = await response.json()

      // Update the tokens in database
      const expiresIn = data.expires_in || 3600 // Default to 1 hour
      const newExpiresAt = new Date(Date.now() + expiresIn * 1000)

      await supabase
        .from('user_profiles')
        .update({
          google_calendar_access_token: data.access_token,
          google_calendar_token_expires_at: newExpiresAt.toISOString(),
        })
        .eq('user_id', userId)

      return data.access_token
    } catch (error) {
      console.error('Error refreshing access token:', error)
      return null
    }
  }

  /**
   * Get valid access token for user
   */
  async getValidAccessToken(userId: string): Promise<string | null> {
    try {
      const supabase = await getSupabaseClient()

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('google_calendar_access_token, google_calendar_token_expires_at, google_calendar_refresh_token')
        .eq('user_id', userId)
        .single()

      if (error || !profile) {
        return null
      }

      // Check if token needs refresh
      if (profile.google_calendar_token_expires_at) {
        const expiresAt = new Date(profile.google_calendar_token_expires_at)
        const now = new Date()

        if (expiresAt <= now && profile.google_calendar_refresh_token) {
          // Token expired, try to refresh
          return await this.refreshAccessToken(userId)
        }
      }

      return profile.google_calendar_access_token
    } catch (error) {
      console.error('Error getting valid access token:', error)
      return null
    }
  }

  /**
   * Create event in Google Calendar
   */
  async createEvent(
    userId: string,
    eventData: CalendarEventData,
    calendarId: string = 'primary'
  ): Promise<GoogleCalendarEvent | null> {
    try {
      const accessToken = await this.getValidAccessToken(userId)
      if (!accessToken) {
        console.error('No valid access token for user')
        return null
      }

      const event = {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: eventData.endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        conferenceData: {
          createRequest: {
            requestId: `session-${eventData.sessionId || Date.now()}`,
            conferenceSolutionKey: {
              key: 'hangoutsMeet',
            },
          },
        },
      }

      const response = await fetch(
        `${this.GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events?conferenceDataVersion=1`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        console.error('Failed to create calendar event:', error)
        return null
      }

      const createdEvent = await response.json()
      return this.mapGoogleEventToLocal(createdEvent)
    } catch (error) {
      console.error('Error creating calendar event:', error)
      return null
    }
  }

  /**
   * Update event in Google Calendar
   */
  async updateEvent(
    userId: string,
    eventId: string,
    eventData: Partial<CalendarEventData>,
    calendarId: string = 'primary'
  ): Promise<GoogleCalendarEvent | null> {
    try {
      const accessToken = await this.getValidAccessToken(userId)
      if (!accessToken) {
        console.error('No valid access token for user')
        return null
      }

      // First, fetch the existing event
      const getResponse = await fetch(
        `${this.GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!getResponse.ok) {
        console.error('Failed to fetch calendar event for update')
        return null
      }

      const existingEvent = await getResponse.json()

      // Update fields
      const updatedEvent = {
        ...existingEvent,
        ...(eventData.title && { summary: eventData.title }),
        ...(eventData.description && { description: eventData.description }),
        ...(eventData.startTime && {
          start: {
            dateTime: eventData.startTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }),
        ...(eventData.endTime && {
          end: {
            dateTime: eventData.endTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }),
      }

      const updateResponse = await fetch(
        `${this.GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedEvent),
        }
      )

      if (!updateResponse.ok) {
        const error = await updateResponse.json()
        console.error('Failed to update calendar event:', error)
        return null
      }

      const result = await updateResponse.json()
      return this.mapGoogleEventToLocal(result)
    } catch (error) {
      console.error('Error updating calendar event:', error)
      return null
    }
  }

  /**
   * Delete event from Google Calendar
   */
  async deleteEvent(
    userId: string,
    eventId: string,
    calendarId: string = 'primary'
  ): Promise<boolean> {
    try {
      const accessToken = await this.getValidAccessToken(userId)
      if (!accessToken) {
        console.error('No valid access token for user')
        return false
      }

      const response = await fetch(
        `${this.GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      return response.ok
    } catch (error) {
      console.error('Error deleting calendar event:', error)
      return false
    }
  }

  /**
   * Map Google Calendar event to local format
   */
  private mapGoogleEventToLocal(googleEvent: any): GoogleCalendarEvent {
    return {
      id: googleEvent.id,
      summary: googleEvent.summary,
      description: googleEvent.description,
      startTime: googleEvent.start.dateTime || googleEvent.start.date,
      endTime: googleEvent.end.dateTime || googleEvent.end.date,
      conferenceData: googleEvent.conferenceData,
    }
  }

  /**
   * Disconnect Google Calendar for user
   */
  async disconnectCalendar(userId: string): Promise<boolean> {
    try {
      const supabase = await getSupabaseClient()

      const { error } = await supabase
        .from('user_profiles')
        .update({
          google_calendar_connected: false,
          google_calendar_email: null,
          google_calendar_refresh_token: null,
          google_calendar_access_token: null,
          google_calendar_token_expires_at: null,
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Failed to disconnect calendar:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error disconnecting calendar:', error)
      return false
    }
  }

  /**
   * Store Google Calendar tokens for user
   */
  async storeCalendarTokens(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    calendarEmail: string
  ): Promise<boolean> {
    try {
      const supabase = await getSupabaseClient()

      const expiresAt = new Date(Date.now() + expiresIn * 1000)

      const { error } = await supabase
        .from('user_profiles')
        .update({
          google_calendar_connected: true,
          google_calendar_email: calendarEmail,
          google_calendar_access_token: accessToken,
          google_calendar_refresh_token: refreshToken,
          google_calendar_token_expires_at: expiresAt.toISOString(),
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Failed to store calendar tokens:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error storing calendar tokens:', error)
      return false
    }
  }

  /**
   * Check if user has connected Google Calendar
   */
  async isCalendarConnected(userId: string): Promise<boolean> {
    try {
      const supabase = await getSupabaseClient()

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('google_calendar_connected')
        .eq('user_id', userId)
        .single()

      if (error || !profile) {
        return false
      }

      return profile.google_calendar_connected === true
    } catch (error) {
      console.error('Error checking calendar connection:', error)
      return false
    }
  }
}

export const calendarService = CalendarService.getInstance()
