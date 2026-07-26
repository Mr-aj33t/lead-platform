const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: {
    type: String,
    enum: ['Lead Created', 'Lead Updated', 'Lead Assigned', 'Status Changed', 'Note Added', 'Lead Deleted'],
    required: true,
  },
  description: { type: String, required: true },
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
}, { timestamps: true });

activitySchema.index({ createdAt: -1 });
activitySchema.index({ lead: 1 });

module.exports = mongoose.model('Activity', activitySchema);
