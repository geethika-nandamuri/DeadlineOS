import React, { useState, useRef, useEffect } from 'react';
import { useMission } from '../context/MissionContext';
import { Send, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

const SUGGESTED = [
  'What should I do next?',
  'Can I finish everything today?',
  'Make tomorrow easier.',
];

export default function CommandCenter() {
  const { chatHistory, chatLoading, sendJarvisMessage } = useMission();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || chatLoading) return;
    const msg = input;
    setInput('');
    await sendJarvisMessage(msg);
  };

  return (
    <div className="card overflow-hidden flex flex-col" style={{ minHeight: 320 }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
          <BrainCircuit className="w-4 h-4 text-indigo-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Ask your AI assistant</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">Ask anything about your tasks or schedule</p>
        </div>
      </div>

      {/* Message stream */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ maxHeight: 260 }}>
        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'chat-user'
                  : 'chat-ai'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {chatLoading && (
          <div className="flex justify-start">
            <div className="chat-ai px-3.5 py-2.5 flex items-center gap-1.5">
              {[0, 150, 300].map(d => (
                <span
                  key={d}
                  className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div className="px-4 pb-2 flex flex-wrap gap-1.5">
        {SUGGESTED.map((s, i) => (
          <button
            key={i}
            disabled={chatLoading}
            onClick={() => sendJarvisMessage(s)}
            className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary dark:hover:text-primary transition-colors disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-4 pb-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a question…"
          className="form-input flex-1"
        />
        <button
          type="submit"
          disabled={chatLoading || !input.trim()}
          className="btn-primary py-2 px-3.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
