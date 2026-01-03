import Session from '../models/Session.js';

/* =========================
   HELPERS
========================= */
const parseTime = (time) => new Date(`2000-01-01T${time}:00`);

/* =========================
   CREATE SESSION
========================= */
export const createSession = async (req, res) => {
  console.log('REQ.USER =>', req.user);
  console.log('REQ.BODY =>', req.body);
  try {
    const {
      title,
      description,
      subject,
      date,
      startTime,
      endTime,
      location,
      maxParticipants,
      group,
      isPublic
    } = req.body;

    // Validate group membership if group is specified
    if (group) {
      const StudyGroup = (await import('../models/StudyGroup.js')).default;
      const groupDoc = await StudyGroup.findById(group);
      if (!groupDoc) {
        return res.status(404).json({
          success: false,
          error: { message: 'Group not found' }
        });
      }

      if (!groupDoc.members.includes(req.user.userId)) {
        return res.status(403).json({
          success: false,
          error: { message: 'You must be a member of the group to create sessions' }
        });
      }
    }

    // Validate time range
    const start = parseTime(startTime);
    const end = parseTime(endTime);

    if (end <= start) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'End time must be after start time',
          code: 'INVALID_TIME_RANGE'
        }
      });
    }

    const session = await Session.create({
      title,
      description,
      subject,
      date: new Date(date),
      startTime,
      endTime,
      location,
      maxParticipants,
      organizer: req.user.userId,
      group,
      isPublic: isPublic ?? true
    });

    await session.populate('organizer', 'username email');

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: { session }
    });
  } catch (error) {
    console.error('Create session error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: Object.values(error.errors).map(e => ({
            field: e.path,
            message: e.message
          }))
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'SERVER_ERROR'
      }
    });
  }
};

/* =========================
   GET ALL SESSIONS
========================= */
export const getSessions = async (req, res) => {
  try {
    const { page = 1, limit = 10, subject, date, status = 'scheduled' } = req.query;
    const userId = req.user?.userId;

    // Base query: public sessions OR sessions from groups the user is a member of
    const query = {
      status,
      $or: [
        { isPublic: true }
      ]
    };

    if (userId) {
      // Get user's groups
      const StudyGroup = (await import('../models/StudyGroup.js')).default;
      const userGroups = await StudyGroup.find({ members: userId }).select('_id');
      const groupIds = userGroups.map(g => g._id);

      query.$or.push({ group: { $in: groupIds } });
    }

    if (subject) {
      query.subject = { $regex: subject, $options: 'i' };
    }

    if (date) {
      const start = new Date(date);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    }

    const sessions = await Session.find(query)
      .populate('organizer', 'username email')
      .populate('participants.user', 'username email')
      .populate('group', 'name subject')
      .sort({ date: 1, startTime: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Session.countDocuments(query);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

/* =========================
   GET MY SESSIONS
========================= */
export const getMySessions = async (req, res) => {
  try {
    const userId = req.user.userId;

    const organized = await Session.find({ organizer: userId })
      .populate('organizer', 'username email')
      .populate('participants.user', 'username email')
      .populate('group', 'name subject')
      .sort({ date: 1, startTime: 1 });

    const joined = await Session.find({
      'participants.user': userId,
      organizer: { $ne: userId }
    })
      .populate('organizer', 'username email')
      .populate('participants.user', 'username email')
      .populate('group', 'name subject')
      .sort({ date: 1, startTime: 1 });

    res.json({
      success: true,
      data: { organized, joined }
    });
  } catch (error) {
    console.error('Get my sessions error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

/* =========================
   JOIN SESSION
========================= */
export const joinSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('group');

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { message: 'Session not found' }
      });
    }

    if (session.organizer.toString() === req.user.userId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot join your own session' }
      });
    }

    // Check group membership if session belongs to a group
    if (session.group && !session.group.members.includes(req.user.userId)) {
      return res.status(403).json({
        success: false,
        error: { message: 'You must be a member of the group to join this session' }
      });
    }

    await session.addParticipant(req.user.userId);
    await session.populate('organizer participants.user', 'username email');

    res.json({
      success: true,
      message: 'Successfully joined the session',
      data: { session }
    });
  } catch (error) {
    console.error('Join session error:', error);
    res.status(400).json({
      success: false,
      error: { message: error.message || 'Join failed' }
    });
  }
};

/* =========================
   LEAVE SESSION
========================= */
export const leaveSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { message: 'Session not found' }
      });
    }

    await session.removeParticipant(req.user.userId);
    await session.populate('organizer participants.user', 'username email');

    res.json({
      success: true,
      message: 'Successfully left the session',
      data: { session }
    });
  } catch (error) {
    console.error('Leave session error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

/* =========================
   UPDATE SESSION
========================= */
export const updateSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { message: 'Session not found' }
      });
    }

    if (session.organizer.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized' }
      });
    }

    Object.assign(session, req.body);
    await session.save();
    await session.populate('organizer participants.user', 'username email');

    res.json({
      success: true,
      message: 'Session updated successfully',
      data: { session }
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

/* =========================
   DELETE SESSION
========================= */
export const deleteSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { message: 'Session not found' }
      });
    }

    if (session.organizer.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized' }
      });
    }

    await session.deleteOne();

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

/* =========================
   COMPLETE SESSION
========================= */
export const completeSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { message: 'Session not found' }
      });
    }

    if (session.organizer.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized' }
      });
    }

    if (session.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: { message: 'Session is already completed' }
      });
    }

    const { notes } = req.body;
    await session.completeSession(notes);

    await session.populate('organizer participants.user', 'username email');

    res.json({
      success: true,
      message: 'Session completed successfully',
      data: { session }
    });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

/* =========================
   ADD SESSION NOTES
========================= */
export const addSessionNotes = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { message: 'Session not found' }
      });
    }

    if (session.organizer.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized' }
      });
    }

    const { notes } = req.body;

    if (!notes || !notes.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Notes are required' }
      });
    }

    await session.addNotes(notes.trim());

    res.json({
      success: true,
      message: 'Session notes added successfully',
      data: { session }
    });
  } catch (error) {
    console.error('Add session notes error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

/* =========================
   ADD SESSION RESOURCE
========================= */
export const addSessionResource = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: { message: 'Session not found' }
      });
    }

    if (session.organizer.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized' }
      });
    }

    const { title, url, description, type } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Resource title is required' }
      });
    }

    const resourceData = {
      title: title.trim(),
      url: url ? url.trim() : null,
      description: description ? description.trim() : null,
      type: type || 'resource',
      creator: req.user.userId
    };

    await session.addResource(resourceData);

    res.json({
      success: true,
      message: 'Session resource added successfully',
      data: { session }
    });
  } catch (error) {
    console.error('Add session resource error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: Object.values(error.errors).map(e => ({
            field: e.path,
            message: e.message
          }))
        }
      });
    }

    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};
