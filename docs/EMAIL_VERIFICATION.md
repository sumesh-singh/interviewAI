# Enhanced Email Verification System

This document describes the improved email verification system implemented for the InterviewAI application.

## Features

- ✅ **2-minute expiration**: Verification links expire exactly 2 minutes after generation
- ✅ **Resend functionality**: Users can request new verification emails with rate limiting
- ✅ **Token-based verification**: Custom verification tokens with database tracking
- ✅ **User-friendly UI**: Clear verification status and error handling
- ✅ **Security**: Tokens are single-use and automatically invalidated
- ✅ **Rate limiting**: Prevents spam with 2-minute cooldown on resend requests

## How It Works

### 1. User Registration Flow

1. User fills out the registration form
2. Account is created in Supabase (email unconfirmed)
3. Custom verification token is generated with 2-minute expiration
4. Verification email is sent with the token
5. User is redirected to the verification page

### 2. Email Verification Process

1. User receives email with verification link
2. Clicking the link triggers verification (via GET request)
3. Token is validated and marked as used
4. User's email is confirmed in Supabase
5. User is redirected to success page

### 3. Resend Verification

1. User can request a new verification email
2. System invalidates all existing tokens for that email
3. New token is generated with fresh 2-minute expiration
4. Rate limiting prevents abuse (2-minute cooldown)

## Database Schema

### `email_verification_tokens` Table

```sql
CREATE TABLE email_verification_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### POST `/api/auth/send-verification`

Sends a verification email to the specified email address.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully."
}
```

### POST `/api/auth/verify-email`

Verifies an email using a token.

**Request Body:**
```json
{
  "token": "verification_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully!",
  "email": "user@example.com"
}
```

### GET `/api/auth/verify-email?token=...`

Direct link verification (used in email links).

## Pages

### `/auth/register`
- Updated to use custom verification system
- Automatically sends verification email after registration

### `/auth/verify`
- Main verification page with multiple states:
  - Default: Instructions and resend option
  - Loading: Shows while verifying token
  - Success: Confirmation of successful verification
  - Error: Error messages with resend option

### `/auth/callback`
- Updated to handle both Supabase auth codes and custom tokens
- Supports backward compatibility

## Email Configuration

### Development
In development mode, verification URLs are logged to the console since no email service is configured by default.

### Production Email Setup

You can configure email sending using various providers. Update the `sendVerificationEmail` method in `lib/email/email-service.ts`:

#### Option 1: SendGrid
```typescript
// In sendVerificationEmail method
const response = await fetch('https://api.sendgrid.v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    personalizations: [{
      to: [{ email }],
      subject: 'Verify your email address'
    }],
    from: { email: process.env.SENDGRID_FROM_EMAIL },
    content: [{
      type: 'text/html',
      value: emailHtml
    }]
  })
})
```

#### Option 2: Resend
```typescript
// In sendVerificationEmail method
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: process.env.RESEND_FROM_EMAIL,
    to: [email],
    subject: 'Verify your email address',
    html: emailHtml
  })
})
```

## Environment Variables

Required environment variables:

```bash
# Basic configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# For SendGrid
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# For Resend
RESEND_API_KEY=your_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

## Security Features

1. **Time-based expiration**: Tokens expire in exactly 2 minutes
2. **Single-use tokens**: Tokens are marked as used after verification
3. **Rate limiting**: Prevents spam with cooldown periods
4. **Token invalidation**: Old tokens are invalidated when new ones are generated
5. **Secure token generation**: Uses `nanoid` for cryptographically secure tokens

## Database Maintenance

The system includes a cleanup function for expired tokens:

```sql
SELECT cleanup_expired_verification_tokens();
```

You can set up a cron job to run this periodically to keep the database clean.

## Migration Instructions

1. Run the migration script: `supabase/migrations/001_email_verification_tokens.sql`
2. Update your environment variables
3. Configure your email service provider
4. Deploy the updated code

## Testing

### Manual Testing
1. Register a new account
2. Check that verification email is sent/logged
3. Test the verification link (within 2 minutes)
4. Test expired link behavior (after 2 minutes)
5. Test resend functionality
6. Test rate limiting on resend

### Verification States to Test
- ✅ Successful verification
- ❌ Expired token
- ❌ Already used token
- ❌ Invalid token
- ❌ Missing token
- 🔄 Resend functionality
- ⏱️ Rate limiting

## Troubleshooting

### Common Issues

1. **Verification emails not sending**
   - Check email service configuration
   - Verify environment variables
   - Check console logs in development

2. **Tokens expiring too quickly**
   - Confirm server time is correct
   - Check token generation logic

3. **Database errors**
   - Ensure migration was run successfully
   - Check Supabase connection and permissions

4. **Rate limiting too strict**
   - Adjust cooldown period in the verification page
   - Check `hasPendingVerification` logic

### Debug Tips

- Check browser console for client-side errors
- Check server logs for API errors
- Verify database records in Supabase dashboard
- Test with different email addresses
- Check network tab for failed requests
