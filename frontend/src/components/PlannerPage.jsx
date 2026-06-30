import React from 'react';
import { useMission } from '../context/MissionContext';
import DailySchedule from './DailySchedule';
import CommandCenter from './CommandCenter';
import TomorrowCard from './TomorrowCard';
import { RefreshCw } from 'lucide-react';

export default function PlannerPage() {
  const { analysis, loadingAI, tasks, triggerAIAnalysis } = useMission();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">AI Planner</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            Your AI-generated schedule, tailored to your tasks and deadlines.
          </p>
        </div>
        <button
          onClick={triggerAIAnalysis}
          disabled={loadingAI}
          className="btn-secondary text-sm py-2 px-4"
        >
          <RefreshCw className={`w-4 h-4 ${loadingAI ? 'animate-spin' : ''}`} />
          {loadingAI ? 'Planning…' : 'Refresh AI Planner'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's schedule */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-4">Today's Schedule</h2>
          <DailySchedule schedule={analysis?.scheduleReport} loading={loadingAI} />
        </div>

        {/* Tomorrow prediction + Chat */}
        <div className="flex flex-col gap-5">
          <TomorrowCard analysis={analysis} tasks={tasks} />
          <CommandCenter />
        </div>
      </div>
    </div>
  );
}
