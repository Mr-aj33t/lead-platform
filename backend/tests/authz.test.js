const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const Note = require('../models/Note');

let adminToken, memberToken, adminUser, memberUser;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm-test');
  }

  // Clean up any previous test data
  await Promise.all([
    User.deleteMany({ email: { $in: ['authzadmin@test.com', 'authzmember@test.com'] } }),
    Lead.deleteMany({}),
    Activity.deleteMany({}),
    Note.deleteMany({}),
  ]);

  adminUser = await User.create({
    name: 'Admin',
    email: 'authzadmin@test.com',
    password: 'password123',
    role: 'admin',
  });
  memberUser = await User.create({
    name: 'Member',
    email: 'authzmember@test.com',
    password: 'password123',
    role: 'member',
  });

  const loginAdmin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'authzadmin@test.com', password: 'password123' });
  adminToken = loginAdmin.body.data.token;

  const loginMember = await request(app)
    .post('/api/auth/login')
    .send({ email: 'authzmember@test.com', password: 'password123' });
  memberToken = loginMember.body.data.token;
});

afterAll(async () => {
  // Clean up test data without requiring dropDatabase privilege
  await Promise.all([
    User.deleteMany({ email: { $in: ['authzadmin@test.com', 'authzmember@test.com'] } }),
    Lead.deleteMany({}),
    Activity.deleteMany({}),
    Note.deleteMany({}),
  ]);
  await mongoose.disconnect();
});

describe('Role-based access control', () => {
  it('should allow admin to delete a lead', async () => {
    const lead = await Lead.create({
      name: 'To Delete',
      email: 'delete@test.com',
      phone: '555-0001',
      company: 'DelCo',
      createdBy: adminUser._id,
    });

    const res = await request(app)
      .delete(`/api/leads/${lead._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });

  it('should block member from deleting a lead (403)', async () => {
    const lead = await Lead.create({
      name: 'Block Delete',
      email: 'block@test.com',
      phone: '555-0002',
      company: 'BlockCo',
      createdBy: adminUser._id,
    });

    const res = await request(app)
      .delete(`/api/leads/${lead._id}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(403);
  });

  it('should allow member to update their assigned lead', async () => {
    const lead = await Lead.create({
      name: 'Member Lead',
      email: 'member@test.com',
      phone: '555-0003',
      company: 'MemberCo',
      assignedTo: memberUser._id,
      createdBy: adminUser._id,
    });

    const res = await request(app)
      .put(`/api/leads/${lead._id}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'Contacted' });
    expect(res.status).toBe(200);
  });

  it('should block member from viewing unassigned lead', async () => {
    const lead = await Lead.create({
      name: 'Unassigned',
      email: 'unassigned@test.com',
      phone: '555-0004',
      company: 'NoAssign',
      assignedTo: adminUser._id,
      createdBy: adminUser._id,
    });

    const res = await request(app)
      .get(`/api/leads/${lead._id}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(403);
  });

  it('should block member from registering new users', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Hacker', email: 'hacker@test.com', password: 'password123' });
    expect(res.status).toBe(403);
  });
});
