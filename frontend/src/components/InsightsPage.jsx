import React from 'react';
import { useMission } from '../context/MissionContext';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const PALETTE = ['#6366F1', '#06B6D4', '#22C55E', '#F59E0B', '#EF4444', '#A855F7', '#EC4899'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-card text-xs">
      {label && <p className="font-medium text-slate-600 dark:text-slate-300 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function InsightsPage() {
  const { tasks, dashboardData, loadingAnalytics } = useMission();

  // If there are no tasks, show the requested empty state
  if (tasks.length === 0) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Insights</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">A clear picture of your productivity and progress.</p>
        </div>
        <div className="card p-10 text-center py-20">
          <p className="text-lg font-semibold mb-1 text-slate-700 dark:text-slate-200">No insights available yet.</p>
          <p className="text-sm text-slate-400">Add some tasks and the AI will start building your insights.</p>
        </div>
      </div>
    );
  }

  // Handle loading state
  if (loadingAnalytics || !dashboardData) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Insights</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">A clear picture of your productivity and progress.</p>
        </div>
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="skeleton h-64 rounded-xl" />
            <div className="skeleton h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const {
    successProbability,
    deadlineRisk,
    burnoutRisk,
    focusFactor,
    weeklyData,
    categoryData,
    completionPie,
    completedCount,
    activeCount
  } = dashboardData;

  const riskItems = [
    {
      label: 'Chance of finishing on time',
      value: successProbability,
      color: '#22C55E',
      desc: successProbability >= 70 ? 'Looking good!' : 'Consider adjusting your schedule.'
    },
    {
      label: 'Deadline pressure',
      value: deadlineRisk,
      color: '#EF4444',
      desc: deadlineRisk >= 60 ? 'Some tasks are getting close.' : 'You have breathing room.'
    },
    {
      label: 'Schedule fullness',
      value: burnoutRisk,
      color: '#F59E0B',
      desc: burnoutRisk >= 70 ? 'Take breaks to stay sharp.' : 'Healthy workload.'
    },
    {
      label: 'Focus capacity',
      value: focusFactor,
      color: '#6366F1',
      desc: 'Your estimated focus quality today.'
    },
  ];

  const commonAxisProps = {
    tick: { fontSize: 11, fill: '#94A3B8' },
    axisLine: false,
    tickLine: false,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Insights</h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">A clear picture of your productivity and progress.</p>
      </div>

      {/* ── Wellbeing indicators ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {riskItems.map((r, i) => (
          <div key={i} className="card p-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">{r.label}</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{r.value}%</span>
            </div>
            <div className="progress-bar-track mb-2">
              <div className="progress-bar-fill" style={{ width: `${r.value}%`, backgroundColor: r.color }} />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Charts grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Weekly tasks completed */}
        <ChartCard title="Tasks completed this week" subtitle="How many tasks you finished each day">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#F1F5F9" vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="day" {...commonAxisProps} />
              <YAxis {...commonAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="completed" name="Tasks" fill="#6366F1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Focus hours trend */}
        <ChartCard title="Focus hours" subtitle="Allocated focus hours per day">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#06B6D4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#F1F5F9" vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="day" {...commonAxisProps} />
              <YAxis {...commonAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="hours" name="Hours" stroke="#06B6D4" strokeWidth={2} fill="url(#hourGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Category breakdown */}
        {categoryData.length > 0 ? (
          <ChartCard title="Hours by category" subtitle="Where your time is going">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                <CartesianGrid stroke="#F1F5F9" horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" {...commonAxisProps} />
                <YAxis type="category" dataKey="name" {...commonAxisProps} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="hours" name="Hours" radius={[0,4,4,0]}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <ChartCard title="Hours by category" subtitle="Where your time is going">
            <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-xs">
              No categories mapped yet.
            </div>
          </ChartCard>
        )}

        {/* Completion pie */}
        {completionPie.length > 0 ? (
          <ChartCard title="Completion breakdown" subtitle="Active vs completed tasks">
            <div className="flex items-center justify-between">
              <ResponsiveContainer width="60%" height={180}>
                <PieChart>
                  <Pie data={completionPie} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
                    {completionPie.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#22C55E' : '#E2E8F0'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-3 pr-4">
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{completedCount}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-green-500" />Completed
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{activeCount}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />Active
                  </p>
                </div>
              </div>
            </div>
          </ChartCard>
        ) : (
          <ChartCard title="Completion breakdown" subtitle="Active vs completed tasks">
            <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-xs">
              No tasks logged.
            </div>
          </ChartCard>
        )}
      </div>
    </div>
  );
}
