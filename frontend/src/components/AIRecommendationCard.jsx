import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, ChevronDown, ChevronUp } from 'lucide-react';
import CommandCenter from './CommandCenter';

/* Convert risk parameters into friendly AI insights with suggested actions */
function humanizeRisk(riskReport, tasks) {
  if (!riskReport) return [];
  const msgs = [];

  const { burnoutRisk, deadlineRisk, successProbability } = riskReport;
  const totalHours = tasks.reduce((s, t) => s + t.estimatedHours, 0);

  // 1. Success / Achievement (Green/Blue depending on progress)
  if (successProbability >= 80) {
    msgs.push({
      type: 'success',
      icon: '✨',
      text: "You are on an excellent track to complete all active tasks on time. Great momentum!",
      action: "Suggested action: Keep up the steady pace and enjoy a well-deserved break after your next session."
    });
  } else if (successProbability >= 50) {
    msgs.push({
      type: 'info',
      icon: '💡',
      text: "Your schedule has a moderate workload today. It is very manageable with the right focus.",
      action: "Suggested action: Group similar tasks together and handle them in blocks to minimize context switching."
    });
  } else {
    msgs.push({
      type: 'warning',
      icon: '📅',
      text: "Today's task volume is high, which might make it tight to finish everything by evening.",
      action: "Suggested action: Select your top 2 essential tasks to focus on, and postpone the rest to tomorrow."
    });
  }

  // 2. High workload / Burnout (Yellow/Amber)
  if (burnoutRisk >= 75) {
    msgs.push({
      type: 'warning',
      icon: '⏰',
      text: `Your schedule has a dense workload of ${totalHours.toFixed(1)} focus hours today.`,
      action: "Suggested action: Set a timer for 45 minutes of deep focus followed by a 10-minute break to refresh your energy."
    });
  }

  // 3. Deadline pressure (Red only if critical/overdue, else Yellow)
  const now = new Date();
  const overdueTasksCount = tasks.filter(t => !t.completed && new Date(t.deadline) < now).length;
  
  if (overdueTasksCount > 0) {
    msgs.push({
      type: 'danger',
      icon: '⏰',
      text: `Alert: You have ${overdueTasksCount} overdue task(s) currently requiring attention.`,
      action: "Suggested action: Pause other work to resolve or update the deadlines of these items right away."
    });
  } else if (deadlineRisk >= 60) {
    msgs.push({
      type: 'warning',
      icon: '🎯',
      text: "Several active tasks have deadlines coming up over the next 48 hours.",
      action: "Suggested action: Block out a quiet distraction-free period today to advance these time-sensitive tasks."
    });
  }

  // Limit to maximum 3 insights
  return msgs.slice(0, 3);
}

export default function AIRecommendationCard({ analysis, tasks }) {
  const [showChat, setShowChat] = useState(false);
  const { coachReport, riskReport } = analysis;
  const insights = humanizeRisk(riskReport, tasks);

  const styleForType = (t) => {
    if (t === 'success') {
      return 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300';
    }
    if (t === 'danger') {
      return 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/60 text-rose-800 dark:text-rose-300';
    }
    if (t === 'info') {
      return 'bg-sky-50/70 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/60 text-sky-800 dark:text-sky-300';
    }
    return 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/60 text-amber-800 dark:text-amber-300';
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Today's Suggestions Header */}
      <div className="card p-4 border-l-4 border-l-indigo-500">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center flex-shrink-0">
            <BrainCircuit className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                Today's Suggestions
              </p>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {coachReport?.nextBestAction || 'Analyzing your tasks…'}
            </p>
            {coachReport?.motivationMessage && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                {coachReport.motivationMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* AI Insights list */}
      {insights.length > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">
            AI Insights
          </h4>
          <div className="flex flex-col gap-2.5">
            {insights.map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-start gap-3 p-4 rounded-2xl border ${styleForType(insight.type)}`}
              >
                <span className="text-lg flex-shrink-0 mt-0.5" role="img" aria-label="insight-icon">
                  {insight.icon}
                </span>
                <div className="flex-1">
                  <p className="text-xs font-semibold leading-relaxed">{insight.text}</p>
                  <p className="text-[11px] opacity-75 font-medium mt-2 leading-relaxed">
                    {insight.action}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Ask AI toggle */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary-dark transition-colors self-start pl-1"
      >
        {showChat ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {showChat ? 'Hide AI assistant' : 'Ask your AI assistant'}
      </button>

      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <CommandCenter />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
