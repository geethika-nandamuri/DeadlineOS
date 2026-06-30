const mongoose = require('mongoose');

/**
 * Tracks every reminder email sent so we never send duplicates.
 * Also powers the "Notification History" panel on the Dashboard.
 */
const ReminderLogSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  taskId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: false },
  taskTitle: { type: String, required: true },
  type: {
    type: String,
    enum: ['24h', '6h', '1h', '30m', 'custom', 'daily_summary', 'weekly_report', 'completion', 'ai_productivity'],
    required: true,
  },
  subject:   { type: String, required: true },
  sentAt:    { type: Date,   default: Date.now, index: true },
  status:    { type: String, enum: ['sent', 'failed'], default: 'sent' },
  errorMsg:  { type: String },
});

// Compound unique index: one reminder of a given type per task per user
ReminderLogSchema.index(
  { taskId: 1, type: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: { $in: ['24h', '6h', '1h', '30m', 'custom', 'completion'] }
    }
  }
);

module.exports = mongoose.model('ReminderLog', ReminderLogSchema);
