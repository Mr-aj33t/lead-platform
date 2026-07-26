const leadRepository = require('../repositories/leadRepository');
const activityRepository = require('../repositories/activityRepository');
const userRepository = require('../repositories/userRepository');
const AppError = require('../utils/AppError');

const createLead = async (data, userId, userRole) => {
  const leadData = { ...data, createdBy: userId };
  if (userRole === 'member' && !leadData.assignedTo) {
    leadData.assignedTo = userId;
  }
  const lead = await leadRepository.create(leadData);

  await activityRepository.create({
    actor: userId,
    action: 'Lead Created',
    description: `Lead "${lead.name}" was created`,
    lead: lead._id,
  });

  return lead;
};

const getLeads = async (query, user) => {
  const filter = {};
  const options = {};

  if (query.search) {
    const regex = new RegExp(query.search, 'i');
    filter.$or = [
      { name: regex },
      { email: regex },
      { company: regex },
    ];
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.assignedTo) {
    filter.assignedTo = query.assignedTo;
  }

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }

  if (user && user.role === 'member') {
    const memberOr = [{ assignedTo: user._id }, { createdBy: user._id }];
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: memberOr }];
      delete filter.$or;
    } else {
      filter.$or = memberOr;
    }
  }

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  options.page = page;
  options.limit = limit;

  if (query.sortBy) {
    const order = query.sortOrder === 'asc' ? 1 : -1;
    options.sort = { [query.sortBy]: order };
  }

  const [leads, total] = await Promise.all([
    leadRepository.findAll(filter, options),
    leadRepository.countDocuments(filter),
  ]);

  return {
    leads,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const getLeadById = async (id, user) => {
  const lead = await leadRepository.findById(id);
  if (!lead) throw new AppError('Lead not found', 404, 'NOT_FOUND');

  if (user && user.role === 'member') {
    const isAssigned = lead.assignedTo && lead.assignedTo._id.toString() === user._id.toString();
    const isCreator = lead.createdBy && (lead.createdBy._id ? lead.createdBy._id.toString() : lead.createdBy.toString()) === user._id.toString();
    if (!isAssigned && !isCreator) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }
  }

  return lead;
};

const updateLead = async (id, data, userId, userRole) => {
  const lead = await leadRepository.findById(id);
  if (!lead) throw new AppError('Lead not found', 404, 'NOT_FOUND');

  if (userRole === 'member') {
    const isAssigned = lead.assignedTo && lead.assignedTo._id.toString() === userId.toString();
    const isCreator = lead.createdBy && (lead.createdBy._id ? lead.createdBy._id.toString() : lead.createdBy.toString()) === userId.toString();
    if (!isAssigned && !isCreator) {
      throw new AppError('Access denied', 403, 'FORBIDDEN');
    }
  }

  const oldStatus = lead.status;
  const oldAssignedTo = lead.assignedTo ? lead.assignedTo._id.toString() : null;

  const updated = await leadRepository.findAndUpdate(id, data);

  if (data.status && data.status !== oldStatus) {
    await activityRepository.create({
      actor: userId,
      action: 'Status Changed',
      description: `Lead "${lead.name}" status changed from "${oldStatus}" to "${data.status}"`,
      lead: id,
    });
  }

  if (data.assignedTo !== undefined && data.assignedTo !== oldAssignedTo) {
    let assignedUserName = 'nobody';
    if (data.assignedTo) {
      const assignedUserObj = await userRepository.findById(data.assignedTo);
      assignedUserName = assignedUserObj ? assignedUserObj.name : 'Unknown User';
    }
    await activityRepository.create({
      actor: userId,
      action: 'Lead Assigned',
      description: `Lead "${lead.name}" was assigned to ${assignedUserName}`,
      lead: id,
    });
  }

  if ((data.status || data.assignedTo !== undefined) === false || (data.status && data.status === oldStatus && data.assignedTo === undefined)) {
    await activityRepository.create({
      actor: userId,
      action: 'Lead Updated',
      description: `Lead "${lead.name}" was updated`,
      lead: id,
    });
  }

  return updated;
};

const deleteLead = async (id) => {
  const lead = await leadRepository.findById(id);
  if (!lead) throw new AppError('Lead not found', 404, 'NOT_FOUND');

  await activityRepository.create({
    actor: lead.createdBy,
    action: 'Lead Deleted',
    description: `Lead "${lead.name}" was deleted`,
    lead: null,
  });

  await leadRepository.findAndDelete(id);
  return { id };
};

const getDashboardStats = async () => {
  const [statusCounts, total] = await Promise.all([
    leadRepository.countByStatus(),
    leadRepository.totalCount(),
  ]);

  const stats = { total };
  const statusMap = {
    New: 0, Contacted: 0, Qualified: 0, 'Proposal Sent': 0, Won: 0, Lost: 0,
  };
  statusCounts.forEach((s) => { statusMap[s._id] = s.count; });
  Object.assign(stats, statusMap);

  return stats;
};

module.exports = { createLead, getLeads, getLeadById, updateLead, deleteLead, getDashboardStats };
