const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  // --- Ownership ---
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // --- Core fields ---
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: { type: String, default: '' },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required'],
  },
  estimatedHours: {
    type: Number,
    required: [true, 'Estimated hours is required'],
    min: [0.1, 'Must be at least 0.1 hours'],
  },
  category:   { type: String, required: true, trim: true },
  difficulty: { type: String, required: true, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  priority:   { type: Number, default: 50 },
  completed:  { type: Boolean, default: false },
  createdAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('Task', TaskSchema);
