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
    createdAt: this.createdAt
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
    .populate('sender', 'username')
    .sort({ createdAt: 1 })
    .limit(limit);
};

messageSchema.statics.getSessionMessages = function (sessionId, limit = 50) {
  return this.find({
    chatType: 'session',
    sessionId: sessionId
  })
    .populate('sender', 'username')
    .sort({ createdAt: 1 })
    .limit(limit);
};

messageSchema.statics.createGroupMessage = function (groupId, senderId, content) {
  return this.create({
    content: content.trim(),
    sender: senderId,
    chatType: 'group',
    groupId: groupId
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
