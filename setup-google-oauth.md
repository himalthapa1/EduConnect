# Quick Google OAuth Setup

## Step-by-Step Instructions

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Create/Select Project
- Click "Select a project" at the top
- Click "NEW PROJECT"
- Name it "EduConnect" (or any name)
- Click "CREATE"

### 3. Enable Google+ API
- Go to: https://console.cloud.google.com/apis/library
- Search for "Google+ API"
- Click on it and click "ENABLE"

### 4. Configure OAuth Consent Screen
- Go to: https://console.cloud.google.com/apis/credentials/consent
- Select "External" user type
- Click "CREATE"
- Fill in:
  - App name: **EduConnect**
  - User support email: **your email**
  - Developer contact: **your email**
- Click "SAVE AND CONTINUE"
- Skip scopes (click "SAVE AND CONTINUE")
- Add test users if needed
- Click "SAVE AND CONTINUE"

### 5. Create OAuth Client ID
- Go to: https://console.cloud.google.com/apis/credentials
- Click "CREATE CREDENTIALS" > "OAuth client ID"
- Application type: **Web application**
- Name: **EduConnect Web Client**
- Authorized JavaScript origins:
  ```
  http://localhost:5173
  http://localhost:3004
  ```
- Authorized redirect URIs:
  ```
  http://localhost:3004/api/auth/google/callback
  ```
- Click "CREATE"

### 6. Copy Credentials
You'll see a popup with:
- **Client ID**: Copy this (looks like: 123456789-abc.apps.googleusercontent.com)
- **Client Secret**: Copy this (looks like: GOCSPX-abc123...)

### 7. Add to Backend .env File

Open `backend/.env` and add these lines:

```env
GOOGLE_CLIENT_ID=paste_your_client_id_here
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3004/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

### 8. Restart Backend Server

After adding credentials, restart the backend:
```bash
# Stop the current backend (Ctrl+C)
# Then start again:
cd backend
npm start
```

You should see: ✅ Google OAuth Strategy initialized

### 9. Test It!

1. Go to http://localhost:5173/login
2. Click "Continue with Google"
3. Sign in with your Google account
4. You'll be redirected back and logged in!

## Troubleshooting

**Error: "redirect_uri_mismatch"**
- Make sure the redirect URI in Google Console exactly matches:
  `http://localhost:3004/api/auth/google/callback`

**Error: "invalid_client"**
- Double-check your Client ID and Client Secret
- Make sure there are no extra spaces

**Button doesn't work**
- Check backend console for errors
- Make sure backend is running on port 3004
- Verify credentials are in .env file

## Quick Test Credentials

If you want to test quickly, you can use a test Google account:
1. Create a new Gmail account for testing
2. Use it to sign in via Google OAuth
3. It will create a new user in your database automatically
