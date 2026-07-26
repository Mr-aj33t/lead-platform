require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const bcrypt = require('bcrypt');
const config = require('./config');
const User = require('./models/User');
const Lead = require('./models/Lead');
const Note = require('./models/Note');
const Activity = require('./models/Activity');

const seed = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    await Promise.all([
      User.deleteMany({}),
      Lead.deleteMany({}),
      Note.deleteMany({}),
      Activity.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@crm.com',
      password: 'password123',
      role: 'admin',
    });

    const member1 = await User.create({
      name: 'Alice Member',
      email: 'alice@crm.com',
      password: 'password123',
      role: 'member',
    });

    const member2 = await User.create({
      name: 'Bob Member',
      email: 'bob@crm.com',
      password: 'password123',
      role: 'member',
    });

    console.log('Users created');

    const statuses = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];
    const companies = ['Acme Corp', 'Globex Inc', 'Initech', 'Hooli', 'Stark Industries', 'Wayne Enterprises', 'Cyberdyne', 'Umbrella Corp', 'Wonka Industries', 'Soylent Corp', 'Massive Dynamic', 'Oceanic Airlines', 'Dunder Mifflin', 'Pied Piper', 'Aperture Science'];
    const leadData = [];

    for (let i = 0; i < 15; i++) {
      const assignedTo = i < 10 ? member1._id : member2._id;
      const status = statuses[i % statuses.length];
      leadData.push({
        name: `Lead ${i + 1}`,
        email: `lead${i + 1}@example.com`,
        phone: `+1-555-${String(1000 + i).slice(1)}`,
        company: companies[i],
        message: `Interested in your services. Please contact back.`,
        status,
        source: i === 0 ? 'Public Form' : 'Manual',
        assignedTo,
        createdBy: admin._id,
      });
    }

    const leads = await Lead.insertMany(leadData);
    console.log(`${leads.length} leads created`);

    const noteContents = [
      'Initial call scheduled for next week.',
      'Sent proposal document.',
      'Followed up via email.',
      'Client requested demo.',
      'Negotiating terms.',
    ];

    const notes = [];
    for (let i = 0; i < 10; i++) {
      notes.push({
        lead: leads[i]._id,
        author: admin._id,
        content: noteContents[i % noteContents.length],
      });
    }
    await Note.insertMany(notes);
    console.log(`${notes.length} notes created`);

    const activityActions = [
      { action: 'Lead Created', descTemplate: (l) => `Lead "${l.name}" was created` },
      { action: 'Lead Assigned', descTemplate: (l) => `Lead "${l.name}" was assigned` },
      { action: 'Status Changed', descTemplate: (l) => `Lead "${l.name}" status changed to "${l.status}"` },
    ];

    const activities = [];
    for (let i = 0; i < leads.length; i++) {
      const a = activityActions[i % activityActions.length];
      activities.push({
        actor: admin._id,
        action: a.action,
        description: a.descTemplate(leads[i]),
        lead: leads[i]._id,
      });
    }
    await Activity.insertMany(activities);
    console.log(`${activities.length} activities created`);

    console.log('\n--- Demo Credentials ---');
    console.log('Admin:  admin@crm.com / password123');
    console.log('Member: alice@crm.com / password123');
    console.log('Member: bob@crm.com / password123');
    console.log('\nSeed completed successfully!');

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seed();
