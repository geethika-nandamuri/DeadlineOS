import React, { useEffect } from 'react';
import { useMission } from '../context/MissionContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Clock, AlertTriangle, TrendingUp, Plus,
  RefreshCw, BrainCircuit, ArrowRight, Calendar, Flame
} from 'lucide-react';
import TaskCard from './TaskCard';
import AIRecommendationCard from './AIRecommendationCard';
import DailySchedule from './DailySchedule';
import NotificationHistory from './NotificationHistory';

/* ─── helper ─── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function StatTile({ label, value, icon: Icon, color }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{value}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  );
}

function SectionHeader({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{title}</h2>
      {action && (
        <button onClick={onAction} className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1">
          {action} <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export default function Dashboard({ setModalOpen }) {
  const {
    tasks, analysis, dashboardData, loadingAnalytics, loadingTasks, loadingAI,
    triggerAIAnalysis, toggleComplete, deleteTask
  } = useMission();
  const { user } = useAuth();

  // Stats
  const active    = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed).length;
  const total     = tasks.length;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Upcoming = active sorted by deadline
  const upcoming = [...active]
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);

  // Top priority tasks for "Today's Focus"
  const todayFocus = [...active]
    .sort((a, b) => (b.priority || 50) - (a.priority || 50))
    .slice(0, 4);

  const isOverdue = (d) => new Date(d) < new Date();

  return (
    <div className="p-6 max-w-[1400px] mx-auto">

      {/* ── Greeting header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-slate-900 dark:text-white"
          >
            {getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
          </motion.h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {active.length === 0
              ? "You're all caught up! Add a task to get started."
              : `You have ${active.length} active task${active.length !== 1 ? 's' : ''} — let's make today count.`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={triggerAIAnalysis} disabled={loadingAI || active.length === 0} className="btn-secondary text-sm py-2 px-3.5">
            <BrainCircuit className={`w-4 h-4 ${loadingAI ? 'animate-pulse' : ''}`} />
            {loadingAI ? 'Analyzing…' : 'Refresh AI Insights'}
          </button>
          <button onClick={() => setModalOpen(true)} className="btn-primary text-sm py-2 px-3.5">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {total === 0 && !loadingTasks ? (
        <div className="card p-12 text-center max-w-lg mx-auto mt-8 shadow-sm flex flex-col items-center">
          <CheckCircle2 className="w-12 h-12 text-indigo-500 mb-4" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">No tasks yet</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            Create your first task and DeadlineOS AI will begin generating personalized schedules and insights.
          </p>
          <button onClick={() => setModalOpen(true)} className="btn-primary text-sm py-2.5 px-5">
            <Plus className="w-4 h-4" /> Create First Task
          </button>
        </div>
      ) : (
        <>
          {/* ── Stat tiles ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
            <StatTile label="Active tasks"    value={active.length}  icon={Clock}         color="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500" />
            <StatTile label="Completed today" value={completed}       icon={CheckCircle2}  color="bg-green-50  dark:bg-green-950/40  text-green-500"  />
            <StatTile label="Completion rate" value={`${pct}%`}       icon={TrendingUp}    color="bg-cyan-50   dark:bg-cyan-950/40   text-cyan-500"   />
            <StatTile label="Overdue"         value={active.filter(t => isOverdue(t.deadline)).length} icon={AlertTriangle} color="bg-red-50 dark:bg-red-950/40 text-red-500" />
          </div>

          {/* ── Progress bar ── */}
          {total > 0 && (
            <div className="card p-4 mb-7">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Overall progress</p>
                <p className="text-sm font-semibold text-primary">{completed} of {total} tasks done</p>
              </div>
              <div className="progress-bar-track">
                <motion.div
                  className="progress-bar-fill bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              {pct >= 80 && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Great work — you're almost done for today!
                </p>
              )}
            </div>
          )}

          {/* ── Main grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left column: Today's Focus + Upcoming Deadlines ── */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* AI Recommendation */}
              {analysis && (
                <AIRecommendationCard analysis={analysis} tasks={active} />
              )}

              {/* Today's Focus */}
              <div>
                <SectionHeader title="Today's Focus" action="See all tasks" onAction={() => {}} />
                {loadingTasks ? (
                  <div className="flex flex-col gap-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="card p-4 h-24 skeleton" />
                    ))}
                  </div>
                ) : todayFocus.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {todayFocus.map(task => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onComplete={() => toggleComplete(task._id, !task.completed)}
                        onDelete={() => deleteTask(task._id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="card p-10 text-center">
                    <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
                    <p className="font-medium text-slate-600 dark:text-slate-300 mb-1">You're all caught up!</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">
                      No active tasks right now. Add something new to get started.
                    </p>
                    <button onClick={() => setModalOpen(true)} className="btn-primary text-sm py-2 px-5 mx-auto">
                      <Plus className="w-4 h-4" /> Add your first task
                    </button>
                  </div>
                )}
              </div>

              {/* Upcoming Deadlines */}
              {upcoming.length > 0 && (
                <div>
                  <SectionHeader title="Upcoming Deadlines" />
                  <div className="card divide-y divide-slate-100 dark:divide-slate-800">
                    {upcoming.map(task => {
                      const diff = Math.ceil((new Date(task.deadline) - new Date()) / (1000*60*60*24));
                      const color = diff <= 0 ? 'text-red-500' : diff === 1 ? 'text-orange-500' : 'text-slate-400 dark:text-slate-500';
                      const label = diff <= 0 ? 'Overdue' : diff === 1 ? 'Due tomorrow' : `Due in ${diff} days`;
                      return (
                        <div key={task._id} className="flex items-center justify-between px-4 py-3.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{task.title}</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">{task.category} · {task.estimatedHours}h</p>
                            </div>
                          </div>
                          <span className={`text-xs font-semibold ${color} flex-shrink-0 ml-3`}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── Right column: Schedule + Notifications ── */}
            <div className="flex flex-col gap-6">
              <div>
                <SectionHeader title="Today's Schedule" />
                <div className="card p-4">
                  <DailySchedule schedule={dashboardData?.scheduleReport || analysis?.scheduleReport} loading={loadingAI || loadingAnalytics} />
                </div>
              </div>
              <div>
                <SectionHeader title="Email Notifications" />
                <div className="card p-4">
                  <NotificationHistory />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
