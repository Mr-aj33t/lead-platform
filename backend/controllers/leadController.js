const leadService = require('../services/leadService');
const noteService = require('../services/noteService');
const { success } = require('../utils/response');

const create = async (req, res, next) => {
  try {
    const lead = await leadService.createLead(req.validatedBody, req.user._id, req.user.role);
    return success(res, lead, 'Lead created', 201);
  } catch (err) {
    next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const result = await leadService.getLeads(req.query, req.user);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const lead = await leadService.getLeadById(req.params.id, req.user);
    const notes = await noteService.getLeadNotes(req.params.id);
    return success(res, { lead, notes });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const lead = await leadService.updateLead(req.params.id, req.validatedBody, req.user._id, req.user.role);
    return success(res, lead, 'Lead updated');
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await leadService.deleteLead(req.params.id);
    return success(res, null, 'Lead deleted');
  } catch (err) {
    next(err);
  }
};

const activityRepository = require('../repositories/activityRepository');

const dashboard = async (req, res, next) => {
  try {
    const stats = await leadService.getDashboardStats();
    const recentActivity = await activityRepository.findRecent({}, 10);
    return success(res, { stats, recentActivity });
  } catch (err) {
    next(err);
  }
};

module.exports = { create, list, getById, update, remove, dashboard };
