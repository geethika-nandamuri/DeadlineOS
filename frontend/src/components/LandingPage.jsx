import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2, CalendarDays, Zap, TrendingUp, Clock, Star,
  ArrowRight, Sun, Moon, BrainCircuit
} from 'lucide-react';
import { useMission } from '../context/MissionContext';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }
});

/* ── Tiny preview card used inside the hero mockup ── */
const PreviewTask = ({ title, time, badge, badgeColor, done }) => (
  <div className={`flex items-center gap-3 p-3 rounded-lg border ${done ? 'opacity-50' : ''} bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700`}>
    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${done ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-500'}`}>
      {done && <CheckCircle2 className="w-3 h-3 text-white" />}
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-xs font-medium truncate ${done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{title}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{time}</p>
    </div>
    <span className={`badge badge-${badgeColor} text-[9px]`}>{badge}</span>
  </div>
);

/* ── Hero dashboard mockup ── */
function HeroMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-lg mx-auto"
    >
      <div className="card p-4 shadow-modal overflow-hidden">
        {/* Mock header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] text-slate-400 font-medium">Good morning ☀️</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Here's your plan for today</p>
          </div>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
        </div>

        {/* AI Recommendation banner */}
        <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-xl p-3 mb-4 flex items-start gap-2.5">
          <BrainCircuit className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
            <strong>Start with your React project now.</strong> You have a 6-hour window before your next deadline — perfect for deep work.
          </p>
        </div>

        {/* Task list */}
        <div className="flex flex-col gap-2 mb-4">
          <PreviewTask title="React Project — Auth Module" time="Due today, 6:00 PM" badge="High" badgeColor="red" done={false} />
          <PreviewTask title="DBMS Assignment" time="Due tomorrow, 11:59 PM" badge="Medium" badgeColor="yellow" done={false} />
          <PreviewTask title="Read lecture notes" time="Due today, 2:00 PM" badge="Done" badgeColor="green" done={true} />
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Today's progress</span>
            <span className="text-primary">1 of 3 done</span>
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill bg-primary" style={{ width: '33%' }} />
          </div>
        </div>
      </div>

      {/* Floating tag */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="absolute -top-4 -right-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-card px-3 py-2 flex items-center gap-2"
      >
        <Zap className="w-3.5 h-3.5 text-yellow-500" />
        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">AI Planner active</span>
      </motion.div>

      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
        className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-card px-3 py-2 flex items-center gap-2"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">On track for today</span>
      </motion.div>
    </motion.div>
  );
}

const features = [
  {
    icon: <CalendarDays className="w-5 h-5 text-indigo-500" />,
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    title: 'Smart Daily Planner',
    desc: 'AI builds your daily schedule around deadlines, energy levels, and priorities so you never have to guess what to do next.',
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-cyan-500" />,
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    title: 'Deadline Risk Alerts',
    desc: 'Get notified when a task is at risk of being late — with clear, plain-English explanations and suggestions.',
  },
  {
    icon: <Clock className="w-5 h-5 text-emerald-500" />,
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    title: 'Workload Balancing',
    desc: 'Spot overloaded days before they happen. The AI redistributes your work so you can focus without burning out.',
  },
  {
    icon: <Star className="w-5 h-5 text-yellow-500" />,
    bg: 'bg-yellow-50 dark:bg-yellow-950/40',
    title: 'Personalized Coaching',
    desc: 'Your AI coach analyzes your progress and gives specific, actionable nudges — not generic productivity tips.',
  },
];

export default function LandingPage({ darkMode, setDarkMode }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-300">

      {/* ── Navbar ── */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BrainCircuit className="w-4.5 h-4.5 text-white w-5 h-5" />
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-100 text-[15px] tracking-tight">DeadlineOS</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary text-sm py-2 px-4">
            Log in
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm py-2 px-4">
            Get Started
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <motion.div {...fadeUp(0.1)} className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full px-3.5 py-1.5 text-xs font-semibold mb-6">
            <Zap className="w-3.5 h-3.5" />
            AI-powered productivity
          </motion.div>

          <motion.h1 {...fadeUp(0.15)} className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight mb-5">
            Stay ahead of<br />
            <span className="text-primary">every deadline.</span>
          </motion.h1>

          <motion.p {...fadeUp(0.2)} className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed mb-8 max-w-md">
            Your AI productivity partner plans your day, prioritizes your work, predicts risks, and helps you avoid burning out.
          </motion.p>

          <motion.div {...fadeUp(0.25)} className="flex flex-wrap items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="btn-primary text-[15px] py-3 px-6">
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>

        <div className="hidden lg:flex justify-center px-8">
          <HeroMockup />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
            Everything you need to stay on track
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Built for students and professionals who want to do more without feeling overwhelmed.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="card p-5 flex flex-col gap-3"
            >
              <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center`}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{f.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl p-10 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to take control of your time?</h2>
          <p className="text-indigo-100 mb-7 max-w-md mx-auto text-sm leading-relaxed">
            Add your tasks and let the AI figure out the rest. No setup needed.
          </p>
          <button onClick={() => navigate('/dashboard')} className="bg-white text-indigo-600 font-semibold py-3 px-8 rounded-xl hover:bg-indigo-50 transition-colors text-sm">
            Open Dashboard
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 dark:border-slate-800 py-8 text-center text-xs text-slate-400 dark:text-slate-500">
        © 2026 DeadlineOS — Built for the hackathon
      </footer>
    </div>
  );
}
