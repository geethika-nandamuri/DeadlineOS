const { GoogleGenerativeAI } = require('@google/generative-ai');

// Helper to sanitize Gemini's output
function parseJsonFromText(text) {
  try {
    let cleaned = text.trim();
    // Remove markdown code blocks if present
    cleaned = cleaned.replace(/^```json\s*/i, '');
    cleaned = cleaned.replace(/^```\s*/, '');
    cleaned = cleaned.replace(/```\s*$/, '');
    cleaned = cleaned.trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse JSON from AI response. Text was:', text);
    throw err;
  }
}

// Intelligent dynamic generator for Local Fallback Mode
function generateLocalCalculatedReport(tasks) {
  if (tasks.length === 0) {
    return {
      priorityReport: [],
      scheduleReport: [],
      riskReport: {
        successProbability: 100,
        deadlineRisk: 0,
        burnoutRisk: 0,
        focusFactor: 100,
        lateSubmissionRisk: 0,
        conflicts: []
      },
      coachReport: {
        nextBestAction: 'Create your first task and DeadlineOS AI will begin generating personalized schedules and insights.',
        motivationMessage: '',
        insights: []
      }
    };
  }

  // 1. Local Priority Agent
  const priorityReport = tasks.map(task => {
    // Basic calculation for priority
    const now = new Date();
    const timeToDeadline = new Date(task.deadline) - now;
    const daysToDeadline = Math.max(0.1, timeToDeadline / (1000 * 60 * 60 * 24));
    
    let baseScore = 50;
    // Closer deadline increases priority
    if (daysToDeadline <= 1) baseScore += 40;
    else if (daysToDeadline <= 3) baseScore += 20;
    else if (daysToDeadline <= 7) baseScore += 10;
    
    // Difficulty adjustments
    if (task.difficulty === 'Hard') baseScore += 15;
    else if (task.difficulty === 'Medium') baseScore += 5;
    
    // Hours adjustment
    if (task.estimatedHours > 8) baseScore += 10;
    
    const priorityScore = Math.min(100, Math.max(10, Math.round(baseScore)));
    
    // Reasoning
    let reasoning = `Deadline is in ${daysToDeadline.toFixed(1)} days. `;
    if (task.difficulty === 'Hard') {
      reasoning += 'Hard task requires substantial cognitive power.';
    } else {
      reasoning += `Difficulty is ${task.difficulty}. Requires about ${task.estimatedHours} hours.`;
    }
    
    return {
      taskId: task._id ? task._id.toString() : 'task-id',
      title: task.title,
      priorityScore,
      reasoning
    };
  });

  // Sort tasks by priority score descending
  const sortedPriority = [...priorityReport].sort((a, b) => b.priorityScore - a.priorityScore);

  // 2. Local Schedule Agent
  const scheduleReport = [];
  let currentTime = 7.0; // 07:00 AM
  
  function formatTime(t) {
    const hours = Math.floor(t);
    const minutes = Math.round((t - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  sortedPriority.forEach((pt, index) => {
    // Add a kickoff block if first
    if (index === 0) {
      scheduleReport.push({
        time: formatTime(currentTime),
        duration: '0.5h',
        type: 'Daily Kickoff',
        taskTitle: 'Sync & Prep',
        notes: 'Review your task dashboard.'
      });
      currentTime += 0.5;
    }

    // Add task focus block
    const taskObj = tasks.find(t => t.title === pt.title) || tasks[0];
    const duration = Math.min(2.0, taskObj.estimatedHours);
    
    scheduleReport.push({
      time: formatTime(currentTime),
      duration: `${duration}h`,
      type: 'Deep Work',
      taskTitle: taskObj.title,
      notes: `Focusing on ${taskObj.category} tasks (${taskObj.difficulty} block).`
    });
    currentTime += duration;

    // Add a break after deep work
    scheduleReport.push({
      time: formatTime(currentTime),
      duration: '0.5h',
      type: 'Recharge Block',
      taskTitle: 'Break',
      notes: 'Hydrate and complete physical stretch routine.'
    });
    currentTime += 0.5;
  });

  // Add lunch break
  if (currentTime > 12.0) {
    scheduleReport.push({
      time: '12:30',
      duration: '1.0h',
      type: 'Midday Recharge',
      taskTitle: 'Lunch',
      notes: 'Unplug and recover cognitive energy.'
    });
  }

  // 3. Local Risk Agent
  const totalHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0);
  const hardTasksCount = tasks.filter(t => t.difficulty === 'Hard').length;
  
  // Calculate success probability (drops with more hours and hard tasks)
  let successProbability = Math.round(95 - (totalHours * 1.5) - (hardTasksCount * 8));
  successProbability = Math.max(35, Math.min(95, successProbability));
  
  const burnoutRisk = Math.max(15, Math.min(95, Math.round((totalHours * 3.5) + (hardTasksCount * 12))));
  
  // Deadline risk depends on proximity
  const dueWithin3Days = tasks.filter(t => {
    const timeToDeadline = new Date(t.deadline) - new Date();
    return timeToDeadline > 0 && timeToDeadline < (3 * 24 * 60 * 60 * 1000);
  }).length;
  
  const deadlineRisk = Math.max(10, Math.min(95, Math.round((dueWithin3Days * 25) + (totalHours * 1.5))));
  const lateSubmissionRisk = Math.max(5, Math.min(90, Math.round(deadlineRisk * 0.8)));
  const focusFactor = Math.max(60, Math.min(98, Math.round(90 - (burnoutRisk * 0.2))));

  const conflicts = [];
  if (dueWithin3Days > 1) {
    conflicts.push(`Multiple tasks (${dueWithin3Days}) are due within 72 hours.`);
  }
  if (totalHours > 12) {
    conflicts.push(`Workload threshold exceeded (${totalHours.toFixed(1)} hrs). Daily schedule is quite full.`);
  }
  if (hardTasksCount > 2) {
    conflicts.push(`High density of complex tasks. High cognitive strain detected.`);
  }
  if (conflicts.length === 0) {
    conflicts.push('No immediate deadline collisions or critical overlaps detected.');
  }

  // 4. Local Coach Agent
  const highestTask = sortedPriority[0];
  const nextBestAction = highestTask 
    ? `Start working on "${highestTask.title}" next as it carries the highest priority index (${highestTask.priorityScore}).`
    : 'All tasks completed. Add new tasks to keep going.';

  const completedCount = tasks.filter(t => t.completed).length;
  const activeCount = tasks.filter(t => !t.completed).length;
  
  let motivationMessage = '';
  if (completedCount > 0 && activeCount === 0) {
    motivationMessage = "You're all caught up! Great work on completing your active tasks.";
  } else if (burnoutRisk > 70) {
    motivationMessage = 'Warning: High workload detected. Prioritize breaks and tackle tasks in short, concentrated Pomodoro intervals.';
  } else {
    motivationMessage = `You have completed ${completedCount} tasks. Tackling your top priority task "${highestTask ? highestTask.title : ''}" first will reduce your deadline risk by ${Math.round(deadlineRisk * 0.3)}%.`;
  }

  const categoryCounts = {};
  tasks.forEach(t => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });
  let maxCategory = 'General';
  let maxCount = 0;
  Object.keys(categoryCounts).forEach(cat => {
    if (categoryCounts[cat] > maxCount) {
      maxCount = categoryCounts[cat];
      maxCategory = cat;
    }
  });

  const insights = [
    `Heaviest category loading is "${maxCategory}" comprising ${maxCount} task(s).`,
    `Burnout risk level is currently ${burnoutRisk > 60 ? 'HIGH' : 'LOW'}. Optimal daily focus set to ${focusFactor}%.`,
    `AI recommends addressing Hard tasks before 1:00 PM for maximum focus.`
  ];

  return {
    isDemoMode: true,
    priorityReport,
    scheduleReport,
    riskReport: {
      successProbability,
      deadlineRisk,
      burnoutRisk,
      focusFactor,
      lateSubmissionRisk,
      conflicts
    },
    coachReport: {
      nextBestAction,
      motivationMessage,
      insights
    }
  };
}

// Sequential AI Orchestrator API
async function runSequentialAIOrchestrator(tasks) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    console.log('Gemini API key is not configured. Falling back to local scheduler.');
    return generateLocalCalculatedReport(tasks);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    // Format tasks for the prompt
    const tasksDataString = JSON.stringify(tasks.map(t => ({
      id: t._id ? t._id.toString() : 'demo',
      title: t.title,
      description: t.description,
      deadline: t.deadline,
      estimatedHours: t.estimatedHours,
      category: t.category,
      difficulty: t.difficulty
    })));

    // ==========================================
    // AGENT 1: Priority Agent
    // ==========================================
    const priorityPrompt = `
      You are the Priority Agent of the DeadlineOS planning system.
      Analyze the following task list and determine a Priority Score (from 1 to 100) for each task.
      Consider task deadlines (closer means higher priority), difficulty, and estimated hours.
      Return a JSON array of objects, where each object has:
      - taskId (string)
      - title (string)
      - priorityScore (number from 1 to 100)
      - reasoning (string, short bullet point describing why)
      
      Tasks data:
      ${tasksDataString}
      
      You must respond with raw JSON ONLY. No markdown block wrapper, no explanation. Just a valid JSON array.
    `;

    const priorityResult = await model.generateContent(priorityPrompt);
    const priorityText = priorityResult.response.text();
    const priorityReport = parseJsonFromText(priorityText);

    // Attach priorities back to tasks for the subsequent steps
    const prioritizedTasks = tasks.map(t => {
      const match = priorityReport.find(p => p.title === t.title || p.taskId === (t._id ? t._id.toString() : ''));
      return {
        id: t._id ? t._id.toString() : 'demo',
        title: t.title,
        description: t.description,
        deadline: t.deadline,
        estimatedHours: t.estimatedHours,
        category: t.category,
        difficulty: t.difficulty,
        priorityScore: match ? match.priorityScore : 50,
        priorityReasoning: match ? match.reasoning : 'Fallback assignment'
      };
    });

    // ==========================================
    // AGENT 2: Schedule Agent
    // ==========================================
    const schedulePrompt = `
      You are the Schedule Agent of the DeadlineOS daily schedule builder.
      You schedule daily focus blocks and breaks for the user.
      Take the prioritized tasks list and construct an optimized daily hourly timeline starting from 07:00 AM.
      Group task workloads logically, placing high priority tasks in high energy early hours, interspersed with short breaks.
      
      Return a JSON array of scheduled blocks. Each block has:
      - time (string, e.g. "07:00", "08:30", "12:00")
      - duration (string, e.g. "1.5h", "0.5h")
      - type (string, select from: "Daily Kickoff", "Deep Work", "Recharge Block", "Midday Recharge", "Task Focus")
      - taskTitle (string, the title of the task scheduled, or "Lunch", "Break" etc.)
      - notes (string, a short guideline of what to accomplish or focus on)
      
      Prioritized Tasks data:
      ${JSON.stringify(prioritizedTasks)}
      
      You must respond with raw JSON ONLY. No markdown block wrapper, no explanation. Just a valid JSON array.
    `;

    const scheduleResult = await model.generateContent(schedulePrompt);
    const scheduleText = scheduleResult.response.text();
    const scheduleReport = parseJsonFromText(scheduleText);

    // ==========================================
    // AGENT 3: Risk Agent
    // ==========================================
    const riskPrompt = `
      You are the Risk Agent of the DeadlineOS scheduling system.
      You analyze task workloads and the daily schedule to evaluate performance risks.
      Calculate:
      - successProbability (number, 0-100%, indicating chance of meeting all deadlines)
      - deadlineRisk (number, 0-100%, indicating threat level of missed deadlines)
      - burnoutRisk (number, 0-100%, based on hours, hard tasks, and tight breaks)
      - focusFactor (number, 0-100%, based on general mental focus index)
      - lateSubmissionRisk (number, 0-100%, risk of sending assignments past due)
      - conflicts (JSON array of strings, detailing actual collisions or constraints found)
      
      Tasks and schedule data:
      Tasks: ${JSON.stringify(prioritizedTasks)}
      Schedule: ${JSON.stringify(scheduleReport)}
      
      Return a single JSON object with these keys. Respond with raw JSON ONLY. No markdown block wrapper, no explanation.
    `;

    const riskResult = await model.generateContent(riskPrompt);
    const riskText = riskResult.response.text();
    const riskReport = parseJsonFromText(riskText);

    // ==========================================
    // AGENT 4: Coach Agent
    // ==========================================
    const coachPrompt = `
      You are the Coach Agent of the DeadlineOS planning system.
      Your voice is helpful, encouraging, motivating, conversational, and warm.
      Based on the prioritized tasks, schedule, and risks, formulate:
      - nextBestAction (string, one clear, actionable instruction for what the user should execute first)
      - motivationMessage (string, a custom, detailed paragraph analyzing current status and offering actionable motivation. DO NOT use generic quotes. Reference specific tasks, numbers, and workloads)
      - insights (array of strings, e.g. "Peak work windows are before 11am.", "Focus on Category X is lagging.")
      
      Prioritized Tasks: ${JSON.stringify(prioritizedTasks)}
      Schedule: ${JSON.stringify(scheduleReport)}
      Risk Metrics: ${JSON.stringify(riskReport)}
      
      Return a single JSON object with these keys. Respond with raw JSON ONLY. No markdown block wrapper, no explanation.
    `;

    const coachResult = await model.generateContent(coachPrompt);
    const coachText = coachResult.response.text();
    const coachReport = parseJsonFromText(coachText);

    return {
      isDemoMode: false,
      priorityReport,
      scheduleReport,
      riskReport,
      coachReport
    };
  } catch (error) {
    console.error('Gemini API query failed or was rate-limited. Falling back to local scheduler. Error:', error.message);
    return generateLocalCalculatedReport(tasks);
  }
}

// Command Center Chat Agent
async function runJarvisChat(tasks, schedule, risks, history, message) {
  const apiKey = process.env.GEMINI_API_KEY;
  const localSystemResponse = (msg) => {
    const lower = msg.toLowerCase();
    let reply = "";
    if (lower.includes('what should i do next') || lower.includes('what next')) {
      const topTask = tasks.filter(t => !t.completed).sort((a,b) => b.priority - a.priority)[0];
      reply = topTask 
        ? `I recommend focusing on "${topTask.title}" next. It is currently your highest priority task with an estimated completion time of ${topTask.estimatedHours} hours. Pace yourself and you will do great!`
        : "All active objectives are completed! Excellent work. Feel free to log a new task or take some time to recharge.";
    } else if (lower.includes('finish today') || lower.includes('finish before tomorrow')) {
      const totalHours = tasks.filter(t => !t.completed).reduce((sum, t) => sum + t.estimatedHours, 0);
      if (totalHours === 0) {
        reply = "You're all caught up! No active tasks remaining for today.";
      } else if (totalHours < 6) {
        reply = `Yes, you can comfortably finish your tasks today! You have about ${totalHours.toFixed(1)} hours of active work remaining. You've got this!`;
      } else {
        reply = `It might be a bit tight. You have ${totalHours.toFixed(1)} hours of planned work remaining. I suggest prioritizing the most critical tasks first and moving the rest to tomorrow to avoid burnout.`;
      }
    } else {
      reply = `I'm on it! You currently have ${tasks.filter(t => !t.completed).length} active tasks on your plate. Let me know if you would like some help scheduling them or planning your breaks.`;
    }
    return {
      response: reply
    };
  };

  if (!apiKey || apiKey.trim() === '') {
    return localSystemResponse(message);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    // Format tasks cleanly for context
    const cleanTasks = tasks.map(t => ({
      title: t.title,
      deadline: t.deadline,
      hours: t.estimatedHours,
      difficulty: t.difficulty,
      completed: t.completed
    }));

    // Reformat history into text block to avoid syntax leaks
    const historyBlock = (history || []).map(h => `${h.role === 'user' ? 'User' : 'Coach'}: ${h.text}`).join('\n');

    const chatPrompt = `
You are a warm, supportive, and friendly AI productivity coach helper for a task app. 
Your goal is to help the user manage their tasks, reduce stress, avoid burnout, and stay motivated. 
Speak in a conversational, positive, and practical tone. Avoid military, cyber, or overly technical jargon.

Current Workspace State:
- Tasks logged: ${JSON.stringify(cleanTasks)}
- Daily schedule plan: ${JSON.stringify(schedule)}
- Current workload statistics: ${JSON.stringify(risks)}

Conversational History:
${historyBlock}

User message: "${message}"

Write a helpful, short response (1-3 sentences) responding directly as the productivity coach. Refer to their actual tasks or focus hours when relevant. Do not include any JSON brackets, system parameters, developer prompts, or instruction blocks in your response. Just write clean, supportive prose.
    `.trim();

    const result = await model.generateContent(chatPrompt);
    return {
      response: result.response.text().trim()
    };
  } catch (error) {
    console.error('Gemini API chat failed. Falling back to local assistant.', error.message);
    return localSystemResponse(message);
  }
}

module.exports = {
  runSequentialAIOrchestrator,
  runJarvisChat,
  generateLocalCalculatedReport,
  // Used by scheduler for generating email AI content
  callGemini: async (prompt) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') return null;
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      console.error('[callGemini] Failed:', err.message);
      return null;
    }
  },
};
