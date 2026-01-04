import express from 'express';
import { body, validationResult } from 'express-validator';
import {
  startStudySession,
  endStudySession,
  getStudyHistory,
  getActiveSession,
  pauseSession,
  resumeSession
} from '../controllers/studyWithMeController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/* =========================
   VALIDATION
========================= */
const validateStartSession = [
  body('subject')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Subject must be between 1 and 100 characters'),

  body('studyMinutes')
    .isInt({ min: 1, max: 480 })
    .withMessage('Study minutes must be between 1 and 480'),

  body('breakMinutes')
    .isInt({ min: 1, max: 60 })
    .withMessage('Break minutes must be between 1 and 60'),

  body('resources')
    .optional()
    .isArray()
    .withMessage('Resources must be an array'),

  body('resources.*.title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Resource title too long'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array().map(e => ({
            field: e.path,
            message: e.msg
          }))
        }
      });
    }
    next();
  }
];

/* =========================
   AUTH
========================= */
router.use(authenticateToken);

/* =========================
   ROUTES
========================= */
router.post('/start',
  (req, res, next) => {
    console.log('STUDY START BODY:', req.body);
    console.log('STUDY START USER:', req.user);
    next();
  },
  validateStartSession,
  startStudySession
);
router.put('/:id/end', endStudySession);
router.get('/history', getStudyHistory);
router.get('/active', getActiveSession);
router.put('/:id/pause', pauseSession);
router.put('/:id/resume', resumeSession);

export default router;
