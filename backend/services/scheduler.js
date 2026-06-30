const cron = require('node-cron');
const Task = require('../models/Task');
const User = require('../models/User');
const ReminderLog = require('../models/ReminderLog');
const {
  sendDeadlineReminder,
  sendDailySummaryEmail,
  sendWeeklyReportEmail,
} = require('./emailService');

/* ─── Import orchestrator for AI content generation ─── */
let orchestrator;
try { orchestrator = require('./orchestrator'); } catch { orchestrator = null; }

/* ─── Generate AI content for a single task reminder ─── */
async function generateReminderAIContent(task, user, timeLabel) {
  if (!orchestrator) return null;
  try {
    const hoursLeft = timeLabel === '24h' ? 24 : timeLabel === '6h' ? 6 : 1;
    const prompt = `
You are an AI productivity coach for a scheduling app. A user has a task due in ${hoursLeft} hour(s).

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
      // Split into analysis + recommendation
      const parts = result.split(/\n\n/);
      return {
        analysis:       parts[0] || result,
        recommendation: parts[1] || '',
      };
    }
  } catch (err) {
    console.error('[CRON] AI content generation failed:', err.message);
  }
  return null;
}

/* ─── Generate AI content for daily summary ─── */
async function generateDailySummaryAI(tasks, user) {
  if (!orchestrator) return null;
  try {
    const activeTasks = tasks.filter(t => !t.completed);
    if (activeTasks.length === 0) return 'Great news — you have no pending tasks today! 🎉';

    const taskList = activeTasks.slice(0, 5)
      .map(t => `- ${t.title} (${t.difficulty}, ${t.estimatedHours}h, due ${new Date(t.deadline).toLocaleDateString()})`)
      .join('\n');

    const prompt = `
You are an AI productivity coach. It's morning and a user named ${user.name} is starting their day.

Their active tasks:
${taskList}

Write a short morning message (3-4 sentences) with:
1. The most important task to start with and why.
2. One time management tip for today.
3. An encouraging closing line.

Keep it warm, concise, and practical.
    `.trim();

    return await orchestrator.callGemini(prompt);
  } catch (err) {
    console.error('[CRON] Daily summary AI failed:', err.message);
    return null;
  }
}

/* ─── Generate AI content for weekly report ─── */
async function generateWeeklyReportAI(stats, user) {
  if (!orchestrator) return null;
  try {
    const prompt = `
You are an AI productivity coach writing a weekly report for ${user.name}.

Their week stats:
- Tasks completed: ${stats.completed}
- Tasks missed: ${stats.missed || 0}
- Completion rate: ${stats.total > 0 ? Math.round(stats.completed / stats.total * 100) : 0}%
- Top category: ${stats.topCategory || 'N/A'}

Write 2-3 sentences of specific, actionable suggestions for next week to help them improve.
Be encouraging but honest. Keep it warm and practical.
    `.trim();

    return await orchestrator.callGemini(prompt);
  } catch (err) {
    console.error('[CRON] Weekly report AI failed:', err.message);
    return null;
  }
}

/* ─── Check if reminder was already sent (deduplication) ─── */
async function wasAlreadySent(taskId, type, windowHours = 23) {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
  const log = await ReminderLog.findOne({
    taskId,
    type,
    sentAt: { $gte: since },
    status: 'sent',
  });
  return !!log;
}

/* ─── Log a sent reminder ─── */
async function logReminder(userId, task, type, subject, status = 'sent', errorMsg = null) {
  try {
    await ReminderLog.create({
      userId,
      taskId:    task._id,
      taskTitle: task.title,
      type,
      subject,
      sentAt:    new Date(),
      status,
      errorMsg,
    });
  } catch (err) {
    if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
      console.log('Reminder already sent.');
    } else {
      console.error('[CRON] Failed to log reminder:', err.message);
    }
  }
}

/* ════════════════════════════�/* ═══════════════════════════════════════════════════════
   CRON JOB 1 — Deadline Reminders & AI Overload Checker
   ═══════════════════════════════════════════════════════ */
function startDeadlineReminderJob() {
  const isDev = process.env.NODE_ENV === 'development';
  const cronPattern = isDev ? '* * * * *' : '0 * * * *';

  cron.schedule(cronPattern, async () => {
    console.log(`[CRON] Running deadline reminders check (${isDev ? 'Dev mode, every minute' : 'Production mode, hourly'})…`);
    try {
      const now = new Date();

      // Get all active tasks with deadlines in the future
      // Dev mode: up to 10 minutes. Prod mode: up to 25 hours.
      const queryMaxTime = isDev 
        ? now.getTime() + 10 * 60 * 1000 
        : now.getTime() + 25 * 60 * 60 * 1000;

      const tasks = await Task.find({
        completed: false,
        deadline: {
          $gte: now,
          $lte: new Date(queryMaxTime),
        },
      }).populate({ path: 'userId', select: 'name email settings', model: User });

      for (const task of tasks) {
        const user = task.userId;
        if (!user || !user.settings?.emailNotifications) continue;

        // In Dev mode we check minutes; in Prod mode we check hours
        const diffVal = isDev
          ? (new Date(task.deadline) - now) / (1000 * 60)
          : (new Date(task.deadline) - now) / (1000 * 60 * 60);

        let windows = [];
        if (isDev) {
          windows = [
            { label: '24h',    min: 4,   max: 6,   enabled: user.settings.reminderAt24h }, // 5 minutes before deadline
            { label: '1h',     min: 0.5, max: 1.5, enabled: user.settings.reminderAt1h  }  // 1 minute before deadline
          ];
        } else {
          windows = [
            { label: '24h',    min: 23,   max: 25,   enabled: user.settings.reminderAt24h },
            { label: '6h',     min: 5,    max: 7,    enabled: user.settings.reminderAt6h  },
            { label: '1h',     min: 0.75, max: 1.25, enabled: user.settings.reminderAt1h  },
            { label: '30m',    min: 0.25, max: 0.75, enabled: user.settings.reminderAt30m },
            { 
              label: 'custom', 
              min: (user.settings.customReminderThreshold || 2) - 0.25, 
              max: (user.settings.customReminderThreshold || 2) + 0.25, 
              enabled: user.settings.reminderCustom 
            }
          ];
        }

        for (const w of windows) {
          if (!w.enabled) continue;
          if (diffVal < w.min || diffVal > w.max) continue;

          // Deduplication check: in dev mode, we look back 5 minutes; in prod, 22 hours
          const lookbackWindow = isDev ? 5 / 60 : 22;
          const alreadySent = await wasAlreadySent(task._id, w.label, lookbackWindow);
          if (alreadySent) continue;

          const aiContent = await generateReminderAIContent(task, user, w.label);
          const subjectMap = {
            '24h': `📅 "${task.title}" is due tomorrow`,
            '6h':  `⏰ "${task.title}" is due in 6 hours`,
            '1h':  `⚡ "${task.title}" is due in 1 hour`,
            '30m': `⏰ "${task.title}" is due in 30 minutes`,
            'custom': `🔔 Reminder: "${task.title}" is due soon`,
          };

          try {
            await sendDeadlineReminder(user, task, aiContent, w.label);
            await logReminder(user._id, task, w.label, subjectMap[w.label] || `Reminder: "${task.title}"`);
            console.log(`[CRON] Sent ${w.label} reminder to ${user.email} for "${task.title}"`);
          } catch (err) {
            await logReminder(user._id, task, w.label, subjectMap[w.label] || `Reminder: "${task.title}"`, 'failed', err.message);
            console.error(`[CRON] Failed to send reminder:`, err.message);
          }
        }
      }

      // Check for AI Productivity Overload Insight
      const activeUsers = await User.find({ 'settings.emailNotifications': true, 'settings.aiProductivityEmails': true });
      for (const user of activeUsers) {
        const userTasks = await Task.find({ userId: user._id, completed: false });
        const totalHours = userTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
        
        const dueWithin48h = userTasks.filter(t => {
          const diff = new Date(t.deadline) - now;
          return diff > 0 && diff <= 48 * 60 * 60 * 1000;
        }).length;

        // Burnout risk calculation
        const hardTasksCount = userTasks.filter(t => t.difficulty === 'Hard').length;
        const burnoutRisk = Math.max(15, Math.min(95, Math.round((totalHours * 3.5) + (hardTasksCount * 12))));

        // Overload triggers: total workload exceeds 10h, or multiple deadlines within 48h, or high burnout risk
        const isOverloaded = totalHours > 10 || dueWithin48h >= 3 || burnoutRisk > 60;

        if (isOverloaded) {
          const lookbackWindow = isDev ? 5 / 60 : 23;
          const alreadySent = await wasAlreadySent(user._id, 'ai_productivity', lookbackWindow);
          if (!alreadySent) {
            let aiContent = "Please pace your tasks and delegate or defer some items to prevent cognitive fatigue and burnout.";
            if (orchestrator) {
              try {
                const prompt = `
User ${user.name} is overloaded.
- Active task count: ${userTasks.length}
- Total planned workload: ${totalHours} hours
- Tasks due in 48 hours: ${dueWithin48h}
- Predicted Burnout Risk: ${burnoutRisk}%

Write a supportive, concise 2-3 sentence AI coach recommendation advising them on how to prioritize, handle the overload, and avoid burnout.
                `.trim();
                aiContent = await orchestrator.callGemini(prompt);
              } catch (err) {
                console.error('[CRON] Overload AI content failed:', err.message);
              }
            }

            try {
              const { sendAIProductivityEmail } = require('./emailService');
              await sendAIProductivityEmail(user, { totalHours, dueWithin48h, burnoutRisk }, aiContent);
              await logReminder(user._id, { _id: user._id, title: 'AI Productivity Overload' }, 'ai_productivity', `⚠️ Workload Overload Warning - AI Suggestions`);
              console.log(`[CRON] Sent AI productivity overload email to ${user.email}`);
            } catch (err) {
              console.error('[CRON] Failed to send AI productivity overload email:', err.message);
            }
          }
        }
      }

    } catch (err) {
      console.error('[CRON] Deadline reminder job error:', err.message);
    }
  });

  console.log(`[CRON] Deadline reminder job scheduled (Interval: ${isDev ? '1 minute' : '1 hour'}).`);
}

/* ═══════════════════════════════════════════════════════
   CRON JOB 2 — Daily Agenda (8 AM every day, minutes in dev)
   ═══════════════════════════════════════════════════════ */
function startDailySummaryJob() {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    console.log('[CRON] Daily summary job disabled in development mode.');
    return;
  }
  const cronPattern = '0 8 * * *';

  cron.schedule(cronPattern, async () => {
    console.log('[CRON] Checking daily summaries…');
    try {
      const users = await User.find({ 'settings.dailySummary': true, 'settings.emailNotifications': true });

      for (const user of users) {
        // Daily Summary deduplication lookback: 5 minutes in dev, 23 hours in prod
        const lookbackWindow = isDev ? 4 / 60 : 23;
        const alreadySent = await wasAlreadySent(user._id, 'daily_summary', lookbackWindow);
        if (alreadySent) continue;

        try {
          const tasks = await Task.find({ userId: user._id });
          const aiContent = await generateDailySummaryAI(tasks, user);
          await sendDailySummaryEmail(user, tasks, aiContent);

          await logReminder(user._id, { _id: user._id, title: 'Daily Agenda Summary' }, 'daily_summary', `☀️ Good morning, ${user.name} — your plan for today`);
          console.log(`[CRON] Daily summary sent to ${user.email}`);
        } catch (err) {
          console.error(`[CRON] Daily summary failed for ${user.email}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[CRON] Daily summary job error:', err.message);
    }
  });

  console.log(`[CRON] Daily summary job scheduled (Interval: ${isDev ? '5 minutes' : '8 AM daily'}).`);
}

/* ═══════════════════════════════════════════════════════
   CRON JOB 3 — Weekly Report (Sunday 6 PM)
   ═══════════════════════════════════════════════════════ */
function startWeeklyReportJob() {
  cron.schedule('0 18 * * 0', async () => {
    console.log('[CRON] Sending weekly reports…');
    try {
      const users = await User.find({ 'settings.weeklyReport': true, 'settings.emailNotifications': true });

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      for (const user of users) {
        try {
          const allTasks = await Task.find({
            userId: user._id,
            createdAt: { $gte: oneWeekAgo },
          });

          const completed = allTasks.filter(t =>  t.completed).length;
          const missed    = allTasks.filter(t => !t.completed && new Date(t.deadline) < new Date()).length;

          // Top category
          const catCount = {};
          allTasks.filter(t => t.completed).forEach(t => {
            catCount[t.category] = (catCount[t.category] || 0) + 1;
          });
          const topCategory = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0];

          const stats = { total: allTasks.length, completed, missed, topCategory };
          const aiContent = await generateWeeklyReportAI(stats, user);

          await sendWeeklyReportEmail(user, stats, aiContent);
          await logReminder(user._id, { _id: null, title: 'Weekly Report' }, 'weekly_report', `📊 Your weekly productivity report`);
          console.log(`[CRON] Weekly report sent to ${user.email}`);
        } catch (err) {
          console.error(`[CRON] Weekly report failed for ${user.email}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[CRON] Weekly report job error:', err.message);
    }
  });

  console.log('[CRON] Weekly report job scheduled (Sunday 6 PM).');
}

/* ─── Start all jobs ─── */
function startAllJobs() {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    console.log('[CRON] Development Mode Enabled');
    console.log('Reminder check interval: Every 1 minute');
    console.log('Reminder threshold: 5 minutes before deadline');
  } else {
    console.log('[CRON] Production Mode Enabled');
    console.log('Reminder check interval: Every 1 hour');
  }

  startDeadlineReminderJob();
  startDailySummaryJob();
  startWeeklyReportJob();
  console.log('[CRON] All scheduled jobs started.');
}

module.exports = { startAllJobs, logReminder };
