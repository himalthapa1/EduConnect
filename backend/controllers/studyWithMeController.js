import mongoose from 'mongoose';
import StudyWithMeSession from '../models/StudyWithMeSession.js';

/* =========================
   START STUDY SESSION
========================= */
export const startStudySession = async (req, res) => {
  try {
    // DEBUG LOGGING
    console.log('=== STUDY START DEBUG ===');
    console.log('REQ.BODY:', JSON.stringify(req.body, null, 2));
    console.log('REQ.USER:', JSON.stringify(req.user, null, 2));
    console.log('REQ.HEADERS.AUTH:', req.headers.authorization?.substring(0, 50) + '...');
    console.log('========================');

    const { subject, studyMinutes, breakMinutes, resources = [] } = req.body;
    const userId = req.user.userId;

    // Check if user has an active session
    const activeSession = await StudyWithMeSession.findOne({
      userId,
      status: { $in: ['active', 'paused'] }
    });

    if (activeSession) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'You already have an active study session'
        }
      });
    }

    const session = new StudyWithMeSession({
      userId,
      subject,
      studyMinutes,
      breakMinutes,
      resources,
      startTime: new Date()
    });

    await session.save();

    res.status(201).json({
      success: true,
      data: {
        session: {
          _id: session._id,
          subject: session.subject,
          studyMinutes: session.studyMinutes,
          breakMinutes: session.breakMinutes,
          startTime: session.startTime,
          status: session.status
        }
      }
    });
  } catch (error) {
    console.error('Error starting study session:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to start study session'
      }
    });
  }
};

/* =========================
   END STUDY SESSION
========================= */
export const endStudySession = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user.userId;

    const session = await StudyWithMeSession.findOne({
      _id: id,
      userId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Study session not found'
        }
      });
    }

    if (session.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Session is already completed'
        }
      });
    }

    await session.complete(notes);

    res.json({
      success: true,
      data: {
        session: {
          _id: session._id,
          subject: session.subject,
          studyMinutes: session.studyMinutes,
          breakMinutes: session.breakMinutes,
          actualDuration: session.actualDuration,
          startTime: session.startTime,
          endTime: session.endTime,
          notes: session.notes,
          status: session.status
        }
      }
    });
  } catch (error) {
    console.error('Error ending study session:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to end study session'
      }
    });
  }
};

/* =========================
   GET STUDY HISTORY
========================= */
export const getStudyHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const sessions = await StudyWithMeSession.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('subject studyMinutes breakMinutes actualDuration startTime endTime notes status createdAt');

    const total = await StudyWithMeSession.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting study history:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get study history'
      }
    });
  }
};

/* =========================
   GET ACTIVE SESSION
========================= */
export const getActiveSession = async (req, res) => {
  try {
    const userId = req.user.userId;

    const session = await StudyWithMeSession.findOne({
      userId,
      status: { $in: ['active', 'paused'] }
    }).sort({ createdAt: -1 });

    if (!session) {
      return res.json({
        success: true,
        data: {
          session: null
        }
      });
    }

    res.json({
      success: true,
      data: {
        session: {
          _id: session._id,
          subject: session.subject,
          studyMinutes: session.studyMinutes,
          breakMinutes: session.breakMinutes,
          actualDuration: session.actualDuration,
          startTime: session.startTime,
          notes: session.notes,
          resources: session.resources,
          status: session.status
        }
      }
    });
  } catch (error) {
    console.error('Error getting active session:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get active session'
      }
    });
  }
};

/* =========================
   PAUSE SESSION
========================= */
export const pauseSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const session = await StudyWithMeSession.findOne({
      _id: id,
      userId,
      status: 'active'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Active study session not found'
        }
      });
    }

    await session.pause();

    res.json({
      success: true,
      data: {
        session: {
          _id: session._id,
          status: session.status
        }
      }
    });
  } catch (error) {
    console.error('Error pausing session:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to pause session'
      }
    });
  }
};

/* =========================
   RESUME SESSION
========================= */
export const resumeSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const session = await StudyWithMeSession.findOne({
      _id: id,
      userId,
      status: 'paused'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Paused study session not found'
        }
      });
    }

    await session.resume();

    res.json({
      success: true,
      data: {
        session: {
          _id: session._id,
          status: session.status
        }
      }
    });
  } catch (error) {
    console.error('Error resuming session:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to resume session'
      }
    });
  }
};
