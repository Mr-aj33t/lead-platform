const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
