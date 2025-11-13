# Scheduling API Documentation

This document provides comprehensive documentation for the interview session scheduling API with optional Google Calendar integration.

## Overview

The scheduling system allows users to:
- Create scheduled interview practice sessions with specific date/time
- Automatically sync sessions to Google Calendar (when connected)
- View, update, and delete scheduled sessions
- Filter sessions by status and date range
- Track session lifecycle (scheduled → in_progress → completed/cancelled)

## Architecture

### Data Layer
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Tables**:
  - `scheduled_sessions`: Stores session schedule data
  - `user_profiles`: Extended with calendar connection fields

### Service Layer
- **Calendar Service** (`lib/calendar-service.ts`): Handles Google Calendar API integration
- **API Routes** (`app/api/schedule/`): Handles HTTP requests for CRUD operations

### Security
- All endpoints require authentication
- Row-level security ensures users can only access their own sessions
- Token refresh handled automatically
- Calendar tokens encrypted in database

## Database Schema

### scheduled_sessions Table

```sql
CREATE TABLE scheduled_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_config JSONB NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  calendar_event_id TEXT,
  google_calendar_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

### Session Config Structure

```json
{
  "type": "technical",
  "difficulty": "medium",
  "duration": 30,
  "role": "Senior Engineer",
  "templateId": "optional-template-id",
  "customQuestions": []
}
```

### user_profiles Calendar Fields

```sql
ALTER TABLE user_profiles ADD COLUMN google_calendar_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN google_calendar_email TEXT;
ALTER TABLE user_profiles ADD COLUMN google_calendar_refresh_token TEXT ENCRYPTED;
ALTER TABLE user_profiles ADD COLUMN google_calendar_access_token TEXT ENCRYPTED;
ALTER TABLE user_profiles ADD COLUMN google_calendar_token_expires_at TIMESTAMP WITH TIME ZONE;
```

## API Endpoints

### 1. Create Scheduled Session

**Endpoint**: `POST /api/schedule`

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "session_config": {
    "type": "behavioral",
    "difficulty": "medium",
    "duration": 30,
    "role": "Product Manager",
    "templateId": null,
    "customQuestions": null
  },
  "start_time": "2025-01-25T14:00:00Z",
  "end_time": "2025-01-25T14:30:00Z",
  "sync_to_calendar": true
}
```

**Response** (201 Created):
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "session_config": {
      "type": "behavioral",
      "difficulty": "medium",
      "duration": 30,
      "role": "Product Manager"
    },
    "start_time": "2025-01-25T14:00:00.000Z",
    "end_time": "2025-01-25T14:30:00.000Z",
    "status": "scheduled",
    "calendar_event_id": "google_event_abc123",
    "google_calendar_id": "primary",
    "calendar_synced": true,
    "created_at": "2025-01-20T12:00:00.000Z",
    "updated_at": "2025-01-20T12:00:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `500 Internal Server Error`: Server error

### 2. Get All Scheduled Sessions

**Endpoint**: `GET /api/schedule`

**Authentication**: Required

**Query Parameters**:
- `status` (optional): `scheduled`, `in_progress`, `completed`, `cancelled`
- `limit` (optional, default: 50): Number of results
- `offset` (optional, default: 0): Pagination offset

**Example**:
```bash
GET /api/schedule?status=scheduled&limit=10&offset=0
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "session_config": {...},
      "start_time": "2025-01-25T14:00:00.000Z",
      "end_time": "2025-01-25T14:30:00.000Z",
      "status": "scheduled",
      "calendar_event_id": "google_event_abc123",
      "calendar_synced": true,
      "created_at": "2025-01-20T12:00:00.000Z",
      "updated_at": "2025-01-20T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

### 3. Get Single Scheduled Session

**Endpoint**: `GET /api/schedule/{id}`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "session_config": {...},
    "start_time": "2025-01-25T14:00:00.000Z",
    "end_time": "2025-01-25T14:30:00.000Z",
    "status": "scheduled",
    "calendar_event_id": "google_event_abc123",
    "calendar_synced": true,
    "created_at": "2025-01-20T12:00:00.000Z",
    "updated_at": "2025-01-20T12:00:00.000Z"
  }
}
```

**Error Responses**:
- `404 Not Found`: Session not found
- `401 Unauthorized`: Unauthorized access

### 4. Update Scheduled Session

**Endpoint**: `PATCH /api/schedule/{id}`

**Authentication**: Required

**Request Body** (all fields optional):
```json
{
  "session_config": {
    "type": "technical",
    "difficulty": "hard",
    "duration": 45
  },
  "start_time": "2025-01-25T15:00:00Z",
  "end_time": "2025-01-25T15:45:00Z",
  "status": "in_progress",
  "sync_to_calendar": true
}
```

**Response** (200 OK):
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "session_config": {...},
    "start_time": "2025-01-25T15:00:00.000Z",
    "end_time": "2025-01-25T15:45:00.000Z",
    "status": "in_progress",
    "calendar_event_id": "google_event_abc123",
    "calendar_synced": true,
    "created_at": "2025-01-20T12:00:00.000Z",
    "updated_at": "2025-01-20T15:30:00.000Z"
  }
}
```

### 5. Delete Scheduled Session

**Endpoint**: `DELETE /api/schedule/{id}`

**Authentication**: Required

**Response** (204 No Content)

If a calendar event exists, it will be deleted from Google Calendar as well.

## Calendar Service API

The `CalendarService` class provides these methods:

### isCalendarConnected(userId: string): Promise<boolean>

Check if a user has connected their Google Calendar.

```typescript
const connected = await calendarService.isCalendarConnected(userId)
if (connected) {
  // Calendar is connected
}
```

### storeCalendarTokens()

Store Google Calendar access tokens for a user.

```typescript
await calendarService.storeCalendarTokens(
  userId,
  accessToken,
  refreshToken,
  expiresIn,
  calendarEmail
)
```

### createEvent()

Create an event in the user's Google Calendar.

```typescript
const event = await calendarService.createEvent(userId, {
  title: 'Interview Practice Session',
  description: 'Technical interview practice',
  startTime: new Date('2025-01-25T14:00:00Z'),
  endTime: new Date('2025-01-25T14:30:00Z'),
  sessionId: 'session-id'
}, 'primary')
```

### updateEvent()

Update an existing calendar event.

```typescript
const updated = await calendarService.updateEvent(
  userId,
  eventId,
  {
    title: 'Updated Title',
    startTime: new Date('2025-01-25T15:00:00Z')
  }
)
```

### deleteEvent()

Delete a calendar event.

```typescript
const success = await calendarService.deleteEvent(userId, eventId)
```

### disconnectCalendar()

Disconnect user's Google Calendar.

```typescript
await calendarService.disconnectCalendar(userId)
```

## Usage Examples

### Create and Schedule a Session

```typescript
async function scheduleInterview() {
  const response = await fetch('/api/schedule', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      session_config: {
        type: 'technical',
        difficulty: 'medium',
        duration: 30,
        role: 'Frontend Engineer'
      },
      start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      sync_to_calendar: true
    })
  })

  const result = await response.json()
  return result.data
}
```

### Fetch User's Scheduled Sessions

```typescript
async function getUserSessions() {
  const response = await fetch('/api/schedule?limit=50', {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  })

  const result = await response.json()
  return result.data
}
```

### Update Session Status

```typescript
async function startSession(sessionId) {
  const response = await fetch(`/api/schedule/${sessionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      status: 'in_progress'
    })
  })

  const result = await response.json()
  return result.data
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200 OK**: Successful GET/PATCH request
- **201 Created**: Successful POST request
- **204 No Content**: Successful DELETE request
- **400 Bad Request**: Invalid request data or validation error
- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

Error responses include a message:
```json
{
  "error": "Error message describing the problem"
}
```

## Rate Limiting

Google Calendar API rate limits:
- 1,000,000 requests per day per project
- 100 requests per second per user

The application handles rate limiting gracefully with appropriate error messages.

## Security Considerations

1. **Authentication**: All endpoints require authenticated users
2. **Row Level Security**: Supabase enforces user-level access
3. **Token Storage**: Google tokens are encrypted in the database
4. **Token Refresh**: Access tokens are automatically refreshed before expiration
5. **Scope Limitation**: Only calendar.events permission is requested
6. **HTTPS**: All production requests must use HTTPS

## Testing

### Test Coverage

Tests should be created for:

**Unit Tests** (e.g., `__tests__/lib/calendar-service.test.ts`):
- Token refresh logic
- Calendar event CRUD operations
- Token expiration handling
- Error handling

**Integration Tests** (e.g., `__tests__/api/schedule.test.ts`):
- Creating scheduled sessions
- Fetching sessions with filtering
- Updating sessions
- Deleting sessions
- Calendar sync functionality
- Authentication validation
- RLS policy enforcement

### Running Tests

```bash
npm test
```

### Testing with mocked Google Calendar API

To test without real Google Calendar credentials:

```typescript
// Mock the calendar service
jest.mock('@/lib/calendar-service', () => ({
  calendarService: {
    createEvent: jest.fn().mockResolvedValue({ id: 'event-123' }),
    updateEvent: jest.fn().mockResolvedValue({ id: 'event-123' }),
    deleteEvent: jest.fn().mockResolvedValue(true),
  }
}))
```

## Migration Guide

To add scheduling to an existing installation:

1. Run the database migrations:
   ```sql
   -- Copy and run: supabase/migrations/003_scheduled_sessions.sql
   -- Copy and run: supabase/migrations/004_add_calendar_to_user_profiles.sql
   ```

2. Add environment variables to `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

3. Redeploy the application

## Troubleshooting

### Issue: "No valid access token"
- Ensure user has connected their Google Calendar
- Check token hasn't expired
- Verify Google OAuth credentials

### Issue: "Session not found"
- Verify the session ID is correct
- Ensure you're authenticated as the session owner

### Issue: "Invalid datetime format"
- Ensure datetime strings are ISO 8601 format (e.g., `2025-01-25T14:00:00Z`)
- Use `toISOString()` on JavaScript Date objects

## Support

For issues or questions about the scheduling API, refer to:
- `CALENDAR_INTEGRATION_SETUP.md` - Google Calendar setup guide
- `README.md` - General setup instructions
- API tests in `__tests__/` - Usage examples
