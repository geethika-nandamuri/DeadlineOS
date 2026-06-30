const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const { runSequentialAIOrchestrator } = require('../services/orchestrator');

/* ─────────────────────────────────────────────────────
   GET /api/analytics/dashboard
   Returns all dashboard metrics in one optimized response
───────────────────────────────────────────────────── */
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const settings = req.user.settings || { workStartHour: 8, workEndHour: 20 };
    const workHours = Math.max(1, settings.workEndHour - settings.workStartHour);

    // Fetch all user's tasks
    const allTasks = await Task.find({ userId });

    if (allTasks.length === 0) {
      return res.json({
        hasData: false,
        tasksCount: 0,
        completedCount: 0,
        activeCount: 0,
        successProbability: 100,
        deadlineRisk: 0,
        burnoutRisk: 0,
        focusFactor: 100,
        weeklyData: [],
        categoryData: [],
        completionPie: []
      });
    }

    const activeTasks = allTasks.filter(t => !t.completed);
    const completedTasks = allTasks.filter(t => t.completed);

    // 1. Completion breakdown
    const completionPie = [
      { name: 'Completed', value: completedTasks.length },
      { name: 'Active', value: activeTasks.length }
    ];

    // 2. Hours by Category
    const categoryMap = {};
    allTasks.forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.estimatedHours;
    });
    const categoryData = Object.entries(categoryMap).map(([name, hours]) => ({
      name,
      hours: parseFloat(hours.toFixed(1))
    }));

    // 3. Weekly Completion Data (last 7 days, Monday to Sunday)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyData = weekdays.map((dayName, index) => {
      const dayStart = new Date(monday);
      dayStart.setDate(monday.getDate() + index);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      // Tasks completed on this specific day
      const completedOnDay = completedTasks.filter(t => {
        const d = new Date(t.createdAt);
        return d >= dayStart && d < dayEnd;
      });

      // Sum of completed tasks' hours on this day
      const hoursOnDay = completedOnDay.reduce((sum, t) => sum + t.estimatedHours, 0);

      return {
        day: dayName,
        completed: completedOnDay.length,
        hours: parseFloat(hoursOnDay.toFixed(1))
      };
    });

    // 4. Run AI Orchestrator pass to get schedule, risks, and coach recommendation
    const aiAnalysis = await runSequentialAIOrchestrator(activeTasks);

    // Calculate Schedule Fullness
    const todayTasks = activeTasks.filter(t => {
      const d = new Date(t.deadline);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    });
    const todayScheduledHours = todayTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    const scheduleFullness = Math.min(100, Math.round((todayScheduledHours / workHours) * 100));

    // Get metrics from AI or fall back safely
    const risk = aiAnalysis?.riskReport || {};
    const successProbability = risk.successProbability !== undefined ? risk.successProbability : Math.max(30, 100 - (activeTasks.length * 5));
    const deadlineRisk = risk.deadlineRisk !== undefined ? risk.deadlineRisk : Math.min(100, activeTasks.length * 12);
    const focusFactor = risk.focusFactor !== undefined ? risk.focusFactor : Math.max(50, 95 - (activeTasks.length * 4));

    res.json({
      hasData: true,
      tasksCount: allTasks.length,
      completedCount: completedTasks.length,
      activeCount: activeTasks.length,
      successProbability,
      deadlineRisk,
      burnoutRisk: scheduleFullness, // Schedule Fullness
      focusFactor,
      weeklyData,
      categoryData,
      completionPie,
      scheduleReport: aiAnalysis?.scheduleReport || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate dashboard analytics', error: error.message });
  }
});

module.exports = router;
