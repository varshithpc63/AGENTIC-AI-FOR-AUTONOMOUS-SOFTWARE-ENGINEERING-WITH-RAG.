import React, { useRef, useEffect, useState } from 'react';
import {
  Plus,
  SendHorizontal,
  Sparkles,
  Bot,
  User,
  Loader2,
  Check,
  X,
  Minus,
  Trash2,
  ChevronDown,
  Code2,
  Wrench,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ChatMessage, ActivityStep, SamplePrompt } from '../types/client';

interface PromptWorkspaceProps {
  messages: ChatMessage[];
  currentSteps?: ActivityStep[];
  isGenerating: boolean;
  isModifying: boolean;
  hasProject: boolean;
  activeAppTitle?: string;
  samples: SamplePrompt[];
  onSelectSample: (sample: SamplePrompt) => void;
  onSubmitPrompt: (text: string) => void;
  onNewApp: () => void;
  onClearHistory: () => void;
}

export const PromptWorkspace: React.FC<PromptWorkspaceProps> = ({
  messages,
  currentSteps = [],
  isGenerating,
  isModifying,
  hasProject,
  activeAppTitle,
  samples,
  onSelectSample,
  onSubmitPrompt,
  onNewApp,
  onClearHistory,
}) => {
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isBusy = isGenerating || isModifying;

  // Auto-scroll to bottom of chat when new messages or steps arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentSteps, isBusy]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isBusy) return;

    // Clear input box immediately
    setInputText('');

    // Submit prompt
    onSubmitPrompt(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift or Ctrl+Enter submits
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <aside className="w-full h-full bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col overflow-hidden select-none">
      {/* ======================================================== */}
      {/* 1. TOP HEADER: NEW APP "+" BUTTON, TITLE & EXAMPLES      */}
      {/* ======================================================== */}
      <div className="h-12 px-3.5 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center justify-between shrink-0 gap-2">
        {/* Left: New App "+" Button and Header Title */}
        <div className="flex items-center gap-2 min-w-0">
          {/* New App "+" Action Button */}
          <button
            type="button"
            onClick={onNewApp}
            disabled={isBusy}
            title="Create a new application (Start fresh)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm hover:shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">New App</span>
          </button>

          {/* Builder Title / Current Project Context */}
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-xs font-bold text-slate-200 tracking-tight flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI App Builder</span>
            </span>
            {hasProject && activeAppTitle && (
              <span
                className="hidden lg:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800/90 text-indigo-300 border border-slate-700 truncate max-w-[130px]"
                title={activeAppTitle}
              >
                {activeAppTitle}
              </span>
            )}
          </div>
        </div>

        {/* Right: Preset Examples & Clear Conversation */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <select
              disabled={isBusy}
              onChange={(e) => {
                const s = samples.find((x) => x.id === e.target.value);
                if (s) {
                  setInputText(s.prompt);
                  onSelectSample(s);
                  textareaRef.current?.focus();
                }
              }}
              defaultValue=""
              className="text-[11px] bg-slate-800/90 border border-slate-700 hover:border-slate-600 rounded-lg px-2.5 py-1 text-slate-300 hover:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer pr-5 appearance-none transition"
              title="Load sample requirement"
            >
              <option value="" disabled>
                Examples...
              </option>
              {samples.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
          </div>

          {messages.length > 0 && !isBusy && (
            <button
              onClick={onClearHistory}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition text-[11px]"
              title="Clear conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. CHAT CONVERSATION FEED                                */}
      {/* ======================================================== */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 select-text">
        {/* Welcome Empty State */}
        {messages.length === 0 && !isBusy && (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-1 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-sm font-bold text-slate-100">
                What would you like to build?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Describe any application in natural language. Gemini will analyze, write real code, run tests, and render the live app.
              </p>
            </div>

            {/* Quick Inspiration Chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 max-w-md">
              <button
                onClick={() => setInputText('Create a calculator app with addition, subtraction, multiplication, and division.')}
                className="px-2.5 py-1 text-[11px] font-mono bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 transition cursor-pointer"
              >
                🧮 Calculator App
              </button>
              <button
                onClick={() => setInputText('Build an agile Kanban project task board with To Do, In Progress, and Done columns.')}
                className="px-2.5 py-1 text-[11px] font-mono bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 transition cursor-pointer"
              >
                📋 Kanban Task Board
              </button>
              <button
                onClick={() => setInputText('Build a personal expense and budget management system to track income and expenses.')}
                className="px-2.5 py-1 text-[11px] font-mono bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 transition cursor-pointer"
              >
                💰 Expense Tracker
              </button>
            </div>
          </div>
        )}

        {/* Message Feed */}
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-1.5">
            {/* User Message */}
            {msg.sender === 'user' && (
              <div className="space-y-1 max-w-[92%] ml-auto">
                <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-400 font-mono pr-1">
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                    {msg.actionType === 'modify' ? 'Update' : 'New App'}
                  </span>
                  <span>{msg.timestamp}</span>
                  <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[9px] font-bold">
                    U
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl rounded-tr-xs bg-indigo-600/20 border border-indigo-500/30 text-xs sm:text-[13px] font-sans text-slate-100 whitespace-pre-wrap leading-relaxed shadow-sm">
                  {msg.text}
                </div>
              </div>
            )}

            {/* System / Gemini Message */}
            {msg.sender === 'system' && (
              <div className="space-y-1 max-w-[96%] mr-auto">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono pl-1">
                  <div className="w-4 h-4 rounded-full bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-300">
                    <Sparkles className="w-2.5 h-2.5" />
                  </div>
                  <span className="font-semibold text-slate-200">Gemini</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div className="p-3.5 rounded-2xl rounded-tl-xs bg-slate-950/90 border border-slate-800/90 text-xs text-slate-300 space-y-2.5 shadow-sm">
                  <p className="text-slate-200 font-medium leading-relaxed">
                    {msg.text}
                  </p>

                  {/* Step Breakdown */}
                  {msg.steps && msg.steps.length > 0 && (
                    <div className="space-y-1 pt-1.5 border-t border-slate-800/80 font-mono text-[11px]">
                      {msg.steps.map((st, i) => (
                        <div key={i} className="flex items-center justify-between gap-2 py-0.5">
                          <span className="text-slate-300 flex items-center gap-1.5 truncate">
                            {st.status === 'completed' && (
                              <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                            )}
                            {st.status === 'running' && (
                              <Loader2 className="w-3 h-3 text-indigo-400 animate-spin shrink-0" />
                            )}
                            {st.status === 'failed' && (
                              <X className="w-3 h-3 text-rose-400 shrink-0 stroke-[3]" />
                            )}
                            {st.status === 'skipped' && (
                              <Minus className="w-3 h-3 text-slate-500 shrink-0" />
                            )}
                            <span className="truncate">{st.label}</span>
                          </span>

                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold shrink-0 ${
                              st.status === 'completed'
                                ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/50'
                                : st.status === 'running'
                                ? 'text-indigo-400 bg-indigo-950/40 border border-indigo-900/50'
                                : st.status === 'failed'
                                ? 'text-rose-400 bg-rose-950/40 border border-rose-900/50'
                                : 'text-slate-500'
                            }`}
                          >
                            {st.status === 'completed' ? 'Done' : st.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Live Active Progress Card when pipeline is currently running */}
        {isBusy && currentSteps.length > 0 && (
          <div className="space-y-1 max-w-[96%] mr-auto pt-1">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono pl-1">
              <div className="w-4 h-4 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              </div>
              <span className="font-semibold text-slate-200">
                {isModifying ? 'Updating App...' : 'Building App...'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl rounded-tl-xs bg-slate-950/90 border border-indigo-900/50 text-xs text-slate-300 space-y-2 shadow-lg">
              <div className="space-y-1 font-mono text-[11px]">
                {currentSteps.map((st, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 py-0.5">
                    <span className="text-slate-300 flex items-center gap-1.5 truncate">
                      {st.status === 'completed' && (
                        <Check className="w-3 h-3 text-emerald-400 shrink-0 stroke-[3]" />
                      )}
                      {st.status === 'running' && (
                        <Loader2 className="w-3 h-3 text-indigo-400 animate-spin shrink-0" />
                      )}
                      {st.status === 'failed' && (
                        <X className="w-3 h-3 text-rose-400 shrink-0 stroke-[3]" />
                      )}
                      {st.status === 'skipped' && (
                        <Minus className="w-3 h-3 text-slate-500 shrink-0" />
                      )}
                      <span className="truncate">{st.label}</span>
                    </span>

                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold shrink-0 ${
                        st.status === 'completed'
                          ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/50'
                          : st.status === 'running'
                          ? 'text-indigo-400 bg-indigo-950/40 border border-indigo-900/50'
                          : st.status === 'failed'
                          ? 'text-rose-400 bg-rose-950/40 border border-rose-900/50'
                          : 'text-slate-500'
                      }`}
                    >
                      {st.status === 'completed' ? 'Done' : st.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* ======================================================== */}
      {/* 3. FIXED BOTTOM COMPOSER (Single "Send" button)           */}
      {/* ======================================================== */}
      <div className="p-3 sm:p-3.5 border-t border-slate-800 bg-slate-950 shrink-0 space-y-2 select-none">
        {/* Textarea Input Container */}
        <div className="rounded-xl border border-slate-700/80 bg-slate-900/90 p-2.5 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition flex flex-col shadow-inner">
          <textarea
            ref={textareaRef}
            disabled={isBusy}
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              hasProject
                ? "Describe what you'd like to improve or add to this app (e.g., 'Make the buttons bigger and add dark mode')..."
                : "Describe an app to build (e.g., 'Create a calculator app with addition, subtraction, multiplication, and division')..."
            }
            className="w-full bg-transparent text-xs sm:text-sm font-sans text-slate-100 placeholder:text-slate-500 resize-none focus:outline-none leading-relaxed select-text"
          />

          {/* Textarea Meta Status */}
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 text-[10px] text-slate-500 font-mono">
            <span>{inputText.length} chars</span>

            <div className="flex items-center gap-2">
              {inputText && !isBusy && (
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="hover:text-slate-300 flex items-center gap-0.5 cursor-pointer"
                  title="Clear input text"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>Clear</span>
                </button>
              )}
              <span className="hidden sm:inline text-slate-400">Enter to send • Shift+Enter for newline</span>
            </div>
          </div>
        </div>

        {/* Single "Send" Action Button */}
        <div>
          <button
            type="button"
            disabled={isBusy || !inputText.trim()}
            onClick={handleSend}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:from-indigo-700 active:to-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md shadow-indigo-600/20 cursor-pointer"
            title={hasProject ? 'Send modification instruction' : 'Send requirement to build application'}
          >
            {isBusy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isModifying ? 'Updating App...' : 'Building App...'}</span>
              </>
            ) : (
              <>
                <SendHorizontal className="w-4 h-4" />
                <span>Send</span>
              </>
            )}
          </button>
        </div>

        {/* Informative Subtext */}
        <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1.5">
          <span>
            {hasProject
              ? 'Gemini remembers context • All prompts modify the current app.'
              : 'Type your requirement above and click Send to build.'}
          </span>
        </div>
      </div>
    </aside>
  );
};
