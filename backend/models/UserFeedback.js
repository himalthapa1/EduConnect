import mongoose from 'mongoose';

const userFeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGroup',
      required: true,
      index: true
    },
    action: {
      type: String,
      enum: ['not_interested', 'hide'],
      default: 'not_interested'
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 200
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for efficient queries
userFeedbackSchema.index({ userId: 1, groupId: 1 }, { unique: true });
userFeedbackSchema.index({ userId: 1, timestamp: -1 });

// Static method to check if user has negative feedback for a group
userFeedbackSchema.statics.hasNegativeFeedback = async function (userId, groupId) {
  const feedback = await this.findOne({ userId, groupId });
  return !!feedback;
};

// Static method to get all groups user is not interested in
userFeedbackSchema.statics.getExcludedGroups = async function (userId) {
  const feedbacks = await this.find({ userId }).select('groupId');
  return feedbacks.map(f => f.groupId.toString());
};

const UserFeedback = mongoose.model('UserFeedback', userFeedbackSchema);

export default UserFeedback;
