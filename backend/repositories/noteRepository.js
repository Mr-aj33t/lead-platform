const Note = require('../models/Note');

const create = (data) => Note.create(data);
const findByLead = (leadId) => Note.find({ lead: leadId }).populate('author', 'name email').sort({ createdAt: -1 });

module.exports = { create, findByLead };
