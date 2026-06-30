const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const ReminderLog = require('../models/ReminderLog');
const { protect } = require('../middleware/auth');
const { runSequentialAIOrchestrator, runJarvisChat } = require('../services/orchestrator');

// All routes require authentication
router.use(protect);

const getActiveTasks = async (userId) => {
  return await Task.find({ userId, completed: false });
};

/* ─── POST /api/ai/analyze ─── */
router.post('/analyze', async (req, res) => {
  try {
    const activeTasks = await getActiveTasks(req.user._id);
    const analysis = await runSequentialAIOrchestrator(activeTasks);

    if (analysis?.priorityReport?.length > 0) {
      for (const item of analysis.priorityReport) {
        await Task.updateOne({ userId: req.user._id, title: item.title }, { $set: { priority: item.priorityScore } });
      }
    }

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: 'AI analysis failed', error: error.message });
  }
});

/* ─── POST /api/ai/chat ─── */
router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ message: 'Missing chat message.' });

    const activeTasks = await getActiveTasks(req.user._id);
    const analysis    = await runSequentialAIOrchestrator(activeTasks);

    const chatResult = await runJarvisChat(
      activeTasks,
      analysis.scheduleReport,
      analysis.riskReport,
      history || [],
      message
    );

    res.json(chatResult);
  } catch (error) {
    res.status(500).json({ message: 'AI chat error', error: error.message });
  }
});

/* ─── GET /api/ai/notifications — Notification history for dashboard ─── */
router.get('/notifications', async (req, res) => {
  try {
    const logs = await ReminderLog.find({ userId: req.user._id })
      .sort({ sentAt: -1 })
      .limit(20);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load notification history', error: error.message });
  }
});

/* ─── POST /api/ai/schedule ─── */
router.post('/schedule', async (req, res) => {
  try {
    const activeTasks = await getActiveTasks(req.user._id);
    const analysis = await runSequentialAIOrchestrator(activeTasks);
    res.json({ schedule: analysis.scheduleReport });
  } catch (error) {
    res.status(500).json({ message: 'Schedule generation failed', error: error.message });
  }
});

/* ─── POST /api/ai/predict ─── */
router.post('/predict', async (req, res) => {
  try {
    const activeTasks = await getActiveTasks(req.user._id);
    const analysis = await runSequentialAIOrchestrator(activeTasks);
    res.json({ risk: analysis.riskReport });
  } catch (error) {
    res.status(500).json({ message: 'AI prediction failed', error: error.message });
  }
});

module.exports = router;
