import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import express from 'express';
import User from '../models/User.js';
import Session from '../models/Session.js';

let mongoServer;
let app;

beforeAll(async () => {
  process.env.JWT_SECRET = 'testsecret';
  process.env.JWT_EXPIRE = '1h';

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

  app = express();
  app.use(express.json());

  // Import controllers and middleware
  const authController = await import('../controllers/authController.js');
  const sessionController = await import('../controllers/sessionController.js');
  const { validateRegistration, validateLogin, authRateLimiter, authenticateToken } = await import('../middleware/auth.js');

  // Setup minimal routes for testing
  const authRouter = express.Router();
  authRouter.post('/register', validateRegistration, authController.register);
  authRouter.post('/login', validateLogin, authController.login);
  app.use('/api/auth', authRouter);

  const sessionRouter = express.Router();
  sessionRouter.get('/list', sessionController.listSessions);
  sessionRouter.get('/my-sessions', authenticateToken, sessionController.getMySessions);
  sessionRouter.get('/:sessionId', sessionController.getSessionById);
  sessionRouter.post('/', authenticateToken, sessionController.createSession);
  sessionRouter.post('/join', authenticateToken, sessionController.joinSession);
  sessionRouter.post('/leave', authenticateToken, sessionController.leaveSession);
  sessionRouter.delete('/:sessionId', authenticateToken, sessionController.deleteSession);
  app.use('/api/sessions', sessionRouter);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    await User.deleteMany({});
    await Session.deleteMany({});
  }
});

describe('Sessions API', () => {
  test('create, list, join, leave, getMySessions, delete flows', async () => {
    // Register and login user1
    const user1 = {
      username: 'alice',
      email: 'alice@example.com',
      password: 'password123',
      dateOfBirth: '2000-01-01',
      collegeName: 'Test College',
      currentYear: '2nd Year'
    };

    const reg1 = await request(app).post('/api/auth/register').send(user1);
    expect(reg1.status).toBe(201);

    const login1 = await request(app).post('/api/auth/login').send({ email: user1.email, password: user1.password });
    expect(login1.status).toBe(200);
    const token1 = login1.body.data.token;

    // Create session with user1
    const startTime = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour from now
    const createRes = await request(app).post('/api/sessions/create').set('Authorization', `Bearer ${token1}`).send({
      title: 'Study Math',
      description: 'Algebra and calculus',
      startTime,
      durationMinutes: 90,
      isOnline: true,
      maxParticipants: 5
    });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    const sessionId = createRes.body.data._id;

    // List upcoming sessions
    const listRes = await request(app).get('/api/sessions/list').query({ upcoming: true });
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(1);

    // Register and login user2
    const user2 = { ...user1, username: 'bob', email: 'bob@example.com' };
    const reg2 = await request(app).post('/api/auth/register').send(user2);
    expect(reg2.status).toBe(201);
    const login2 = await request(app).post('/api/auth/login').send({ email: user2.email, password: user2.password });
    const token2 = login2.body.data.token;

    // User2 joins session
    const joinRes = await request(app).post('/api/sessions/join').set('Authorization', `Bearer ${token2}`).send({ sessionId });
    expect(joinRes.status).toBe(200);
    expect(joinRes.body.data.participants.length).toBe(2);

    // User2 leaves session
    const leaveRes = await request(app).post('/api/sessions/leave').set('Authorization', `Bearer ${token2}`).send({ sessionId });
    expect(leaveRes.status).toBe(200);
    expect(leaveRes.body.data.participants.length).toBe(1);

    // My sessions for user1
    const my1 = await request(app).get('/api/sessions/my-sessions').set('Authorization', `Bearer ${token1}`);
    expect(my1.status).toBe(200);
    expect(my1.body.data.length).toBe(1);

    // My sessions for user2 (should be empty)
    const my2 = await request(app).get('/api/sessions/my-sessions').set('Authorization', `Bearer ${token2}`);
    expect(my2.status).toBe(200);
    expect(my2.body.data.length).toBe(0);

    // Delete by non-creator (user2) should fail
    const delFail = await request(app).delete(`/api/sessions/${sessionId}`).set('Authorization', `Bearer ${token2}`);
    expect(delFail.status).toBe(403);

    // Delete by creator (user1)
    const delOk = await request(app).delete(`/api/sessions/${sessionId}`).set('Authorization', `Bearer ${token1}`);
    expect(delOk.status).toBe(200);

    // Ensure session removed
    const listAfter = await request(app).get('/api/sessions/list').query({ upcoming: true });
    expect(listAfter.body.data.length).toBe(0);
  });
});
