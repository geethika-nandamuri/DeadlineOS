const nodemailer = require('nodemailer');

/* ─── Create transporter (lazy init so missing env vars don't crash startup) ─── */
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const hasUser = !!process.env.EMAIL_USER;
  const hasPass = !!process.env.EMAIL_PASS;
  const host    = process.env.EMAIL_HOST;
  const port    = parseInt(process.env.EMAIL_PORT) || 587;
  const secure  = port === 465;

  console.log('[EMAIL] EMAIL_USER present:', hasUser);
  console.log('[EMAIL] EMAIL_PASS present:', hasPass);
  console.log('[EMAIL] SMTP host:', host);
  console.log('[EMAIL] SMTP port:', port);
  console.log('[EMAIL] Secure mode:', secure);

  if (!host || !hasUser || !hasPass) {
    console.warn('[EMAIL] SMTP credentials not configured. Emails will be skipped.');
    return null;
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout:   10000,
    socketTimeout:     15000,
    dnsTimeout:        10000,
    debug:  true,
    logger: true,
  });

  return _transporter;
}

/* ─── Generic send helper ─── */
async function sendEmail({ to, subject, html, text }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[EMAIL SKIP] Would send "${subject}" to ${to}`);
    return { skipped: true };
  }

  try {
    await transporter.verify();
    console.log('[EMAIL] SMTP connection verified successfully.');
  } catch (err) {
    console.error('[EMAIL] SMTP verify failed — aborting send.');
    console.error('[EMAIL] err.message:',      err.message);
    console.error('[EMAIL] err.code:',         err.code);
    console.error('[EMAIL] err.command:',      err.command);
    console.error('[EMAIL] err.response:',     err.response);
    console.error('[EMAIL] err.responseCode:', err.responseCode);
    console.error('[EMAIL] err.stack:',        err.stack);
    throw err;
  }

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `DeadlineOS <no-reply@deadlineos.com>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''),
  });

  console.log(`[EMAIL SENT] "${subject}" → ${to} (${info.messageId})`);
  return info;
}

/* ─── Shared HTML layout wrapper ─── */
function emailLayout(title, body) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<style>
  body { margin:0; padding:0; background:#F8FAFC; font-family:'Segoe UI',Arial,sans-serif; color:#0F172A; }
  .container { max-width:600px; margin:32px auto; background:#fff; border-radius:16px; border:1px solid #E2E8F0; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.06); }
  .header { background:linear-gradient(135deg,#6366F1,#06B6D4); padding:28px 32px; }
  .header h1 { margin:0; color:#fff; font-size:20px; font-weight:700; }
  .header p  { margin:4px 0 0; color:rgba(255,255,255,0.85); font-size:13px; }
  .body { padding:28px 32px; }
  .footer { background:#F8FAFC; border-top:1px solid #E2E8F0; padding:16px 32px; text-align:center; font-size:12px; color:#94A3B8; }
  h2 { font-size:16px; color:#0F172A; margin:20px 0 8px; }
  p  { font-size:14px; line-height:1.6; color:#374151; margin:8px 0; }
  .badge { display:inline-block; padding:3px 10px; border-radius:99px; font-size:11px; font-weight:600; }
  .badge-red    { background:#FEE2E2; color:#991B1B; }
  .badge-yellow { background:#FEF9C3; color:#854D0E; }
  .badge-green  { background:#DCFCE7; color:#166534; }
  .badge-blue   { background:#EEF2FF; color:#4338CA; }
  .task-row { background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px 16px; margin:8px 0; }
  .task-row h3 { margin:0 0 4px; font-size:14px; }
  .task-row p  { margin:0; font-size:12px; color:#64748B; }
  .btn { display:inline-block; background:#6366F1; color:#fff; padding:12px 24px; border-radius:10px; text-decoration:none; font-weight:600; font-size:14px; margin-top:12px; }
  .divider { border:none; border-top:1px solid #E2E8F0; margin:20px 0; }
  .highlight { background:#EEF2FF; border-left:4px solid #6366F1; padding:12px 16px; border-radius:0 10px 10px 0; margin:12px 0; }
  .stat-grid { display:flex; gap:12px; flex-wrap:wrap; margin:12px 0; }
  .stat-box { flex:1; min-width:120px; background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px; text-align:center; }
  .stat-box .val { font-size:24px; font-weight:700; color:#6366F1; }
  .stat-box .lbl { font-size:11px; color:#64748B; margin-top:2px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🧠 DeadlineOS</h1>
    <p>${title}</p>
  </div>
  <div class="body">${body}</div>
  <div class="footer">
    You're receiving this because you have an active DeadlineOS account.<br/>
    © 2026 DeadlineOS
  </div>
</div>
</body>
</html>`;
}

/* ═══════════════════════════════════════════════════════
   1. PASSWORD RESET
═══════════════════════════════════════════════════════ */
async function sendPasswordResetEmail(user, resetUrl) {
  const body = `
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>We received a request to reset your DeadlineOS password. Click the button below to set a new password:</p>
    <a href="${resetUrl}" class="btn">Reset My Password</a>
    <p style="margin-top:16px; font-size:12px; color:#94A3B8;">
      This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.
    </p>
    <hr class="divider"/>
    <p style="font-size:11px;color:#94A3B8;">Or copy this link: ${resetUrl}</p>
  `;

  return sendEmail({
    to:      user.email,
    subject: '🔑 Reset your DeadlineOS password',
    html:    emailLayout('Password Reset', body),
  });
}

/* ═══════════════════════════════════════════════════════
   2. DEADLINE REMINDER (AI-personalised)
═══════════════════════════════════════════════════════ */
async function sendDeadlineReminder(user, task, aiContent, timeLabel) {
  const deadlineStr = new Date(task.deadline).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

  const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  let urgencyBadge = '';
  let urgentNotice = '';
  if (timeLabel === '30m') {
    urgencyBadge = `<span class="badge badge-red">⏰ Due in 30 minutes</span>`;
    urgentNotice = `<p><strong>This task is due soon.</strong> Please review your immediate plan below.</p>`;
  } else if (timeLabel === '1h') {
    urgencyBadge = `<span class="badge badge-red">⚡ Due in 1 hour</span>`;
    urgentNotice = `<p><strong>This task is due soon.</strong> Please review your immediate plan below.</p>`;
  } else if (timeLabel === '6h') {
    urgencyBadge = `<span class="badge badge-yellow">⏰ Due in 6 hours</span>`;
  } else if (timeLabel === '24h') {
    urgencyBadge = `<span class="badge badge-blue">📅 Due in 24 hours</span>`;
  } else {
    urgencyBadge = `<span class="badge badge-blue">🔔 Due in ${timeLabel}</span>`;
    urgentNotice = `<p><strong>This task is due soon.</strong> Please review your immediate plan below.</p>`;
  }

  const priorityScore = task.priority || 50;

  const body = `
    <p>Hi <strong>${user.name}</strong>,</p>
    ${urgencyBadge}
    ${urgentNotice}
    <div class="task-row" style="margin-top:12px;">
      <h3>${task.title}</h3>
      <p>📅 Due: ${deadlineStr}</p>
      <p>⏱ Estimated: ${task.estimatedHours}h &nbsp;·&nbsp; 🎯 Category: ${task.category} &nbsp;·&nbsp; 💪 Difficulty: ${task.difficulty} &nbsp;·&nbsp; 📊 Priority Score: ${priorityScore}</p>
    </div>

    ${aiContent ? `
    <h2>🤖 AI Analysis</h2>
    <div class="highlight">
      <p style="margin:0; white-space:pre-line;">${aiContent.analysis || ''}</p>
    </div>
    ${aiContent.recommendation ? `
    <h2>💡 Recommendation</h2>
    <p>${aiContent.recommendation}</p>
    ` : ''}
    ` : ''}

    <div style="text-align: center; margin-top: 24px;">
      <a href="${dashboardUrl}" class="btn" style="color: #ffffff;">Open DeadlineOS</a>
    </div>

    <p style="margin-top:20px; font-size:12px; color:#94A3B8;">
      Mark this task complete in your DeadlineOS dashboard when done.
    </p>
  `;

  const subjectMap = {
    '24h': `📅 "${task.title}" is due tomorrow`,
    '6h':  `⏰ "${task.title}" is due in 6 hours`,
    '1h':  `⚡ "${task.title}" is due in 1 hour`,
    '30m': `⏰ "${task.title}" is due in 30 minutes`,
    'custom': `🔔 Reminder: "${task.title}" is due soon`,
  };

  return sendEmail({
    to:      user.email,
    subject: subjectMap[timeLabel] || `Reminder: "${task.title}"`,
    html:    emailLayout('Deadline Reminder', body),
  });
}

/* ═══════════════════════════════════════════════════════
   3. DAILY SUMMARY (8 AM)
═══════════════════════════════════════════════════════ */
async function sendDailySummaryEmail(user, tasks, aiContent) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const activeTasks   = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t =>  t.completed);
  const todayTasks    = activeTasks.filter(t => {
    const d = new Date(t.deadline);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const taskRows = todayTasks.slice(0, 5).map(t => `
    <div class="task-row">
      <h3>${t.title}</h3>
      <p>⏱ ${t.estimatedHours}h &nbsp;·&nbsp; ${t.difficulty} &nbsp;·&nbsp; ${t.category}</p>
    </div>
  `).join('');

  const body = `
    <p>Good morning, <strong>${user.name}</strong> ☀️</p>
    <p>Here's your AI-powered plan for <strong>${today}</strong>.</p>

    <div class="stat-grid">
      <div class="stat-box"><div class="val">${activeTasks.length}</div><div class="lbl">Active Tasks</div></div>
      <div class="stat-box"><div class="val">${todayTasks.length}</div><div class="lbl">Due Today</div></div>
      <div class="stat-box"><div class="val">${completedTasks.length}</div><div class="lbl">Completed</div></div>
    </div>

    ${todayTasks.length > 0 ? `<h2>📋 Today's Tasks</h2>${taskRows}` : '<p>✅ No tasks due today — enjoy your day!</p>'}

    ${aiContent ? `
    <h2>🤖 AI Recommendation</h2>
    <div class="highlight">
      <p style="margin:0; white-space:pre-line;">${aiContent.recommendation || aiContent}</p>
    </div>
    ` : ''}

    <div style="text-align: center; margin-top: 24px;">
      <a href="${dashboardUrl}" class="btn" style="color: #ffffff;">Open DeadlineOS</a>
    </div>

    <p style="margin-top:20px;">Have a productive day! 🚀</p>
  `;

  return sendEmail({
    to:      user.email,
    subject: `☀️ Good morning, ${user.name} — your plan for today`,
    html:    emailLayout('Your Daily Summary', body),
  });
}

/* ═══════════════════════════════════════════════════════
   4. WEEKLY REPORT (Sunday evening)
═══════════════════════════════════════════════════════ */
async function sendWeeklyReportEmail(user, stats, aiContent) {
  const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const body = `
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>Here's your weekly productivity summary for the past 7 days.</p>

    <div class="stat-grid">
      <div class="stat-box"><div class="val">${stats.completed}</div><div class="lbl">Tasks Completed</div></div>
      <div class="stat-box"><div class="val">${pct}%</div><div class="lbl">Completion Rate</div></div>
      <div class="stat-box"><div class="val">${stats.missed || 0}</div><div class="lbl">Missed Deadlines</div></div>
    </div>

    ${stats.topCategory ? `<p>🏆 Most productive category: <strong>${stats.topCategory}</strong></p>` : ''}

    ${aiContent ? `
    <h2>🤖 AI Suggestions for Next Week</h2>
    <div class="highlight">
      <p style="margin:0; white-space:pre-line;">${aiContent}</p>
    </div>
    ` : ''}

    <div style="text-align: center; margin-top: 24px;">
      <a href="${dashboardUrl}" class="btn" style="color: #ffffff;">Open DeadlineOS</a>
    </div>

    <p style="margin-top:20px;">Keep up the great work! 💪</p>
  `;

  return sendEmail({
    to:      user.email,
    subject: `📊 Your weekly productivity report`,
    html:    emailLayout('Weekly Report', body),
  });
}

/* ═══════════════════════════════════════════════════════
   5. TASK COMPLETION EMAIL
   ═══════════════════════════════════════════════════════ */
async function sendCompletionEmail(user, task) {
  const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const completionTimeStr = new Date().toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

  const body = `
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>🎉 Congratulations on successfully completing your task: <strong>${task.title}</strong>!</p>
    <p>⏰ Completion Time: ${completionTimeStr}</p>
    <p>You estimated this task would take ${task.estimatedHours} hours. Great job staying focused and making progress. Keep momentum high and continue progressing towards your goals!</p>
    
    <div style="text-align: center; margin-top: 24px;">
      <a href="${dashboardUrl}" class="btn" style="color: #ffffff;">Open DeadlineOS</a>
    </div>
  `;

  try {
    const info = await sendEmail({
      to:      user.email,
      subject: `🎉 Task Completed - DeadlineOS`,
      html:    emailLayout('Task Completed', body),
    });
    console.log('[EMAIL] Task completion email sent');
    return info;
  } catch (err) {
    console.error('[EMAIL] Failed to send completion email:', err.message);
  }
}

async function sendTaskCreatedEmail(user, task) {
  const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const deadlineStr = new Date(task.deadline).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

  const body = `
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>Your task has been added successfully to your dashboard!</p>
    
    <div class="task-row" style="margin-top:12px;">
      <h3>${task.title}</h3>
      <p>📅 Due: ${deadlineStr}</p>
      <p>⏱ Estimated: ${task.estimatedHours}h &nbsp;·&nbsp; 🎯 Category: ${task.category} &nbsp;·&nbsp; 💪 Difficulty: ${task.difficulty}</p>
    </div>

    <div class="highlight" style="margin-top: 16px;">
      <p style="margin:0;">We'll help you stay on track and remind you before your deadline.</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${dashboardUrl}" class="btn" style="color: #ffffff;">Open DeadlineOS</a>
    </div>
  `;

  try {
    const info = await sendEmail({
      to:      user.email,
      subject: `✅ Task Added Successfully - DeadlineOS`,
      html:    emailLayout('Task Added Successfully', body),
    });
    console.log('[EMAIL] Task creation email sent');
    return info;
  } catch (err) {
    console.error('[EMAIL] Failed to send creation email:', err.message);
  }
}

/* ═══════════════════════════════════════════════════════
   6. AI PRODUCTIVITY INSIGHT EMAIL
   ═══════════════════════════════════════════════════════ */
async function sendAIProductivityEmail(user, stats, aiContent) {
  const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const body = `
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>⚠️ Our system has detected a potential workload overload on your schedule.</p>
    
    <div class="stat-grid">
      <div class="stat-box"><div class="val">${stats.totalHours.toFixed(1)}h</div><div class="lbl">Planned Hours</div></div>
      <div class="stat-box"><div class="val">${stats.dueWithin48h}</div><div class="lbl">Due inside 48h</div></div>
      <div class="stat-box"><div class="val">${stats.burnoutRisk}%</div><div class="lbl">Burnout Risk</div></div>
    </div>

    <h2>🤖 AI Insights & Recommendation</h2>
    <div class="highlight">
      <p style="margin:0; white-space:pre-line;">${aiContent}</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${dashboardUrl}" class="btn" style="color: #ffffff;">Open DeadlineOS</a>
    </div>
  `;

  return sendEmail({
    to:      user.email,
    subject: `⚠️ Workload Overload Warning - AI Suggestions`,
    html:    emailLayout('AI Productivity Insight', body),
  });
}

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendDeadlineReminder,
  sendDailySummaryEmail,
  sendWeeklyReportEmail,
  sendCompletionEmail,
  sendTaskCreatedEmail,
  sendAIProductivityEmail,
};
