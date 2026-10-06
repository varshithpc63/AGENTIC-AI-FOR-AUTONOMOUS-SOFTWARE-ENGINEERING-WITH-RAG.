import React, { useState } from 'react';
import { Terminal, Search, Filter } from 'lucide-react';
import { AgentLogEntry } from '../types/client';

interface ActivityLogsViewProps {
  logs: AgentLogEntry[];
}

export const ActivityLogsView: React.FC<ActivityLogsViewProps> = ({ logs }) => {
  const [filter, setFilter] = useState<'All' | 'Agent' | 'Sandbox' | 'Testing' | 'Debugging'>('All');
  const [search, setSearch] = useState('');

  const filtered = logs.filter((log) => {
    // Category filter
    let matchCategory = true;
    if (filter === 'Agent') {
      matchCategory = ['requirement', 'design', 'code'].includes(log.agent);
    } else if (filter === 'Sandbox') {
      matchCategory = log.agent === 'execution';
    } else if (filter === 'Testing') {
      matchCategory = log.agent === 'testing';
    } else if (filter === 'Debugging') {
      matchCategory = log.agent === 'debug';
    }

    // Search filter
    const matchSearch =
      !search ||
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      log.agent.toLowerCase().includes(search.toLowerCase());

    return matchCategory && matchSearch;
  });

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-200 font-mono text-xs overflow-hidden select-text">
      {/* Filter and Search Bar */}
      <div className="h-10 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 select-none">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 hidden sm:inline" />
          {(['All', 'Agent', 'Sandbox', 'Testing', 'Debugging'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                filter === cat
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-32 sm:w-48 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
            {filtered.length} entries
          </span>
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {filtered.length === 0 ? (
          <div className="text-slate-500 italic p-4 text-center">
            No activity logs matching &quot;{filter}&quot; filter.
          </div>
        ) : (
          filtered.map((log) => {
            const isError = log.level === 'error';
            const isWarn = log.level === 'warn';
            const isSuccess = log.level === 'success';

            return (
              <div
                key={log.id}
                className="flex items-start gap-2.5 px-2 py-1 rounded hover:bg-slate-900/60 transition"
              >
                <span className="text-slate-500 text-[10px] shrink-0 font-mono pt-0.5">
                  {log.timestamp}
                </span>

                <span
                  className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded shrink-0 select-none ${
                    log.agent === 'requirement'
                      ? 'bg-sky-950 text-sky-400 border border-sky-800'
                      : log.agent === 'design'
                      ? 'bg-purple-950 text-purple-400 border border-purple-800'
                      : log.agent === 'rag'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : log.agent === 'code'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : log.agent === 'execution'
                      ? 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                      : log.agent === 'testing'
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                      : log.agent === 'debug'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {log.agent}
                </span>

                <div
                  className={`flex-1 break-words leading-relaxed ${
                    isError
                      ? 'text-rose-400 font-semibold'
                      : isWarn
                      ? 'text-amber-400'
                      : isSuccess
                      ? 'text-emerald-300'
                      : 'text-slate-300'
                  }`}
                >
                  {log.message}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
