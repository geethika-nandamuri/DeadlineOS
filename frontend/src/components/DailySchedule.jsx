import React from 'react';
import { Coffee, Zap, Play, Utensils, BookOpen, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const TYPE_CONFIG = {
  'Daily Kickoff':    { icon: Play,      color: 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400', dot: 'bg-indigo-400',  label: 'Start' },
  'Deep Work':        { icon: Zap,       color: 'bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400', dot: 'bg-purple-400',  label: 'Focus' },
  'Task Focus':       { icon: Zap,       color: 'bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400', dot: 'bg-purple-400',  label: 'Focus' },
  'Recharge Block':   { icon: Coffee,    color: 'bg-cyan-100   dark:bg-cyan-950/50   text-cyan-600   dark:text-cyan-400',   dot: 'bg-cyan-400',    label: 'Break' },
  'Midday Recharge':  { icon: Utensils,  color: 'bg-green-100  dark:bg-green-950/50  text-green-600  dark:text-green-400',  dot: 'bg-green-400',   label: 'Lunch' },
  'default':          { icon: BookOpen,  color: 'bg-slate-100  dark:bg-slate-800     text-slate-500  dark:text-slate-400',  dot: 'bg-slate-400',   label: 'Task'  },
};

function getConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG['default'];
}

export default function DailySchedule({ schedule, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="flex gap-3 items-start">
            <div className="skeleton w-14 h-4 rounded" />
            <div className="flex-1 skeleton h-14 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (!schedule || schedule.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-xs">
        Your schedule is empty.
      </div>
    );
  }

  const items = schedule;

  return (
    <div className="relative w-full max-w-full">
      {/* Vertical line */}
      <div className="absolute left-[4.375rem] sm:left-[6.375rem] top-4 bottom-4 w-px bg-slate-100 dark:bg-slate-800" />

      <div className="flex flex-col gap-1 w-full max-w-full">
        {items.map((item, i) => {
          const cfg = getConfig(item.type);
          const Icon = cfg.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className="flex items-start gap-2 sm:gap-4 py-2 group w-full max-w-full min-w-0"
            >
              {/* Time label */}
              <div className="w-14 sm:w-20 flex-shrink-0 text-right mt-1">
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 leading-none">
                  {item.time}
                </span>
              </div>

              {/* Dot */}
              <div className="flex-shrink-0 w-3 flex justify-center mt-2.5">
                <div className={`timeline-dot ${cfg.dot}`} style={{ marginTop: '0px' }} />
              </div>

              {/* Card */}
              <div className={`flex-1 min-w-0 flex items-start gap-2.5 rounded-xl px-3 py-2.5 ${cfg.color} transition-all group-hover:shadow-sm w-full max-w-full`}>
                <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold leading-tight break-words whitespace-pre-wrap">{item.taskTitle}</p>
                  {item.notes && (
                    <p className="text-[10px] opacity-70 mt-0.5 leading-relaxed break-words whitespace-pre-wrap">{item.notes}</p>
                  )}
                  {item.duration && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-medium opacity-60 mt-1">
                      <Clock className="w-2.5 h-2.5" /> {item.duration}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
