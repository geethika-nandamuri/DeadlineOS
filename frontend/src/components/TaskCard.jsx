import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Trash2, Clock, Calendar, ChevronRight } from 'lucide-react';

function getDeadlineInfo(deadline) {
  const now = new Date();
  const d = new Date(deadline);
  const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return { label: 'Overdue',      cls: 'badge-red',    urgent: true  };
  if (diff === 0) return { label: 'Due today',    cls: 'badge-yellow', urgent: true  };
  if (diff === 1) return { label: 'Due tomorrow', cls: 'badge-yellow', urgent: false };
  return           { label: `${diff} days left`,  cls: 'badge-slate',  urgent: false };
}

function getDifficultyBadge(diff) {
  if (diff === 'Hard')   return 'badge-red';
  if (diff === 'Medium') return 'badge-yellow';
  return 'badge-green';
}

function getPriorityColor(priority) {
  if (priority >= 75) return 'bg-red-400';
  if (priority >= 50) return 'bg-yellow-400';
  return 'bg-green-400';
}

export default function TaskCard({ task, onComplete, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const dl = getDeadlineInfo(task.deadline);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: deleting ? 0 : 1, y: deleting ? -10 : 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className={`card p-4 ${task.completed ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={onComplete}
          className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
          aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {task.completed
            ? <CheckCircle2 className="w-5 h-5 text-green-500" />
            : <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-primary transition-colors" />
          }
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className={`font-medium text-sm text-slate-800 dark:text-slate-100 leading-snug ${task.completed ? 'line-through text-slate-400' : ''}`}>
              {task.title}
            </h3>
            {/* Priority pip */}
            {!task.completed && task.priority && (
              <div className="flex-shrink-0 flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} title={`Priority ${task.priority}`} />
              </div>
            )}
          </div>

          {task.description && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-2.5 leading-relaxed line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <span className={`badge ${dl.cls}`}>{dl.label}</span>
            <span className={`badge ${getDifficultyBadge(task.difficulty)}`}>{task.difficulty}</span>
            <span className="badge badge-purple">{task.category}</span>
          </div>

          {/* Footer meta + actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {task.estimatedHours}h estimated
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              aria-label="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
