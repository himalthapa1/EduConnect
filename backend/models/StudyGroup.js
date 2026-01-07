import mongoose from 'mongoose';

const studyGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    minlength: [3, 'Group name must be at least 3 characters'],
    maxlength: [100, 'Group name must not exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Group description is required'],
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [500, 'Description must not exceed 500 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    default: 'Other'
  },
  // Semantic tag system for recommendations
  tags: {
    topics: {
      type: [String],
      validate: {
        validator: function(v) {
          return v.length <= 3; // Max 3 topics
        },
        message: 'Maximum 3 topic tags allowed'
      }
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: [true, 'Skill level is required']
    },
    styles: {
      type: [String],
      enum: [
        'discussion-based',
        'problem-solving',
        'project-based',
        'daily-practice',
        'lecture-review',
        'peer-teaching',
        'exam-prep',
        'interview-prep'
      ]
    },
    commitment: {
      type: [String],
      enum: [
        'short-term',
        'long-term',
        'weekly-sessions',
        'daily-study',
        'sprint-based'
      ]
    }
  },
  // Legacy fields for backward compatibility
  subjectTags: {
    type: [String],
    default: []
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  tag: {
    type: String,
    default: 'Other'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxMembers: {
    type: Number,
    default: 50,
    min: [2, 'Must have at least 2 members capacity'],
    max: [500, 'Max members cannot exceed 500']
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  activityScore: {
    type: Number,
    default: 0
  },
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

// Resources/Notes subdocument schema
const resourceSchema = new mongoose.Schema({
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
  isPublic: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add resources array to study group
studyGroupSchema.add({
  resources: [resourceSchema]
});
// Ensure creator is added to members on creation
studyGroupSchema.pre('save', async function(next) {
  if (this.isNew) {
    if (!this.members.includes(this.creator)) {
      this.members.push(this.creator);
    }
  }
  next();
});

// Method to add member
studyGroupSchema.methods.addMember = async function(userId) {
  if (!this.members.includes(userId)) {
    if (this.members.length >= this.maxMembers) {
      throw new Error('Group is full');
    }
    this.members.push(userId);
    return await this.save();
  }
  return this;
};

// Method to remove member
studyGroupSchema.methods.removeMember = async function(userId) {
  this.members = this.members.filter(id => !id.equals(userId));
  return await this.save();
};

// Method to check if user is member
studyGroupSchema.methods.isMember = function(userId) {
  return this.members.some(id => id.equals(userId));
};

// Method to check if user is admin (creator)
studyGroupSchema.methods.isAdmin = function(userId) {
  return this.creator.equals(userId);
};

// Method to get user role
studyGroupSchema.methods.getUserRole = function(userId) {
  if (this.creator.equals(userId)) return 'admin';
  if (this.members.some(id => id.equals(userId))) return 'member';
  return null;
};

// Virtual for members count
studyGroupSchema.virtual('membersCount').get(function() {
  return this.members.length;
});

// Activity score (can be updated based on sessions, resources, etc.)
studyGroupSchema.methods.updateActivityScore = async function() {
  // Simple scoring: members + resources + sessions (would be calculated properly)
  const newScore = this.members.length + (this.resources?.length || 0);

  // Use atomic update to avoid validation issues with existing documents
  await this.constructor.findByIdAndUpdate(this._id, {
    $set: { activityScore: newScore }
  });

  // Update the current instance
  this.activityScore = newScore;
  return this;
};

const StudyGroup = mongoose.model('StudyGroup', studyGroupSchema);

export default StudyGroup;
