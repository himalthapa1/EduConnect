import './env.js'; // Load environment variables first
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy - Only initialize if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3004/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // User exists, return user
            return done(null, user);
          }

          // Generate username (max 30 chars)
          // Use first part of email + random 6-digit number
          const emailPrefix = profile.emails[0].value.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          const randomSuffix = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
          let username = `${emailPrefix}_${randomSuffix}`;
          
          // Ensure username is max 30 characters
          if (username.length > 30) {
            username = `${emailPrefix.substring(0, 23)}_${randomSuffix}`;
          }

          // Create new user
          user = await User.create({
            username: username,
            email: profile.emails[0].value,
            password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8), // Random password
            googleId: profile.id,
            onboarding: {
              completed: false
            }
          });

          done(null, user);
        } catch (error) {
          done(error, null);
        }
      }
    )
  );
  console.log('✅ Google OAuth Strategy initialized');
} else {
  console.log('⚠️  Google OAuth credentials not found. Google sign-in will be disabled.');
}

export default passport;
