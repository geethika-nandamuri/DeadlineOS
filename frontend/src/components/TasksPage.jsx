import React, { useState } from 'react';
import { useMission } from '../context/MissionContext';
import TaskCard from './TaskCard';
import { Plus, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TasksPage({ setModalOpen }) {
  const { tasks, toggleComplete, deleteTask, loadingTasks } = useMission();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const displayed = tasks
    .filter(t => {
      if (filter === 'active')    return !t.completed;
      if (filter === 'completed') return  t.completed;
      return true;
    })
    .filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">All Tasks</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            {tasks.filter(t => !t.completed).length} active · {tasks.filter(t => t.completed).length} completed
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary text-sm py-2 px-4">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute text-slate-400 w-4 h-4" style={{ left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '44px' }}
          />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          {['all', 'active', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                filter === f
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      {loadingTasks ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      ) : displayed.length > 0 ? (
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="popLayout">
            {displayed.map(task => (
              <TaskCard
                key={task._id}
                task={task}
                onComplete={() => toggleComplete(task._id, !task.completed)}
                onDelete={() => deleteTask(task._id)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <p className="text-lg mb-1">No tasks found</p>
          <p className="text-sm">
            {search ? 'Try a different search term.' : 'Add a task to get started.'}
          </p>
        </div>
      )}
    </div>
  );
}
