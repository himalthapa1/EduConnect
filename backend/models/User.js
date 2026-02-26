import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 30,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: function() {
        // Password is required only if googleId is not present
        return !this.googleId;
      },
      minlength: 6,
      select: false, // 🔒 never return password by default
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows null values to be non-unique
    },

    dateOfBirth: {
      type: Date,
    },

    collegeName: {
      type: String,
      trim: true,
    },

    currentYear: {
      type: String,
      enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Other'],
      default: '1st Year',
    },

    preferences: {
      interests: {
        type: [String],
        default: [],
      },
      skillsLevel: {
        type: Map,
        of: String, // 'beginner', 'intermediate', 'advanced'
        default: new Map(),
      },
      studyTimePreference: {
        type: [String],
        enum: ['morning', 'afternoon', 'evening', 'night'],
        default: [],
      },
    },

    onboarding: {
      completed: {
        type: Boolean,
        default: false,
      },
    },

    // Recommendation tracking
    joinedGroups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudyGroup',
      },
    ],

    attendedSessions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
      },
    ],

    activityScore: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

/* =========================
   🔒 HASH PASSWORD (SAFE)
   - Hash ONLY when password changes
   - Prevents double-hashing bug
========================= */
userSchema.pre('save', async function (next) {
  try {
    // ✅ CRITICAL GUARD
    if (!this.isModified('password')) {
      return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    return next();
  } catch (err) {
    return next(err);
  }
});

/* =========================
   COMPARE PASSWORD
========================= */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
