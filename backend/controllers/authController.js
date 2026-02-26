import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/* =========================
   Helper: Generate JWT
========================= */
const generateToken = (userId, email) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing');
  }

  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
};

/* =========================
   REGISTER
========================= */
export const register = async (req, res) => {
  try {
    let {
      username,
      email,
      password,
      dateOfBirth,
      collegeName,
      currentYear
    } = req.body;

    // Normalize email
    email = email.toLowerCase();

    console.log('Registration attempt for email:', email, 'username:', username);

    // Check existing user
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      console.log('User already exists:', existingUser.email === email ? 'email' : 'username');
      return res.status(409).json({
        success: false,
        error: {
          message:
            existingUser.email === email
              ? 'Email already registered'
              : 'Username already taken',
          field:
            existingUser.email === email ? 'email' : 'username'
        }
      });
    }

    // Create user
    const user = new User({
      username,
      email,
      password,
      dateOfBirth,
      collegeName,
      currentYear
    });

    await user.save();
    console.log('User created successfully:', user.email);

    // Token
    const token = generateToken(user._id, user.email);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          collegeName: user.collegeName,
          currentYear: user.currentYear,
          preferences: user.preferences,
          onboarding: user.onboarding
        }
      }
    });
  } catch (error) {
    console.error('REGISTER ERROR:', error);

    res.status(500).json({
      success: false,
      error: {
        message: 'Server error during registration'
      }
    });
  }
};

/* =========================
   LOGIN
========================= */
export const login = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase();
    const { password } = req.body;

    console.log('Login attempt for email:', email);

    const user = await User.findOne({ email }).select('+password');

    console.log('User found:', user ? 'YES' : 'NO');
    if (user) {
      console.log('User email:', user.email);
      console.log('Password provided length:', password.length);
    }

    if (!user) {
      console.log('No user found with email:', email);
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      });
    }

    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      console.log('Password does not match for user:', user.email);
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      });
    }

    const token = generateToken(user._id, user.email);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          preferences: user.preferences,
          onboarding: user.onboarding
        }
      }
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error);

    res.status(500).json({
      success: false,
      error: { message: 'Server error during login' }
    });
  }
};

/* =========================
   VERIFY TOKEN
========================= */
export const verifyToken = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          preferences: user.preferences,
          onboarding: user.onboarding
        }
      }
    });
  } catch (error) {
    console.error('VERIFY ERROR:', error);

    res.status(500).json({
      success: false,
      error: { message: 'Token verification failed' }
    });
  }
};

/* =========================
   CREATE TEST USER (DEVELOPMENT ONLY)
========================= */
export const createTestUser = async (req, res) => {
  try {
    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });

    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: 'Test user already exists',
        data: {
          email: 'test@example.com',
          password: 'password123'
        }
      });
    }

    // Create test user
    const testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      collegeName: 'Test College',
      currentYear: '3rd Year'
    });

    await testUser.save();

    console.log('Test user created:', testUser.email);

    res.status(201).json({
      success: true,
      message: 'Test user created successfully',
      data: {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser'
      }
    });
  } catch (error) {
    console.error('CREATE TEST USER ERROR:', error);

    res.status(500).json({
      success: false,
      error: { message: 'Failed to create test user' }
    });
  }
};


/* =========================
   GOOGLE OAUTH CALLBACK
========================= */
export const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
    }

    // Generate JWT token
    const token = generateToken(user._id, user.email);

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=server_error`);
  }
};
