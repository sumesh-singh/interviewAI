# Modern Google OAuth Setup Guide (2025)

## Quick Start - What You Actually Need to Do

Since Google+ API is deprecated, here's the modern approach that your app already uses correctly:

### Step 1: Google Cloud Console Setup

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create a new project** (or select existing)
3. **NO APIs to enable!** - Basic OAuth 2.0 profile access works without any API enablement

### Step 2: Configure OAuth Consent Screen

Navigate to **APIs & Services → OAuth consent screen**:

1. Choose **External** user type
2. Fill in basic info:
   - App name: `AI Interview Assistant`
   - User support email: Your email
   - Developer contact: Your email
3. **Scopes**: Just click through - basic scopes (email, profile, openid) are automatic
4. Add test users for development
5. Save and continue

### Step 3: Create OAuth 2.0 Credentials

Navigate to **APIs & Services → Credentials**:

1. Click **Create Credentials → OAuth 2.0 Client ID**
2. Select **Web application**
3. Name: `AI Interview Assistant`
4. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   ```
5. **Authorized redirect URIs** - Add these:
   ```
   http://localhost:3000/auth/callback
   [YOUR_SUPABASE_PROJECT_URL]/auth/v1/callback
   ```
   (You'll get the Supabase URL in next step)

6. **Save** and copy your **Client ID** and **Client Secret**

### Step 4: Configure Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to **Authentication → Providers**
3. Find **Google** and enable it
4. Enter:
   - Client ID (from Step 3)
   - Client Secret (from Step 3)
5. **Copy the Callback URL** shown (looks like: `https://[project-ref].supabase.co/auth/v1/callback`)
6. **Go back to Google Console** and add this URL to Authorized redirect URIs

### Step 5: Configure Supabase URLs

In Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000`
- **Redirect URLs** (add all):
  ```
  http://localhost:3000/auth/callback
  http://localhost:3000/auth/username-setup
  http://localhost:3000/dashboard
  ```

### Step 6: Run Database Migrations

In Supabase SQL Editor, run these migrations in order:

```sql
-- First, run the email verification tokens migration
-- Copy content from: supabase/migrations/001_email_verification_tokens.sql

-- Then, run the user profiles migration  
-- Copy content from: supabase/migrations/002_user_profiles.sql
```

### Step 7: Update Your Environment Variables

In your `.env.local`:

```bash
# These are required
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# OpenAI for the interview features
OPENAI_API_KEY=your_openai_key_here
```

### Step 8: Test It!

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/register`

3. Click "Continue with Google"

4. You should see:
   - Consent modal in your app
   - Google sign-in page
   - Redirect to username setup (first time)
   - Finally land on dashboard

## What Your Code Already Does Right ✅

Your `lib/auth/google-oauth.ts` already uses the modern approach:

- ✅ Uses OAuth 2.0 (not Google+ API)
- ✅ Only requests basic scopes: `openid email profile`
- ✅ Gets user info via `https://www.googleapis.com/oauth2/v2/userinfo`
- ✅ Handles everything through Supabase OAuth integration

## Common Issues & Solutions

### "Google+ API deprecated" error
**You won't see this!** Your code doesn't use Google+ API.

### "Invalid redirect URI" error
- Make sure URLs match EXACTLY (including trailing slashes)
- Add both localhost and Supabase callback URLs

### No user data after sign-in
- Check that scopes are set correctly in your code (they are)
- Verify Supabase provider configuration

### "Access blocked" or consent screen issues
- For development: Add your email as a test user
- For production: Submit OAuth consent screen for verification

## Testing Checklist

- [ ] Google signup with new account works
- [ ] Username setup page appears for new users
- [ ] Existing users can sign in directly
- [ ] Profile picture and name are retrieved
- [ ] Logout works correctly
- [ ] Error handling shows appropriate messages

## Production Notes

Before going live:
1. Add production URLs to Google OAuth configuration
2. Submit OAuth consent screen for Google verification (if public)
3. Update environment variables on your hosting platform
4. Test with a fresh Google account

That's it! No Google+ API needed - just standard OAuth 2.0 🎉
