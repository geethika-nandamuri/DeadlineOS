import React, { useState } from 'react';
import { Sun, Moon, BrainCircuit, Bell, Clock, Calendar, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMission } from '../context/MissionContext';

/* ─── Toggle switch ─── */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

/* ─── Number input row ─── */
function NumberSetting({ label, description, value, onChange, min, max, unit }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="form-input w-20 text-center text-sm"
        />
        {unit && <span className="text-xs text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}

/* ─── Toggle setting row ─── */
function ToggleSetting({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

/* ─── Section card ─── */
function Section({ title, icon: Icon, children }) {
  return (
    <div className="card p-5">
      <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-1 flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        {title}
      </h2>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage({ darkMode, setDarkMode }) {
  const { user, updateSettings } = useAuth();
  const { tasks, apiHealth } = useMission();

  const defaultSettings = user?.settings || {};

  const [settings, setSettings] = useState({
    workStartHour:      defaultSettings.workStartHour      ?? 8,
    workEndHour:        defaultSettings.workEndHour        ?? 20,
    focusDuration:      defaultSettings.focusDuration      ?? 90,
    breakDuration:      defaultSettings.breakDuration      ?? 15,
    timezone:           defaultSettings.timezone           ?? 'Asia/Kolkata',
    emailNotifications: defaultSettings.emailNotifications ?? true,
    dailySummary:       defaultSettings.dailySummary       ?? true,
    weeklyReport:       defaultSettings.weeklyReport       ?? true,
    reminderAt24h:      defaultSettings.reminderAt24h      ?? true,
    reminderAt6h:       defaultSettings.reminderAt6h       ?? true,
    reminderAt1h:       defaultSettings.reminderAt1h       ?? true,
  });

  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const TIMEZONES = [
    'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo',
    'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Chicago',
    'America/Denver', 'America/Los_Angeles', 'Australia/Sydney', 'Pacific/Auckland',
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            Customize your scheduling, notifications, and preferences.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary text-sm py-2 px-4"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <><CheckCircle2 className="w-4 h-4" /> Saved!</>
          ) : 'Save changes'}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Appearance */}
        <Section title="Appearance" icon={Sun}>
          <ToggleSetting
            label="Dark mode"
            description="Switch between light and dark interface"
            checked={darkMode}
            onChange={setDarkMode}
          />
        </Section>

        {/* Working hours */}
        <Section title="Working Hours" icon={Clock}>
          <NumberSetting
            label="Work day starts"
            description="The AI won't schedule tasks before this hour"
            value={settings.workStartHour}
            onChange={v => set('workStartHour', v)}
            min={0} max={12} unit="h (24-hr)"
          />
          <NumberSetting
            label="Work day ends"
            description="The AI won't schedule tasks after this hour"
            value={settings.workEndHour}
            onChange={v => set('workEndHour', v)}
            min={12} max={24} unit="h (24-hr)"
          />
          <NumberSetting
            label="Focus session duration"
            description="How long each deep work block should be"
            value={settings.focusDuration}
            onChange={v => set('focusDuration', v)}
            min={30} max={180} unit="min"
          />
          <NumberSetting
            label="Break duration"
            description="Short break between focus sessions"
            value={settings.breakDuration}
            onChange={v => set('breakDuration', v)}
            min={5} max={60} unit="min"
          />
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Timezone</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Used for scheduling email reminders</p>
            </div>
            <select
              value={settings.timezone}
              onChange={e => set('timezone', e.target.value)}
              className="form-input w-48 text-sm"
            >
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
        </Section>

        {/* Email notifications */}
        <Section title="Email Notifications" icon={Bell}>
          <ToggleSetting
            label="Email notifications"
            description="Master switch for all email notifications"
            checked={settings.emailNotifications}
            onChange={v => set('emailNotifications', v)}
          />
          <ToggleSetting
            label="24-hour deadline reminder"
            description="Get reminded a day before a task is due"
            checked={settings.reminderAt24h && settings.emailNotifications}
            onChange={v => set('reminderAt24h', v)}
          />
          <ToggleSetting
            label="6-hour deadline reminder"
            description="Get reminded 6 hours before a task is due"
            checked={settings.reminderAt6h && settings.emailNotifications}
            onChange={v => set('reminderAt6h', v)}
          />
          <ToggleSetting
            label="1-hour deadline reminder"
            description="Get a final nudge 1 hour before the deadline"
            checked={settings.reminderAt1h && settings.emailNotifications}
            onChange={v => set('reminderAt1h', v)}
          />
          <ToggleSetting
            label="Daily morning summary"
            description="Receive an AI-generated plan every morning at 8 AM"
            checked={settings.dailySummary && settings.emailNotifications}
            onChange={v => set('dailySummary', v)}
          />
          <ToggleSetting
            label="Weekly productivity report"
            description="Get a Sunday evening summary of your week"
            checked={settings.weeklyReport && settings.emailNotifications}
            onChange={v => set('weeklyReport', v)}
          />
        </Section>

        {/* AI Status */}
        <Section title="AI Configuration" icon={BrainCircuit}>
          <div className="py-3">
            <div className={`flex items-start gap-3 p-3.5 rounded-xl ${
              apiHealth?.geminiKeyConfigured
                ? 'bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900'
                : 'bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-100 dark:border-yellow-900'
            }`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${apiHealth?.geminiKeyConfigured ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <div>
                <p className={`text-sm font-medium ${apiHealth?.geminiKeyConfigured ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                  {apiHealth?.geminiKeyConfigured ? 'Gemini AI connected' : 'Running in local calculation mode'}
                </p>
                <p className="text-xs mt-0.5 text-slate-500 dark:text-slate-400">
                  {apiHealth?.geminiKeyConfigured
                    ? 'Live AI analysis is active. All recommendations are powered by Gemini.'
                    : 'Add GEMINI_API_KEY to backend/.env to enable live AI. Local scheduler mode uses smart calculations.'}
                </p>
                {apiHealth?.emailConfigured !== undefined && (
                  <p className={`text-xs mt-1 ${apiHealth.emailConfigured ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                    {apiHealth.emailConfigured ? '✉️ Email (SMTP) configured' : '✉️ Email not configured — set EMAIL_* variables in .env'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Section>

        {/* Data */}
        <Section title="Data" icon={Calendar}>
          <div className="py-3">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-0.5">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} in your workspace
            </p>
            <p className="text-xs text-slate-400">Stored securely in your MongoDB database.</p>
          </div>
        </Section>
      </div>
    </div>
  );
}
