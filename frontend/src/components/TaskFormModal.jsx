import React from 'react';
import { useForm } from 'react-hook-form';
import { useMission } from '../context/MissionContext';
import { X, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = ['Work', 'Study', 'Personal', 'Health', 'Finance', 'Project', 'Other'];

export default function TaskFormModal({ onClose }) {
  const { addTask } = useMission();
  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: '', description: '', deadline: '',
      estimatedHours: '', category: 'Study', difficulty: 'Medium',
    },
  });

  const onSubmit = async (data) => {
    await addTask(data);
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Modal card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-modal border border-slate-100 dark:border-slate-800 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-base">Add new task</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Fill in the details and the AI will prioritize it automatically.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Task title *</label>
            <input
              type="text"
              placeholder="e.g. Finish React project"
              className="form-input"
              {...register('title', { required: 'Please add a title.' })}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Notes <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea
              rows={2}
              placeholder="What do you need to do?"
              className="form-input resize-none"
              {...register('description')}
            />
          </div>

          {/* Deadline + Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Deadline *</label>
              <input
                type="datetime-local"
                className="form-input"
                {...register('deadline', { required: 'Please set a deadline.' })}
              />
              {errors.deadline && <p className="text-xs text-red-500 mt-1">{errors.deadline.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Estimated hours *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                placeholder="2.5"
                className="form-input"
                {...register('estimatedHours', {
                  required: 'Please estimate hours.',
                  min: { value: 0.5, message: 'At least 0.5h' },
                })}
              />
              {errors.estimatedHours && <p className="text-xs text-red-500 mt-1">{errors.estimatedHours.message}</p>}
            </div>
          </div>

          {/* Category + Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Category *</label>
              <select className="form-input" {...register('category', { required: true })}>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Difficulty *</label>
              <select className="form-input" {...register('difficulty')}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
              {isSubmitting ? 'Saving…' : (
                <><Plus className="w-4 h-4" /> Add Task</>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
