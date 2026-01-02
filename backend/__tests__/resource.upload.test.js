import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import bodyParser from 'body-parser';
import { createGroup, addResource } from '../controllers/groupController.js';
import StudyGroup from '../models/StudyGroup.js';
import User from '../models/User.js';
import path from 'path';
import fs from 'fs';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let mongoServer;
let testUser;
let testGroup;

const authMiddleware = (req, res, next) => {
  req.user = { userId: testUser._id.toString() };
  next();
};

app.post('/groups', authMiddleware, createGroup);
app.post('/groups/:groupId/resources', auth-Middleware, addResource);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  testUser = await User.create({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  const groupData = {
    name: 'Test Group',
    description: 'A group for testing',
    subject: 'testing',
    creator: testUser._id,
  };
  testGroup = await StudyGroup.create(groupData);
  testGroup.members.push(testUser._id);
  await testGroup.save();
});

afterEach(async () => {
  await StudyGroup.deleteMany({});
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
  const files = await fs.promises.readdir(uploadsDir);
  for (const file of files) {
    if(file !== '.gitignore') {
      await fs.promises.unlink(path.join(uploadsDir, file));
    }
  }
});

describe('Resource Creation', () => {
  it('should create a "note" resource without a file', async () => {
    const res = await request(app)
      .post(`/groups/${testGroup._id}/resources`)
      .field('title', 'Test Note')
      .field('description', 'This is a test note.')
      .field('resourceType', 'note')
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.resource.title).toBe('Test Note');
    expect(res.body.data.resource.resourceType).toBe('note');
    expect(res.body.data.resource.file).toBeUndefined();
  });

  it('should create a "file" resource with a file', async () => {
    const filePath = path.join(__dirname, 'test-file.txt');
    await fs.promises.writeFile(filePath, 'hello world');

    const res = await request(app)
      .post(`/groups/${testGroup._id}/resources`)
      .field('title', 'Test File')
      .field('resourceType', 'file')
      .attach('file', filePath)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.resource.title).toBe('Test File');
    expect(res.body.data.resource.resourceType).toBe('file');
    expect(res.body.data.resource.file).toMatch(/uploads\/file-.*/);

    await fs.promises.unlink(filePath);
  });

  it('should fail to create a "file" resource without a file', async () => {
    const res = await request(app)
      .post(`/groups/${testGroup._id}/resources`)
      .field('title', 'Test File No Attachment')
      .field('resourceType', 'file')
      .expect(400);

    expect(res.body.message).toBe('File is required for this resource type');
  });

  it('should create a "link" resource without a file', async () => {
    const res = await request(app)
      .post(`/groups/${testGroup._id}/resources`)
      .field('title', 'Test Link')
      .field('url', 'http://example.com')
      .field('resourceType', 'link')
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.resource.title).toBe('Test Link');
    expect(res.body.data.resource.resourceType).toBe('link');
    expect(res.body.data.resource.url).toBe('http://example.com');
  });
});