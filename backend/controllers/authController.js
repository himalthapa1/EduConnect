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

    // Check existing user
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
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
          currentYear: user.currentYear
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

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
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
          email: user.email
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
          email: user.email
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
