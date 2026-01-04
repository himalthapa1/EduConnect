import mongoose from 'mongoose';

const studyWithMeSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [100, 'Subject must not exceed 100 characters']
    },
    studyMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 480 // 8 hours max
    },
    breakMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 60 // 1 hour max break
    },
    actualDuration: {
      type: Number,
      default: 0,
      min: 0
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [5000, 'Notes must not exceed 5000 characters']
    },
    resources: [{
      title: String,
      resourceType: {
        type: String,
        enum: ['pdf', 'video', 'article', 'link', 'file', 'resource', 'note']
      },
      url: String,
      file: String
    }],
    status: {
      type: String,
      enum: ['active', 'completed', 'paused'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

/* =========================
   INDEXES
========================= */
studyWithMeSessionSchema.index({ userId: 1, createdAt: -1 });
studyWithMeSessionSchema.index({ status: 1, userId: 1 });

/* =========================
   METHODS
========================= */
studyWithMeSessionSchema.methods.complete = async function (notes = null) {
  this.status = 'completed';
  this.endTime = new Date();
  this.actualDuration = Math.floor((this.endTime - this.startTime) / 1000 / 60); // minutes
  if (notes !== null) {
    this.notes = notes;
  }
  return this.save();
};

studyWithMeSessionSchema.methods.pause = async function () {
  this.status = 'paused';
  return this.save();
};

studyWithMeSessionSchema.methods.resume = async function () {
  this.status = 'active';
  return this.save();
};

const StudyWithMeSession = mongoose.model('StudyWithMeSession', studyWithMeSessionSchema);
export default StudyWithMeSession;
