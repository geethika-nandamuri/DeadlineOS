const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned in queries by default
    },

    // --- Password reset ---
    resetPasswordToken:   { type: String,   select: false },
    resetPasswordExpires: { type: Date,      select: false },

    // --- User preferences (used by AI scheduler & notifications) ---
    settings: {
      workStartHour:        { type: Number, default: 8  }, // 8 AM
      workEndHour:          { type: Number, default: 20 }, // 8 PM
      focusDuration:        { type: Number, default: 90 }, // minutes
      breakDuration:        { type: Number, default: 15 }, // minutes
      timezone:             { type: String, default: 'Asia/Kolkata' },
      darkMode:             { type: Boolean, default: false },
      emailNotifications:   { type: Boolean, default: true },
      dailySummary:         { type: Boolean, default: true },
      weeklyReport:         { type: Boolean, default: true },
      reminderAt24h:        { type: Boolean, default: true },
      reminderAt6h:         { type: Boolean, default: true },
      reminderAt1h:         { type: Boolean, default: true },
      reminderAt30m:        { type: Boolean, default: true },
      reminderCustom:       { type: Boolean, default: false },
      customReminderThreshold: { type: Number, default: 2 },
      aiProductivityEmails: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

// --- Hash password before saving ---
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- Compare passwords ---
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
