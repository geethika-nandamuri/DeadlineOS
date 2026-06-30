const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const { generateToken, protect } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../services/emailService');

/* ─────────────────────────────────────────────────────
   POST /api/auth/register
───────────────────────────────────────────────────── */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        settings: user.settings,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

/* ─────────────────────────────────────────────────────
   POST /api/auth/login
───────────────────────────────────────────────────── */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Explicitly select password (it's excluded by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        settings: user.settings,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

/* ─────────────────────────────────────────────────────
   GET /api/auth/me — get current user
───────────────────────────────────────────────────── */
router.get('/me', protect, (req, res) => {
  res.json({
    user: {
      id:       req.user._id,
      name:     req.user.name,
      email:    req.user.email,
      settings: req.user.settings,
      createdAt: req.user.createdAt,
    },
  });
});

/* ─────────────────────────────────────────────────────
   PATCH /api/auth/settings — update user settings
───────────────────────────────────────────────────── */
router.patch('/settings', protect, async (req, res) => {
  try {
    const booleanFields = [
      'darkMode', 'emailNotifications', 'dailySummary', 'weeklyReport',
      'reminderAt24h', 'reminderAt6h', 'reminderAt1h', 'reminderAt30m',
      'reminderCustom', 'aiProductivityEmails'
    ];
    const numberFields = [
      'workStartHour', 'workEndHour', 'focusDuration', 'breakDuration',
      'customReminderThreshold'
    ];
    const stringFields = ['timezone'];

    for (const key of booleanFields) {
      if (req.body[key] !== undefined && typeof req.body[key] !== 'boolean') {
        return res.status(400).json({ message: `${key} must be a boolean value.` });
      }
    }

    for (const key of numberFields) {
      if (req.body[key] !== undefined && (typeof req.body[key] !== 'number' || isNaN(req.body[key]))) {
        return res.status(400).json({ message: `${key} must be a number.` });
      }
    }

    if (req.body.customReminderThreshold !== undefined && req.body.customReminderThreshold < 0) {
      return res.status(400).json({ message: 'customReminderThreshold must be a non-negative number.' });
    }

    if (req.body.timezone !== undefined && typeof req.body.timezone !== 'string') {
      return res.status(400).json({ message: 'timezone must be a string.' });
    }

    const allowed = [
      'workStartHour', 'workEndHour', 'focusDuration', 'breakDuration',
      'timezone', 'darkMode', 'emailNotifications', 'dailySummary',
      'weeklyReport', 'reminderAt24h', 'reminderAt6h', 'reminderAt1h',
      'reminderAt30m', 'reminderCustom', 'customReminderThreshold', 'aiProductivityEmails',
    ];

    const updates = {};
    allowed.forEach(key => {
      if (req.body[key] !== undefined) {
        updates[`settings.${key}`] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true });
    res.json({ settings: user.settings });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update settings.' });
  }
});

/* ─────────────────────────────────────────────────────
   POST /api/auth/forgot-password
───────────────────────────────────────────────────── */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always respond with success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If an account exists, a reset link has been sent.' });
    }

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken   = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${rawToken}`;

    try {
      await sendPasswordResetEmail(user, resetUrl);
    } catch (emailErr) {
      // Clean up token if email fails
      user.resetPasswordToken   = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Password reset email failed:', emailErr.message);
      return res.status(500).json({ message: 'Could not send reset email. Please try again later.' });
    }

    res.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

/* ─────────────────────────────────────────────────────
   POST /api/auth/reset-password
───────────────────────────────────────────────────── */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken:   hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired.' });
    }

    user.password             = password;
    user.resetPasswordToken   = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const jwtToken = generateToken(user._id);
    res.json({ message: 'Password reset successful.', token: jwtToken });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ message: 'Password reset failed. Please try again.' });
  }
});

module.exports = router;
