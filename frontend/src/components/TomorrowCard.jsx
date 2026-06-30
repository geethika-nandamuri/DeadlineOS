import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function TomorrowCard({ tasks }) {
  const active = tasks.filter(t => !t.completed);
  const totalHours = active.reduce((s, t) => s + t.estimatedHours, 0);
  const highPriority = [...active].sort((a, b) => (b.priority || 50) - (a.priority || 50)).slice(0, 2);

  let statusIcon = '✨';
  let statusMsg = "Tomorrow's outlook looks light and highly manageable.";
  let statusAction = "Suggested action: You're in great shape! Use the extra breathing room to read, learn, or relax.";
  let statusColor = 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300';

  if (totalHours > 10) {
    statusIcon = '⏰';
    statusMsg = `Tomorrow has a full schedule of ${totalHours.toFixed(1)} focus hours.`;
    statusAction = "Suggested action: Focus on your top 2 priorities and consider shifting less critical tasks to later in the week.";
    statusColor = 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/60 text-amber-800 dark:text-amber-300';
  } else if (totalHours > 6) {
    statusIcon = '💡';
    statusMsg = `Tomorrow has a productive flow of ${totalHours.toFixed(1)} focus hours.`;
    statusAction = "Suggested action: Allocate specific focus blocks in the morning to tackle your primary tasks.";
    statusColor = 'bg-sky-50/70 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/60 text-sky-800 dark:text-sky-300';
  }

  return (
    <div className="card p-5">
      <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-4">Tomorrow's Outlook</h2>

      {/* Status banner */}
      <div className={`flex items-start gap-3 p-4 rounded-2xl border mb-4 ${statusColor}`}>
        <span className="text-lg flex-shrink-0 mt-0.5" role="img" aria-label="tomorrow-status-icon">
          {statusIcon}
        </span>
        <div className="flex-1">
          <p className="text-xs font-semibold leading-relaxed">{statusMsg}</p>
          <p className="text-[11px] opacity-75 font-medium mt-2 leading-relaxed">
            {statusAction}
          </p>
        </div>
      </div>

      {/* Priority tasks */}
      {highPriority.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Focus on first:</p>
          <div className="flex flex-col gap-2">
            {highPriority.map(t => (
              <div key={t._id} className="flex items-center gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <ArrowUpRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{t.title}</p>
                  <p className="text-[10px] text-slate-400">{t.estimatedHours}h · {t.difficulty}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {active.length === 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
          No pending tasks! Enjoy your free time. 🎉
        </p>
      )}
    </div>
  );
}
