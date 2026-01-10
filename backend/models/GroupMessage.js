import mongoose from 'mongoose';

const groupMessageSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: [true, 'Group ID is required']
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [2000, 'Message must not exceed 2000 characters']
  },
  type: {
    type: String,
    enum: ['text', 'voice', 'poll'],
    default: 'text'
  },
  // For voice messages
  audioUrl: {
    type: String,
    trim: true
  },
  // For polls
  pollData: {
    question: {
      type: String,
      maxlength: [200, 'Poll question must not exceed 200 characters']
    },
    options: [{
      text: {
        type: String,
        required: true,
        maxlength: [100, 'Option text must not exceed 100 characters']
      },
      votes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    }]
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
groupMessageSchema.index({ groupId: 1, createdAt: -1 });

// Virtual for formatted date
groupMessageSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
});

// Virtual for formatted time
groupMessageSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
});

// Method to check if user has voted in poll
groupMessageSchema.methods.hasUserVoted = function(userId, optionIndex) {
  if (this.type !== 'poll' || !this.pollData?.options?.[optionIndex]) {
    return false;
  }
  return this.pollData.options[optionIndex].votes.some(id => id.equals(userId));
};

// Method to add vote to poll
groupMessageSchema.methods.addVote = function(userId, optionIndex) {
  if (this.type !== 'poll' || !this.pollData?.options?.[optionIndex]) {
    throw new Error('Invalid poll or option index');
  }

  // Remove user from all options first (one vote per user)
  this.pollData.options.forEach(option => {
    option.votes = option.votes.filter(id => !id.equals(userId));
  });

  // Add vote to selected option
  this.pollData.options[optionIndex].votes.push(userId);
  return this.save();
};

// Method to get poll results
groupMessageSchema.methods.getPollResults = function() {
  if (this.type !== 'poll') return null;

  return {
    question: this.pollData.question,
    options: this.pollData.options.map(option => ({
      text: option.text,
      voteCount: option.votes.length,
      voters: option.votes
    })),
    totalVotes: this.pollData.options.reduce((sum, option) => sum + option.votes.length, 0)
  };
};

const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);

export default GroupMessage;