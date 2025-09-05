# Google OAuth Setup Guide

This guide walks you through setting up Google OAuth authentication for your InterviewAI application.

## Prerequisites

- Supabase project set up
- Google Cloud Console account
- Domain configured (for production)

## Step 1: Create Google OAuth Application

### 1.1 Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. **No APIs need to be manually enabled** - OAuth 2.0 for basic profile access works without enabling additional APIs

### 1.2 Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Fill in the required information:
   - **App name**: AI Interview Assistant
   - **User support email**: Your support email
   - **Developer contact information**: Your email
4. Add scopes (these are automatically handled by OAuth 2.0):
   - `email` - Access to email address
   - `profile` - Access to basic profile information
   - `openid` - OpenID Connect authentication
5. Add test users (for development)
6. Save and continue

### 1.3 Create OAuth Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Configure:
   - **Name**: AI Interview Assistant
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/auth/callback` (development)
     - `https://yourdomain.com/auth/callback` (production)
     - Your Supabase callback URL (see Step 2)

5. Save and note down the **Client ID** and **Client Secret**

## Step 2: Configure Supabase

### 2.1 Enable Google OAuth in Supabase
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** and click to configure
4. Enable Google authentication
5. Enter your Google OAuth credentials:
   - **Client ID**: From Step 1.3
   - **Client Secret**: From Step 1.3
6. Note the **Callback URL** provided by Supabase
7. Copy this callback URL and add it to your Google OAuth configuration (Step 1.3)

### 2.2 Configure Redirect URLs
1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Add your redirect URLs:
   - **Site URL**: `http://localhost:3000` (development) / `https://yourdomain.com` (production)
   - **Redirect URLs**: Add the following:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/auth/username-setup`
     - `https://yourdomain.com/auth/callback` (production)
     - `https://yourdomain.com/auth/username-setup` (production)

## Step 3: Run Database Migrations

Execute the following migrations in your Supabase SQL editor:

### 3.1 Email Verification Tokens (if not already done)
```sql
-- Run the content from: supabase/migrations/001_email_verification_tokens.sql
```

### 3.2 User Profiles
```sql
-- Run the content from: supabase/migrations/002_user_profiles.sql
```

## Step 4: Update Environment Variables

Add the following to your `.env.local` file:

```bash
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google OAuth (optional - already configured in Supabase)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Step 5: Test the Integration

### 5.1 Development Testing
1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/auth/register`
3. Click "Continue with Google"
4. Review the consent modal
5. Complete the OAuth flow
6. Check that you're redirected to username setup
7. Complete username setup
8. Verify you're redirected to dashboard

### 5.2 Test Cases
- [ ] Google signup with new email
- [ ] Google signup with existing email
- [ ] Google login with existing account
- [ ] Username availability checking
- [ ] Username generation
- [ ] Profile data extraction from Google
- [ ] Consent modal functionality
- [ ] Error handling for OAuth failures

## Step 6: Production Deployment

### 6.1 Update Environment Variables
Update your production environment variables with:
- Production domain URLs
- Production Supabase keys
- Production Google OAuth credentials

### 6.2 Update Google OAuth Configuration
1. Add production domain to **Authorized JavaScript origins**
2. Add production callback URLs to **Authorized redirect URIs**
3. Publish your OAuth consent screen (if you want public access)

## User Flow

### First-time Google Signup
1. User clicks "Continue with Google" on register page
2. Consent modal shows what data will be collected
3. User consents and is redirected to Google
4. Google authentication completes
5. User is redirected back to app
6. Username setup page appears
7. User chooses username
8. Profile is created with Google data
9. User is redirected to dashboard

### Returning Google Login
1. User clicks "Continue with Google" on login page
2. Consent modal shows (can be customized for returning users)
3. User authenticates with Google
4. User is directly redirected to dashboard

## Data Collected from Google

With user consent, the following information is collected:

### Required Data
- **Email address**: For account identification
- **Full name**: For profile personalization
- **Google ID**: For account linking

### Optional Data
- **Profile picture**: For avatar (user can change later)

### Data Usage
- Account creation and management
- Profile personalization
- Email notifications
- Customer support

### Privacy Compliance
- Clear consent process
- Minimal data collection
- User control over data
- Secure data storage
- Easy account deletion

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Check that all redirect URIs are properly configured in Google Cloud Console
   - Ensure URLs match exactly (including http/https and trailing slashes)

2. **"Client not found" error**
   - Verify Client ID and Secret in Supabase configuration
   - Check that Google OAuth app is not in testing mode for production

3. **User not redirected to username setup**
   - Check database migrations were run successfully
   - Verify user_profiles table exists and has correct structure

4. **Username availability not working**
   - Check that `is_username_available` function exists in database
   - Verify RPC permissions in Supabase

### Debug Tips
- Check browser console for client-side errors
- Check Supabase logs for authentication errors
- Test OAuth flow in incognito mode
- Verify environment variables are loaded correctly
- Check network tab for failed API requests

## Security Considerations

1. **Minimal Scopes**: Only request necessary permissions (email, profile)
2. **Consent Process**: Clear explanation of data usage
3. **Token Security**: Secure storage of OAuth tokens
4. **Data Protection**: Follow GDPR/privacy regulations
5. **Revocation**: Users can revoke access through Google account settings

## Support

If you encounter issues:
1. Check this documentation first
2. Review Supabase and Google Cloud Console configurations
3. Test in development environment
4. Check logs for specific error messages
5. Verify all environment variables are correct
