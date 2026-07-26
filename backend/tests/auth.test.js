const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const config = require('../config');

beforeAll(async () => {
  await mongoose.connect(config.mongoUri);
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth - Login', () => {
  test('POST /api/auth/login succeeds with valid credentials', async () => {
    await User.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'password12345',
      role: 'admin',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password12345' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('admin@test.com');
  });

  test('POST /api/auth/login fails with wrong password', async () => {
    await User.create({
      name: 'Test User',
      email: 'user@test.com',
      password: 'password12345',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login fails with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Auth - Registration (Admin only)', () => {
  test('POST /api/auth/register fails without auth', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'New User', email: 'new@test.com', password: 'password12345' });

    expect(res.status).toBe(401);
  });

  test('POST /api/auth/register fails for member role', async () => {
    const member = await User.create({
      name: 'Member',
      email: 'member@test.com',
      password: 'password12345',
      role: 'member',
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'member@test.com', password: 'password12345' });

    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${loginRes.body.data.token}`)
      .send({ name: 'New User', email: 'new@test.com', password: 'password12345' });

    expect(res.status).toBe(403);
  });
});
