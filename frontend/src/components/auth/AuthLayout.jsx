import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-cyan-50/20 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-900 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8 group">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg group-hover:shadow-indigo-300/40 transition-shadow">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-100 text-base tracking-tight">DeadlineOS</span>
        </Link>

        {/* Card */}
        <div className="card p-8">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
