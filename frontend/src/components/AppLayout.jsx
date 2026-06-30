import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CheckSquare, CalendarClock, BarChart2,
  Settings, BrainCircuit, Sun, Moon, Plus, Menu, X, LogOut, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Dashboard from './Dashboard';
import TasksPage from './TasksPage';
import PlannerPage from './PlannerPage';
import InsightsPage from './InsightsPage';
import SettingsPage from './SettingsPage';
import TaskFormModal from './TaskFormModal';

const navItems = [
  { path: '/dashboard',  label: 'Dashboard',   Icon: LayoutDashboard },
  { path: '/tasks',      label: 'Tasks',        Icon: CheckSquare      },
  { path: '/planner',    label: 'AI Planner',   Icon: CalendarClock    },
  { path: '/insights',   label: 'Insights',     Icon: BarChart2        },
  { path: '/settings',   label: 'Settings',     Icon: Settings         },
];

export default function AppLayout({ darkMode, setDarkMode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 flex flex-col
        w-56 bg-white dark:bg-slate-900
        border-r border-slate-100 dark:border-slate-800
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">
              DeadlineOS
            </span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map(({ path, label, Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary w-full justify-center text-sm py-2.5"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="sidebar-link w-full"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {darkMode ? 'Light mode' : 'Dark mode'}
          </button>
          {/* User info + logout */}
          {user && (
            <div className="flex items-center gap-2.5 px-2 py-2 mt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{user.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-500">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">DeadlineOS</span>
          <button onClick={() => setModalOpen(true)} className="text-primary">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/dashboard" element={<Dashboard setModalOpen={setModalOpen} />} />
            <Route path="/tasks"     element={<TasksPage setModalOpen={setModalOpen} />} />
            <Route path="/planner"   element={<PlannerPage />} />
            <Route path="/insights"  element={<InsightsPage />} />
            <Route path="/settings"  element={<SettingsPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
            <Route path="*"          element={<Dashboard setModalOpen={setModalOpen} />} />
          </Routes>
        </main>
      </div>

      {/* Task form modal */}
      {modalOpen && <TaskFormModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
