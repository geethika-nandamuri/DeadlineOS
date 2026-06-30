import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';

const MissionContext = createContext();
export const useMission = () => useContext(MissionContext);

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const MissionProvider = ({ children }) => {
  const { authFetch, isAuthenticated, token } = useAuth();

  const [tasks, setTasks]                     = useState([]);
  const [analysis, setAnalysis]               = useState(null);
  const [notifications, setNotifications]     = useState([]);
  const [dashboardData, setDashboardData]     = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [chatHistory, setChatHistory]         = useState([
    { sender: 'ai', text: 'Hi! I\'m your AI assistant. Ask me anything about your tasks or schedule.' }
  ]);
  const [loadingTasks, setLoadingTasks]       = useState(false);
  const [loadingAI, setLoadingAI]             = useState(false);
  const [chatLoading, setChatLoading]         = useState(false);
  const [error, setError]                     = useState(null);
  const [apiHealth, setApiHealth]             = useState(null);

  /* ── Health check (unauthenticated) ── */
  const checkHealth = async () => {
    try {
      const res = await fetch(`${API}/health`);
      const data = await res.json();
      setApiHealth(data);
    } catch {
      console.warn('Backend health check failed');
    }
  };

  /* ── Fetch dashboard analytics ── */
  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingAnalytics(true);
    try {
      const data = await authFetch('/analytics/dashboard');
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [isAuthenticated, authFetch]);

  /* ── Fetch tasks ── */
  const fetchTasks = useCallback(async (skipAI = false) => {
    if (!isAuthenticated) return;
    setLoadingTasks(true);
    try {
      const data = await authFetch('/tasks');
      setTasks(data);
      setError(null);
      if (!skipAI && data.length > 0) {
        triggerAIAnalysis(data);
      }
    } catch (err) {
      setError('Could not load tasks. Please try again.');
      console.error(err);
    } finally {
      setLoadingTasks(false);
    }
  }, [isAuthenticated, authFetch]);

  /* ── AI analysis ── */
  const triggerAIAnalysis = useCallback(async (currentTasks = tasks) => {
    if (!isAuthenticated) return;
    if ((currentTasks || tasks).filter(t => !t.completed).length === 0) {
      setAnalysis(null);
      return;
    }
    setLoadingAI(true);
    try {
      const data = await authFetch('/ai/analyze', { method: 'POST' });
      setAnalysis(data);
      if (data?.priorityReport) {
        setTasks(prev => prev.map(task => {
          const match = data.priorityReport.find(p => p.title === task.title || p.taskId === task._id);
          return match ? { ...task, priority: match.priorityScore } : task;
        }));
      }
    } catch (err) {
      console.error('AI analysis failed:', err);
    } finally {
      setLoadingAI(false);
    }
  }, [isAuthenticated, authFetch, tasks]);

  /* ── Add task ── */
  const addTask = useCallback(async (taskData) => {
    setLoadingTasks(true);
    try {
      const payload = {
        title:          taskData.title || taskData.taskTitle || taskData.name || '',
        description:    taskData.description !== undefined ? taskData.description : (taskData.notes || ''),
        deadline:       taskData.deadline || taskData.dueDate || '',
        estimatedHours: Number(taskData.estimatedHours !== undefined ? taskData.estimatedHours : (taskData.estimated_hours || 0)),
        category:       taskData.category || 'Study',
        difficulty:     taskData.difficulty || 'Medium',
      };

      console.log("Outgoing Task Payload", payload);
      const newTask = await authFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const updated = [newTask, ...tasks];
      setTasks(updated);
      setError(null);
      await triggerAIAnalysis(updated);
    } catch (err) {
      setError('Failed to add task.');
      console.error(err);
    } finally {
      setLoadingTasks(false);
    }
  }, [authFetch, tasks, triggerAIAnalysis]);

  /* ── Toggle complete ── */
  const toggleComplete = useCallback(async (id, completed) => {
    try {
      const updated = await authFetch(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed }),
      });
      const updatedTasks = tasks.map(t => t._id === id ? updated : t);
      setTasks(updatedTasks);
      await triggerAIAnalysis(updatedTasks);
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  }, [authFetch, tasks, triggerAIAnalysis]);

  /* ── Delete task ── */
  const deleteTask = useCallback(async (id) => {
    try {
      await authFetch(`/tasks/${id}`, { method: 'DELETE' });
      const updatedTasks = tasks.filter(t => t._id !== id);
      setTasks(updatedTasks);
      await triggerAIAnalysis(updatedTasks);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  }, [authFetch, tasks, triggerAIAnalysis]);

  /* ── AI chat ── */
  const sendJarvisMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    const userMsg = { sender: 'user', text };
    setChatHistory(prev => [...prev, userMsg]);
    setChatLoading(true);
    try {
      const res = await authFetch('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          history: chatHistory.map(h => ({
            role: h.sender === 'user' ? 'user' : 'assistant',
            text: h.text,
          })),
        }),
      });
      setChatHistory(prev => [...prev, { sender: 'ai', text: res.response }]);
    } catch (err) {
      console.error('Chat error:', err);
      setChatHistory(prev => [...prev, { sender: 'ai', text: 'Sorry, I couldn\'t reach the server. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  }, [authFetch, chatHistory]);

  /* ── Load notification history ── */
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await authFetch('/ai/notifications');
      setNotifications(Array.isArray(data) ? data : []);
    } catch {}
  }, [isAuthenticated, authFetch]);

  /* ── Auto-fetch dashboard analytics when tasks state changes ── */
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [tasks, isAuthenticated, fetchDashboardData]);

  /* ── Load data when user logs in ── */
  useEffect(() => {
    checkHealth();
    if (isAuthenticated) {
      fetchTasks();
      fetchNotifications();
    } else {
      setTasks([]);
      setAnalysis(null);
      setNotifications([]);
      setDashboardData(null);
    }
  }, [isAuthenticated, token]);

  return (
    <MissionContext.Provider value={{
      tasks, analysis, chatHistory, notifications, dashboardData, loadingAnalytics,
      loadingTasks, loadingAI, chatLoading,
      error, apiHealth,
      fetchTasks, addTask, toggleComplete, deleteTask,
      triggerAIAnalysis, sendJarvisMessage,
      fetchNotifications, fetchDashboardData,
    }}>
      {children}
    </MissionContext.Provider>
  );
};
