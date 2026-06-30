const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const { runSequentialAIOrchestrator } = require('../services/orchestrator');

// All routes below require authentication
router.use(protect);

/* ─────────────────────────────────────────────────────
   GET /api/tasks — Retrieve this user's tasks
───────────────────────────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving tasks', error: error.message });
  }
});

/* ─────────────────────────────────────────────────────
   POST /api/tasks — Create a new task for this user
───────────────────────────────────────────────────── */
router.post('/', async (req, res) => {
  try {
    // Backend logging for incoming payloads
    console.log("Incoming Task Payload:", req.body);

    // Support both direct names and aliases to handle any frontend-backend mismatches
    const title = req.body.title || req.body.taskName;
    const description = req.body.description !== undefined ? req.body.description : '';
    const deadline = req.body.deadline || req.body.dueDate;
    const estimatedHours = req.body.estimatedHours !== undefined ? req.body.estimatedHours : req.body.estimated_hours;
    const category = req.body.category;
    const difficulty = req.body.difficulty;

    // Specific field validation errors
    if (!title) {
      return res.status(400).json({ message: 'Title is required.' });
    }
    if (!deadline) {
      return res.status(400).json({ message: 'Deadline is required.' });
    }
    if (estimatedHours === undefined || estimatedHours === null || estimatedHours === '') {
      return res.status(400).json({ message: 'Estimated hours is required.' });
    }
    if (!difficulty) {
      return res.status(400).json({ message: 'Difficulty is required.' });
    }
    if (!category) {
      return res.status(400).json({ message: 'Category is required.' });
    }

    const newTask = new Task({
      userId: req.user._id,
      title,
      description,
      deadline: new Date(deadline),
      estimatedHours: Number(estimatedHours),
      category,
      difficulty,
      completed: false,
    });

    const savedTask = await newTask.save();
    
    // Send immediate creation email
    if (req.user && req.user.settings?.emailNotifications) {
      const { sendTaskCreatedEmail } = require('../services/emailService');
      try {
        await sendTaskCreatedEmail(req.user, savedTask);
      } catch (emailErr) {
        console.error('[EMAIL] Failed to send creation email:', emailErr.message);
      }
    }

    // Return HTTP 201 with saved task
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
});

/* ─────────────────────────────────────────────────────
   PUT /api/tasks/:id — Update (ownership enforced)
───────────────────────────────────────────────────── */
router.put('/:id', async (req, res) => {
  try {
    console.log("Incoming Task Update Payload:", req.body);

    const title = req.body.title || req.body.taskName;
    const description = req.body.description;
    const deadline = req.body.deadline || req.body.dueDate;
    const estimatedHours = req.body.estimatedHours !== undefined ? req.body.estimatedHours : req.body.estimated_hours;
    const category = req.body.category;
    const difficulty = req.body.difficulty;
    const completed = req.body.completed;
    const priority = req.body.priority;

    const updateData = {};
    if (title          !== undefined) updateData.title          = title;
    if (description    !== undefined) updateData.description    = description;
    if (deadline       !== undefined) updateData.deadline       = new Date(deadline);
    if (estimatedHours !== undefined) updateData.estimatedHours = Number(estimatedHours);
    if (category       !== undefined) updateData.category       = category;
    if (difficulty     !== undefined) updateData.difficulty     = difficulty;
    if (completed      !== undefined) updateData.completed      = completed;
    if (priority       !== undefined) updateData.priority       = Number(priority);

    const existingTask = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!existingTask) return res.status(404).json({ message: 'Task not found or access denied.' });

    const wasCompletedBefore = existingTask.completed;

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: updateData },
      { new: true }
    );
    if (!updatedTask) return res.status(404).json({ message: 'Task not found or access denied.' });

    if (completed === true && !wasCompletedBefore) {
      const User = require('../models/User');
      const user = await User.findById(req.user._id);
      if (user && user.settings?.emailNotifications) {
        const { sendCompletionEmail } = require('../services/emailService');
        try {
          await sendCompletionEmail(user, updatedTask);
        } catch (emailErr) {
          console.error('[EMAIL] Failed to send completion email:', emailErr.message);
        }
      }
    }
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
});

/* ─────────────────────────────────────────────────────
   DELETE /api/tasks/:id — Delete (ownership enforced)
───────────────────────────────────────────────────── */
router.delete('/:id', async (req, res) => {
  try {
    const deletedTask = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deletedTask) return res.status(404).json({ message: 'Task not found or access denied.' });
    res.json({ message: 'Task removed.', task: deletedTask });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
});

module.exports = router;
