# Google Calendar Integration Setup

This guide explains how to set up Google Calendar integration for scheduling interview practice sessions.

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Google OAuth for Calendar Integration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Supabase (if not already set)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Google Cloud Console Setup

### 1. Enable Google Calendar API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Go to **APIs & Services → Enabled APIs & services**
4. Click **+ ENABLE APIS AND SERVICES**
5. Search for **Google Calendar API**
6. Click the result and press **ENABLE**

### 2. Configure OAuth Consent Screen

Navigate to **APIs & Services → OAuth consent screen**:

1. Choose **External** user type
2. Fill in basic info:
   - App name: `AI Interview Assistant`
   - User support email: Your email
   - Developer contact: Your email
3. On the Scopes page, add these scopes:
   - `https://www.googleapis.com/auth/calendar` - Manage Google Calendar
   - `https://www.googleapis.com/auth/calendar.events` - Manage calendar events
4. Add test users for development
5. Save and continue

### 3. Create OAuth 2.0 Credentials

Navigate to **APIs & Services → Credentials**:

1. Click **Create Credentials → OAuth 2.0 Client ID**
2. Select **Web application**
3. Name: `AI Interview Assistant - Calendar`
4. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://yourdomain.com (for production)
   ```
5. **Authorized redirect URIs** - Add:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/api/auth/calendar/callback
   [YOUR_SUPABASE_PROJECT_URL]/auth/v1/callback
   ```
6. Save and copy your **Client ID** and **Client Secret**

## Database Setup

Run these migrations in your Supabase SQL Editor:

1. **Scheduled Sessions Migration** - Creates the `scheduled_sessions` table:
   ```sql
   -- Copy content from: supabase/migrations/003_scheduled_sessions.sql
   ```

2. **Calendar Fields Migration** - Adds calendar fields to user profiles:
   ```sql
   -- Copy content from: supabase/migrations/004_add_calendar_to_user_profiles.sql
   ```

## API Endpoints

### Create Scheduled Session

```bash
POST /api/schedule
```

**Request Body:**
```json
{
  "session_config": {
    "type": "behavioral",
    "difficulty": "medium",
    "duration": 30,
    "role": "Software Engineer"
  },
  "start_time": "2025-01-20T14:00:00Z",
  "end_time": "2025-01-20T14:30:00Z",
  "sync_to_calendar": true
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "session_config": {...},
    "start_time": "2025-01-20T14:00:00Z",
    "end_time": "2025-01-20T14:30:00Z",
    "status": "scheduled",
    "calendar_event_id": "google_event_id",
    "google_calendar_id": "primary",
    "calendar_synced": true,
    "created_at": "2025-01-20T12:00:00Z",
    "updated_at": "2025-01-20T12:00:00Z"
  }
}
```

### Get Scheduled Sessions

```bash
GET /api/schedule?status=scheduled&limit=50&offset=0
```

**Query Parameters:**
- `status` (optional): Filter by status (`scheduled`, `in_progress`, `completed`, `cancelled`)
- `limit` (optional, default: 50): Number of results to return
- `offset` (optional, default: 0): Pagination offset

### Get Single Scheduled Session

```bash
GET /api/schedule/{id}
```

### Update Scheduled Session

```bash
PATCH /api/schedule/{id}
```

**Request Body:**
```json
{
  "start_time": "2025-01-20T15:00:00Z",
  "status": "in_progress",
  "sync_to_calendar": true
}
```

### Delete Scheduled Session

```bash
DELETE /api/schedule/{id}
```

## Calendar Service Methods

The `CalendarService` provides these methods:

### Create Event

```typescript
const event = await calendarService.createEvent(userId, {
  title: 'Interview Practice Session',
  description: 'Technical interview practice',
  startTime: new Date(),
  endTime: new Date(Date.now() + 30 * 60000),
  sessionId: 'session-id'
})
```

### Update Event

```typescript
const updated = await calendarService.updateEvent(userId, eventId, {
  title: 'Updated Session Title',
  startTime: new Date()
})
```

### Delete Event

```typescript
const success = await calendarService.deleteEvent(userId, eventId)
```

### Check Calendar Connection

```typescript
const isConnected = await calendarService.isCalendarConnected(userId)
```

### Store Calendar Tokens

```typescript
await calendarService.storeCalendarTokens(
  userId,
  accessToken,
  refreshToken,
  expiresIn,
  calendarEmail
)
```

### Disconnect Calendar

```typescript
await calendarService.disconnectCalendar(userId)
```

## Testing

### Manual Testing Steps

1. Sign in to the application
2. Navigate to the calendar integration settings
3. Click "Connect Google Calendar"
4. Grant permissions for calendar access
5. Create a new scheduled session with `sync_to_calendar: true`
6. Verify the event appears in your Google Calendar

### Programmatic Testing

```bash
# Create a scheduled session
curl -X POST http://localhost:3000/api/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "session_config": {
      "type": "technical",
      "difficulty": "hard",
      "duration": 45,
      "role": "Senior Engineer"
    },
    "start_time": "2025-01-25T10:00:00Z",
    "sync_to_calendar": true
  }'

# Get all sessions
curl -X GET http://localhost:3000/api/schedule \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"

# Update a session
curl -X PATCH http://localhost:3000/api/schedule/{id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "status": "in_progress"
  }'

# Delete a session
curl -X DELETE http://localhost:3000/api/schedule/{id} \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

## Data Security

- **Token Storage**: Google Calendar tokens are encrypted in the database
- **RLS Policies**: Supabase Row Level Security ensures users can only access their own data
- **Token Refresh**: Access tokens are automatically refreshed before expiration
- **Scope Limitation**: Only calendar.events permission is requested

## Troubleshooting

### "No valid access token" Error

- Ensure user has connected their Google Calendar
- Check that token hasn't expired in the database
- Verify Google OAuth credentials are correctly set

### "Invalid redirect URI" Error

- Make sure redirect URIs match exactly in Google Cloud Console
- Include both localhost and production URLs
- Check for trailing slashes

### Calendar Event Not Syncing

- Verify `sync_to_calendar` is set to `true` in request
- Check that user has granted calendar permissions
- Review server logs for API errors

## Rate Limiting

Google Calendar API has rate limits:
- 1,000,000 requests per day per project
- 100 requests per second per user

The application handles rate limiting with retry logic.

## Production Considerations

1. **OAuth Consent Screen Verification**: Submit for verification if your app is public
2. **HTTPS Required**: Ensure your redirect URIs use HTTPS
3. **Error Handling**: Implement proper error handling and user notifications
4. **Token Refresh**: Monitor token expiration and implement refresh flows
5. **Monitoring**: Log calendar sync operations for debugging
