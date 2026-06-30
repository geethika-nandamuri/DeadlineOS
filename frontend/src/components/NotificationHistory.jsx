import React from 'react';
import { useMission } from '../context/MissionContext';
import { Bell, CheckCircle2, AlertCircle, Clock, Mail, BarChart2 } from 'lucide-react';

const TYPE_CONFIG = {
  '24h':          { icon: Bell,         color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-950/30',   label: '24h reminder'  },
  '6h':           { icon: Clock,        color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/30', label: '6h reminder' },
  '1h':           { icon: AlertCircle,  color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-950/30',     label: '1h reminder'   },
  'daily_summary':{ icon: Mail,         color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/30', label: 'Daily summary' },
  'weekly_report':{ icon: BarChart2,    color: 'text-emerald-500',bg: 'bg-emerald-50 dark:bg-emerald-950/30', label: 'Weekly report' },
  'custom':       { icon: Bell,         color: 'text-slate-500',  bg: 'bg-slate-50 dark:bg-slate-800',    label: 'Notification'  },
};

function timeAgo(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationHistory() {
  const { notifications } = useMission();

  if (!notifications || notifications.length === 0) {
    return (
      <div className="text-center py-8">
        <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-400 dark:text-slate-500">No notifications sent yet</p>
        <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Reminders appear here after they're sent</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
      {notifications.map((n, i) => {
        const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.custom;
        const Icon = cfg.icon;
        return (
          <div key={i} className="flex items-start gap-3 py-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
              <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{n.subject || n.taskTitle}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>
                <span className="text-[10px] text-slate-400">·</span>
                <span className="text-[10px] text-slate-400">{timeAgo(n.sentAt)}</span>
                {n.status === 'failed' && (
                  <span className="text-[10px] font-medium text-red-500">· Failed</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
