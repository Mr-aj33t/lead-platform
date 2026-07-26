const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const Note = require('../models/Note');
const config = require('../config');

let adminToken, memberToken, adminUser, memberUser;

beforeAll(async () => {
  await mongoose.connect(config.mongoUri);
});

afterAll(async () => {
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Lead.deleteMany({}),
    Activity.deleteMany({}),
    Note.deleteMany({}),
  ]);

  adminUser = await User.create({
    name: 'Admin',
    email: 'admin@test.com',
    password: 'password12345',
    role: 'admin',
  });

  memberUser = await User.create({
    name: 'Member',
    email: 'member@test.com',
    password: 'password12345',
    role: 'member',
  });

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'password12345' });
  adminToken = adminLogin.body.data.token;

  const memberLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'member@test.com', password: 'password12345' });
  memberToken = memberLogin.body.data.token;
});

describe('Lead CRUD', () => {
  test('POST /api/leads creates a lead', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-1234',
        company: 'Acme Corp',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('John Doe');
    expect(res.body.data.status).toBe('New');
  });

  test('POST /api/leads fails with invalid email', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'John Doe',
        email: 'not-an-email',
        phone: '+1-555-1234',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/leads returns paginated leads', async () => {
    await Lead.create([
      { name: 'Lead A', email: 'a@test.com', phone: '123', createdBy: adminUser._id },
      { name: 'Lead B', email: 'b@test.com', phone: '456', createdBy: adminUser._id },
    ]);

    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.leads.length).toBe(2);
    expect(res.body.data.pagination.total).toBe(2);
  });

  test('Member can only see assigned leads', async () => {
    await Lead.create([
      { name: 'Assigned Lead', email: 'a@test.com', phone: '123', assignedTo: memberUser._id, createdBy: adminUser._id },
      { name: 'Unassigned Lead', email: 'b@test.com', phone: '456', createdBy: adminUser._id },
    ]);

    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.leads.length).toBe(1);
    expect(res.body.data.leads[0].name).toBe('Assigned Lead');
  });

  test('Admin can delete leads, member cannot', async () => {
    const lead = await Lead.create({
      name: 'Test Lead',
      email: 'test@test.com',
      phone: '123',
      createdBy: adminUser._id,
    });

    const memberRes = await request(app)
      .delete(`/api/leads/${lead._id}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(memberRes.status).toBe(403);

    const adminRes = await request(app)
      .delete(`/api/leads/${lead._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminRes.status).toBe(200);
  });

  test('Member can update assigned lead status', async () => {
    const lead = await Lead.create({
      name: 'Test Lead',
      email: 'test@test.com',
      phone: '123',
      assignedTo: memberUser._id,
      createdBy: adminUser._id,
    });

    const res = await request(app)
      .put(`/api/leads/${lead._id}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'Contacted' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Contacted');
  });
});
