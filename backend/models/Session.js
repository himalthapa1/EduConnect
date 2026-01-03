import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

// Resources subdocument schema for sessions
const sessionResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Resource title is required'],
    trim: true,
    maxlength: [200, 'Title must not exceed 200 characters']
  },
  url: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description must not exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['resource', 'note'],
    default: 'resource'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const sessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: 50
    },
    date: {
      type: Date,
      required: [true, 'Session date is required']
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)']
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:mm)']
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: 100
    },
    maxParticipants: {
      type: Number,
      required: true,
      min: 1,
      max: 50
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGroup',
      required: false
    },
    participants: [participantSchema],
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes must not exceed 2000 characters']
    },
    resources: [sessionResourceSchema],
    completedAt: {
      type: Date
    },
    isPublic: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

/* =========================
   INDEXES
========================= */
sessionSchema.index({ date: 1, startTime: 1 });
sessionSchema.index({ organizer: 1 });
sessionSchema.index({ 'participants.user': 1 });

/* =========================
   VIRTUALS
========================= */
sessionSchema.virtual('isFull').get(function () {
  return this.participants.length >= this.maxParticipants;
});

/* =========================
   METHODS
========================= */
sessionSchema.methods.addParticipant = async function (userId) {
  if (this.isFull) {
    throw new Error('Session is full');
  }

  const exists = this.participants.some(
    (p) => p.user.toString() === userId.toString()
  );

  if (exists) {
    throw new Error('User already joined this session');
  }

  this.participants.push({ user: userId });
  return this.save();
};

sessionSchema.methods.removeParticipant = async function (userId) {
  this.participants = this.participants.filter(
    (p) => p.user.toString() !== userId.toString()
  );
  return this.save();
};

sessionSchema.methods.completeSession = async function (notes = null) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (notes) {
    this.notes = notes;
  }
  return this.save();
};

sessionSchema.methods.addNotes = async function (notes) {
  this.notes = notes;
  return this.save();
};

sessionSchema.methods.addResource = async function (resourceData) {
  this.resources.push(resourceData);
  return this.save();
};

const Session = mongoose.model('Session', sessionSchema);
export default Session;
