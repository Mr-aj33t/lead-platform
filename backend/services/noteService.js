const noteRepository = require('../repositories/noteRepository');
const activityRepository = require('../repositories/activityRepository');
const leadRepository = require('../repositories/leadRepository');
const AppError = require('../utils/AppError');

const addNote = async (data, userId) => {
  const lead = await leadRepository.findById(data.lead);
  if (!lead) throw new AppError('Lead not found', 404, 'NOT_FOUND');

  const note = await noteRepository.create({
    lead: data.lead,
    author: userId,
    content: data.content,
  });

  await activityRepository.create({
    actor: userId,
    action: 'Note Added',
    description: `Note added to lead "${lead.name}"`,
    lead: data.lead,
  });

  return note.populate('author', 'name email');
};

const getLeadNotes = async (leadId) => {
  return noteRepository.findByLead(leadId);
};

module.exports = { addNote, getLeadNotes };
