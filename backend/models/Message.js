import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required']
    },
    chatType: {
      type: String,
      required: [true, 'Chat type is required'],
      enum: ['group', 'session'],
      index: true
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGroup',
      required: function () {
        return this.chatType === 'group';
      }
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: function () {
        return this.chatType === 'session';
      }
    },
    // Message type (text, voice, poll)
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
        trim: true
      },
      options: [
        {
          text: {
            type: String,
            required: true,
            trim: true
          },
          votes: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User'
            }
          ]
        }
      ]
    }
  },
  {
    timestamps: true
  }
);

/* =========================
   INDEXES
========================= */
messageSchema.index({ chatType: 1, groupId: 1, createdAt: 1 });
messageSchema.index({ chatType: 1, sessionId: 1, createdAt: 1 });
messageSchema.index({ sender: 1, createdAt: -1 });

/* =========================
   VIRTUALS
========================= */
messageSchema.virtual('chatRoomId').get(function () {
  if (this.chatType === 'group') {
    return `group-${this.groupId}`;
  } else if (this.chatType === 'session') {
    return `session-${this.sessionId}`;
  }
  return null;
});

/* =========================
   METHODS
========================= */
messageSchema.methods.toPublicData = function () {
  return {
    _id: this._id,
    content: this.content,
    sender: this.sender,
    chatType: this.chatType,
    groupId: this.groupId,
    sessionId: this.sessionId,
    type: this.type,
    audioUrl: this.audioUrl,
    pollData: this.pollData,
    createdAt: this.createdAt
  };
};

// Add vote to poll
messageSchema.methods.addVote = async function (userId, optionIndex) {
  if (!this.pollData || !this.pollData.options[optionIndex]) {
    throw new Error('Invalid poll or option index');
  }

  // Remove user's previous vote if exists
  this.pollData.options.forEach(option => {
    option.votes = option.votes.filter(vote => !vote.equals(userId));
  });

  // Add new vote
  this.pollData.options[optionIndex].votes.push(userId);
  
  await this.save();
  return this;
};

// Get poll results
messageSchema.methods.getPollResults = function () {
  if (!this.pollData) {
    return null;
  }

  const totalVotes = this.pollData.options.reduce(
    (sum, option) => sum + option.votes.length,
    0
  );

  return {
    question: this.pollData.question,
    options: this.pollData.options.map(option => ({
      text: option.text,
      votes: option.votes.length,
      percentage: totalVotes > 0 ? (option.votes.length / totalVotes) * 100 : 0
    })),
    totalVotes
  };
};

/* =========================
   STATICS
========================= */
messageSchema.statics.getGroupMessages = function (groupId, limit = 50) {
  return this.find({
    chatType: 'group',
    groupId: groupId
  })
    .populate('sender', 'username _id')
    .sort({ createdAt: 1 })
    .limit(limit);
};

messageSchema.statics.getSessionMessages = function (sessionId, limit = 50) {
  return this.find({
    chatType: 'session',
    sessionId: sessionId
  })
    .populate('sender', 'username _id')
    .sort({ createdAt: 1 })
    .limit(limit);
};

messageSchema.statics.createGroupMessage = function (groupId, senderId, content, type = 'text') {
  return this.create({
    content: content.trim(),
    sender: senderId,
    chatType: 'group',
    groupId: groupId,
    type: type
  });
};

messageSchema.statics.createSessionMessage = function (sessionId, senderId, content) {
  return this.create({
    content: content.trim(),
    sender: senderId,
    chatType: 'session',
    sessionId: sessionId
  });
};

const Message = mongoose.model('Message', messageSchema);
export default Message;
