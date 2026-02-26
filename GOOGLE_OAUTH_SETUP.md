# Google OAuth Setup Guide

## Prerequisites
- Google Cloud Console account
- EduConnect backend and frontend running

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Configure the OAuth consent screen if prompted:
   - User Type: External
   - App name: EduConnect
   - User support email: your email
   - Developer contact: your email
6. Select **Application type**: Web application
7. Add **Authorized JavaScript origins**:
   - `http://localhost:5173` (frontend)
   - `http://localhost:3004` (backend)
8. Add **Authorized redirect URIs**:
   - `http://localhost:3004/api/auth/google/callback`
9. Click **Create**
10. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Backend

1. Open `backend/.env` file
2. Add the following variables:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3004/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

3. Replace `your_client_id_here` and `your_client_secret_here` with your actual credentials

## Step 3: Test the Integration

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Start the frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to `http://localhost:5173/login` or `http://localhost:5173/register`
4. Click the **"Continue with Google"** button
5. Sign in with your Google account
6. You should be redirected back to the dashboard

## How It Works

1. User clicks "Continue with Google"
2. Frontend redirects to `/api/auth/google`
3. Backend redirects to Google OAuth consent screen
4. User authorizes the app
5. Google redirects back to `/api/auth/google/callback`
6. Backend creates/finds user and generates JWT token
7. Backend redirects to frontend `/auth/callback?token=...`
8. Frontend stores token and redirects to dashboard/onboarding

## Features

- ✅ Automatic user creation on first Google sign-in
- ✅ Email-based user matching for existing accounts
- ✅ Unique username generation
- ✅ JWT token authentication
- ✅ Onboarding flow for new users
- ✅ Works alongside traditional email/password auth

## Production Deployment

For production, update the following:

1. **Google Cloud Console**:
   - Add production URLs to authorized origins and redirect URIs
   - Example: `https://yourdomain.com`

2. **Backend .env**:
   ```env
   GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
   FRONTEND_URL=https://yourdomain.com
   ```

## Troubleshooting

### "redirect_uri_mismatch" error
- Ensure the redirect URI in Google Console exactly matches the one in your .env
- Check for trailing slashes

### "invalid_client" error
- Verify Client ID and Client Secret are correct
- Ensure credentials are from the correct Google Cloud project

### User not redirected after sign-in
- Check browser console for errors
- Verify FRONTEND_URL is correct in backend .env
- Ensure frontend is running on the specified port

## Security Notes

- Never commit `.env` files to version control
- Keep Client Secret confidential
- Use HTTPS in production
- Regularly rotate credentials
- Implement rate limiting on auth endpoints
