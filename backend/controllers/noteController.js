const noteService = require('../services/noteService');
const { success } = require('../utils/response');

const create = async (req, res, next) => {
  try {
    const note = await noteService.addNote(req.validatedBody, req.user._id);
    return success(res, note, 'Note added', 201);
  } catch (err) {
    next(err);
  }
};

module.exports = { create };
