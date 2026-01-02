import express from 'express';
import { body, validationResult } from 'express-validator';
import {
  createSession,
  getSessions,
  getMySessions,
  joinSession,
  leaveSession,
  updateSession,
  deleteSession
} from '../controllers/sessionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/* =========================
   VALIDATION
========================= */
const validateSession = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),

  body('subject')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Subject must be between 1 and 50 characters'),

  body('date')
    .isISO8601()
    .withMessage('Invalid date format'),

  body('startTime')
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('Start time must be HH:mm'),

  body('endTime')
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('End time must be HH:mm'),

  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required'),

  body('maxParticipants')
    .isInt({ min: 1, max: 50 })
    .withMessage('Max participants must be between 1 and 50'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description too long'),

  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be boolean'),

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
router.post('/', validateSession, createSession);
router.get('/', getSessions);
router.get('/my', getMySessions);
router.post('/:id/join', joinSession);
router.post('/:id/leave', leaveSession);
router.put('/:id', validateSession, updateSession);
router.delete('/:id', deleteSession);

export default router;
