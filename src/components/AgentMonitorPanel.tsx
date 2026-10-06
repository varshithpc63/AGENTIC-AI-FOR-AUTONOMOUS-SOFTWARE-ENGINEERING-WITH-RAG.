import React, { useRef } from 'react';
import {
  FileText,
  Compass,
  Database,
  Code2,
  Box,
  CheckCircle2,
  Wrench,
  Sparkles,
  Loader2,
  Check,
  X,
  Clock,
  Send,
  Wand2,
  ChevronDown,
  Trash2,
  CornerDownLeft,
  Activity,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { AgentType, TestReport, DebugAttempt, SamplePrompt } from '../types/client';

interface AgentMonitorPanelProps {
  activeAgent: AgentType | null;
  agentProgress: Record<AgentType, { status: string; message?: string }>;
  overallStatus: string;
  testReport: TestReport | null;
  debugAttempts: DebugAttempt[];
  prompt: string;
  setPrompt: (val: string) => void;
  onGenerate: () => void;
  onModify: () => void;
  isGenerating: boolean;
  isModifying: boolean;
  hasProject: boolean;
  samples: SamplePrompt[];
  onSelectSample: (sample: SamplePrompt) => void;
}

interface StepMeta {
  key: AgentType;
  label: string;
  icon: React.ElementType;
}

const STEPS: StepMeta[] = [
  { key: 'requirement', label: 'Requirement', icon: FileText },
  { key: 'design', label: 'Design', icon: Compass },
  { key: 'rag', label: 'RAG', icon: Database },
  { key: 'code', label: 'Code', icon: Code2 },
  { key: 'execution', label: 'Execution', icon: Box },
  { key: 'testing', label: 'Testing', icon: CheckCircle2 },
  { key: 'debug', label: 'Debugging', icon: Wrench },
  { key: 'completed', label: 'Completed', icon: Sparkles },
];

export const AgentMonitorPanel: React.FC<AgentMonitorPanelProps> = ({
  activeAgent,
  agentProgress,
  overallStatus,
  testReport,
  debugAttempts,
  prompt,
  setPrompt,
  onGenerate,
  onModify,
  isGenerating,
  isModifying,
  hasProject,
  samples,
  onSelectSample,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const totalTests = testReport?.totalTests || 0;
  const passedTests = testReport?.passed || 0;
  const failedTests = testReport?.failed || 0;
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  const executionTime = testReport?.durationMs || 0;

  const isBusy = isGenerating || isModifying;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!isBusy && prompt.trim()) {
        if (hasProject) {
          onModify();
        } else {
          onGenerate();
        }
      }
    }
  };

  return (
    <aside className="w-full h-full bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col overflow-y-auto select-none">
      {/* ======================================================== */}
      {/* SECTION A: AGENT MONITOR (Top, compact horizontal cards) */}
      {/* ======================================================== */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/40 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Agent Monitor</span>
          </div>

          <span
            className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
              overallStatus === 'generating'
                ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/60 animate-pulse'
                : overallStatus === 'completed'
                ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {overallStatus}
          </span>
        </div>

        {/* Compact Horizontal Agent Cards in a 2x4 Grid */}
        <div className="grid grid-cols-4 gap-1.5">
          {STEPS.map((step) => {
            const prog = agentProgress[step.key] || { status: 'idle' };
            const isRunning = prog.status === 'running';
            const isCompleted = prog.status === 'completed';
            const isFailed = prog.status === 'failed';
            const isSkipped = prog.status === 'skipped';

            const Icon = step.icon;

            return (
              <div
                key={step.key}
                className={`p-1.5 rounded-md border flex flex-col justify-between text-left transition ${
                  isRunning
                    ? 'bg-indigo-950/70 border-indigo-500/80 text-white shadow-2xs ring-1 ring-indigo-500/30'
                    : isCompleted
                    ? 'bg-slate-900/90 border-emerald-800/60 text-slate-200'
                    : isFailed
                    ? 'bg-rose-950/60 border-rose-800/80 text-slate-200'
                    : isSkipped
                    ? 'bg-slate-900/40 border-slate-800/60 text-slate-500'
                    : 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center ${
                      isRunning
                        ? 'text-indigo-400'
                        : isCompleted
                        ? 'text-emerald-400'
                        : isFailed
                        ? 'text-rose-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {isRunning ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : isCompleted ? (
                      <Check className="w-3 h-3 stroke-[3]" />
                    ) : isFailed ? (
                      <X className="w-3 h-3 stroke-[3]" />
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                  </div>

                  <span
                    className={`text-[8px] font-mono uppercase px-1 py-0.2 rounded font-semibold ${
                      isRunning
                        ? 'bg-indigo-500 text-white'
                        : isCompleted
                        ? 'bg-emerald-900/50 text-emerald-300'
                        : isFailed
                        ? 'bg-rose-900/50 text-rose-300'
                        : isSkipped
                        ? 'bg-slate-800 text-slate-500'
                        : 'bg-slate-800/50 text-slate-500'
                    }`}
                  >
                    {isSkipped ? 'skip' : prog.status.slice(0, 4)}
                  </span>
                </div>

                <span className="text-[10px] font-semibold tracking-tight truncate leading-tight">
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION B: SANDBOX METRICS (Clean, compact cards)        */}
      {/* ======================================================== */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/20 shrink-0 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-300">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sandbox Metrics</span>
          </div>
          {executionTime > 0 && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
              <Clock className="w-2.5 h-2.5" />
              {executionTime}ms
            </span>
          )}
        </div>

        {/* Test Pass Rate Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-400">Test Pass Rate</span>
            <span className={passRate === 100 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
              {passRate}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 transition-all duration-300"
              style={{ width: `${passRate}%` }}
            />
            {failedTests > 0 && (
              <div
                className="bg-rose-500 transition-all duration-300"
                style={{ width: `${Math.round((failedTests / (totalTests || 1)) * 100)}%` }}
              />
            )}
          </div>
        </div>

        {/* 2x2 Metric Cards Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900 border border-slate-800 rounded-md p-2 text-center">
            <span className="text-[9px] text-slate-400 block uppercase">Passed</span>
            <span className="text-sm font-mono font-bold text-emerald-400">
              {passedTests} / {totalTests}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-md p-2 text-center">
            <span className="text-[9px] text-slate-400 block uppercase">Failed</span>
            <span className={`text-sm font-mono font-bold ${failedTests > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {failedTests}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-md p-2 text-center">
            <span className="text-[9px] text-slate-400 block uppercase">Debug Attempts</span>
            <span className="text-sm font-mono font-bold text-slate-300">
              {debugAttempts.length}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-md p-2 text-center">
            <span className="text-[9px] text-slate-400 block uppercase">Sandbox VM</span>
            <span className="text-xs font-mono text-emerald-400 font-semibold block mt-0.5">
              Isolated
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION C: USER PROMPT / MODIFY PROMPT                   */}
      {/* Chat-style developer input box for Build & Modify        */}
      {/* ======================================================== */}
      <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
        <div className="space-y-1.5 flex-1 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Your Requirement</span>
            </span>

            {/* Compact Examples Dropdown */}
            <div className="relative">
              <select
                disabled={isBusy}
                onChange={(e) => {
                  const s = samples.find((x) => x.id === e.target.value);
                  if (s) onSelectSample(s);
                }}
                defaultValue=""
                className="text-[11px] bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-slate-300 hover:text-white hover:bg-slate-700/80 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer pr-5 appearance-none"
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
              <ChevronDown className="w-2.5 h-2.5 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Chat-style prompt textarea */}
          <div className="flex-1 min-h-[110px] relative rounded-lg border border-slate-700/80 bg-slate-950 p-2.5 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition flex flex-col">
            <textarea
              ref={textareaRef}
              disabled={isBusy}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to build or modify in the current application (e.g. 'Add a student search feature' or 'Change attendance threshold to 80%')..."
              className="w-full flex-1 bg-transparent text-xs text-slate-100 placeholder:text-slate-500 resize-none focus:outline-none leading-relaxed select-text"
            />

            {/* Bottom Meta Bar inside textarea */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
              <span>{prompt.length} chars</span>

              <div className="flex items-center gap-2">
                {prompt && !isBusy && (
                  <button
                    onClick={() => setPrompt('')}
                    className="hover:text-slate-300 flex items-center gap-0.5"
                    title="Clear prompt"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>Clear</span>
                  </button>
                )}
                <span className="hidden sm:inline text-slate-500">Ctrl+Enter to run</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls: [Generate / Run] and [Modify Current App] */}
        <div className="space-y-1.5 pt-1">
          <div className="grid grid-cols-2 gap-2">
            {/* Generate / Run button */}
            <button
              type="button"
              disabled={isBusy || !prompt.trim()}
              onClick={onGenerate}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
              title="Generate new software from scratch"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Building...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Generate / Run</span>
                </>
              )}
            </button>

            {/* Modify Current App button */}
            <button
              type="button"
              disabled={isBusy || !prompt.trim() || !hasProject}
              onClick={onModify}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-xs text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
              title={
                hasProject
                  ? 'Surgically apply changes to the existing project without full regeneration'
                  : 'Generate an application first to enable modifications'
              }
            >
              {isModifying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Modifying...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Modify Current</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[10px] text-slate-500 text-center">
            {hasProject
              ? 'Click "Modify Current" to edit specific files and re-test without rebuilding.'
              : 'Enter a requirement and click "Generate / Run" to build.'}
          </p>
        </div>
      </div>
    </aside>
  );
};
