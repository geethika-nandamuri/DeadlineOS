const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const { sendDeadlineReminder } = require('../services/emailService');
const { protect } = require('../middleware/auth');

// All debug routes require auth
router.use(protect);

/* ─────────────────────────────────────────────────────
   POST /api/debug/send-reminder/:taskId
   ───────────────────────────────────────────────────── */
router.post('/send-reminder/:taskId', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.taskId, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Load orchestrator if available for AI content
    let orchestrator;
    try { orchestrator = require('../services/orchestrator'); } catch {}

    let aiContent = null;
    if (orchestrator) {
      try {
        const prompt = `
You are an AI productivity coach for a scheduling app. A user has a task due in 24 hours.

Task: "${task.title}"
Difficulty: ${task.difficulty}
Estimated hours: ${task.estimatedHours}
Category: ${task.category}

Write a short, encouraging, practical AI analysis (2-3 sentences) including:
1. A realistic assessment of whether they can finish in time.
2. One specific, actionable recommendation.

Keep it concise, warm, and motivating. No bullet points, just prose.
        `.trim();
        const result = await orchestrator.callGemini(prompt);
        if (result) {
          const parts = result.split(/\n\n/);
          aiContent = {
            analysis:       parts[0] || result,
            recommendation: parts[1] || '',
          };
        }
      } catch (err) {
        console.error('[DEBUG] AI content generation failed:', err.message);
      }
    }

    // Send the reminder
    const info = await sendDeadlineReminder(user, task, aiContent, '24h');
    res.json({ message: 'Reminder sent successfully.', info });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send reminder', error: error.message });
  }
});

module.exports = router;
