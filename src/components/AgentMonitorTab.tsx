import React from 'react';
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
  ShieldCheck,
  Activity,
  Layers,
  Cpu,
} from 'lucide-react';
import { AgentType, TestReport, DebugAttempt } from '../types/client';

interface AgentMonitorTabProps {
  activeAgent: AgentType | null;
  agentProgress: Record<AgentType, { status: string; message?: string }>;
  overallStatus: string;
  testReport: TestReport | null;
  debugAttempts: DebugAttempt[];
}

interface StepMeta {
  key: AgentType;
  label: string;
  desc: string;
  icon: React.ElementType;
}

const STEPS: StepMeta[] = [
  { key: 'requirement', label: 'Requirement', desc: 'Feature & constraint extraction', icon: FileText },
  { key: 'design', label: 'Design', desc: 'Architecture & schema design', icon: Compass },
  { key: 'rag', label: 'RAG', desc: 'Technical documentation retrieval', icon: Database },
  { key: 'code', label: 'Code', desc: 'Multi-file source synthesis', icon: Code2 },
  { key: 'execution', label: 'Execution', desc: 'Isolated VM sandbox bootstrapping', icon: Box },
  { key: 'testing', label: 'Testing', desc: 'Automated test harness verification', icon: CheckCircle2 },
  { key: 'debug', label: 'Debugging', desc: 'Auto-repair genuine defects', icon: Wrench },
  { key: 'completed', label: 'Completed', desc: 'Live preview application ready', icon: Sparkles },
];

export const AgentMonitorTab: React.FC<AgentMonitorTabProps> = ({
  activeAgent,
  agentProgress,
  overallStatus,
  testReport,
  debugAttempts,
}) => {
  const totalTests = testReport?.totalTests || 0;
  const passedTests = testReport?.passed || 0;
  const failedTests = testReport?.failed || 0;
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  const executionTime = testReport?.durationMs || 0;

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100 overflow-y-auto p-4 sm:p-6 space-y-6 select-none">
      {/* ======================================================== */}
      {/* 1. AGENT WORKFLOW CARDS AT THE TOP                       */}
      {/* ======================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Autonomous Agent Workflow
            </h3>
          </div>

          <span
            className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase font-bold ${
              overallStatus === 'generating'
                ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/60 animate-pulse'
                : overallStatus === 'completed'
                ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            Status: {overallStatus}
          </span>
        </div>

        {/* Responsive Grid of Compact Agent Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                className={`p-3 rounded-lg border flex flex-col justify-between transition ${
                  isRunning
                    ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/30'
                    : isCompleted
                    ? 'bg-slate-900/90 border-emerald-800/80 text-slate-200'
                    : isFailed
                    ? 'bg-rose-950/60 border-rose-800 text-slate-200'
                    : isSkipped
                    ? 'bg-slate-900/40 border-slate-800 text-slate-500'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center ${
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
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isCompleted ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : isFailed ? (
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                      isRunning
                        ? 'bg-indigo-500 text-white'
                        : isCompleted
                        ? 'bg-emerald-900/50 text-emerald-300'
                        : isFailed
                        ? 'bg-rose-900/50 text-rose-300'
                        : isSkipped
                        ? 'bg-slate-800 text-slate-500'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isSkipped ? 'skipped' : prog.status}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold tracking-tight text-slate-100 block truncate">
                    {step.label}
                  </span>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {prog.message || step.desc}
                  </p>
                </div>

                {step.key === 'debug' && isSkipped && (
                  <div className="text-[9px] text-emerald-400/90 mt-1.5 font-mono">
                    ✓ Clean run (0 defects)
                  </div>
                )}
                {step.key === 'debug' && isCompleted && (
                  <div className="text-[9px] text-amber-300 mt-1.5 font-mono">
                    ✓ Defect auto-repaired
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SANDBOX METRICS SECTION BELOW AGENT CARDS             */}
      {/* ======================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Sandbox &amp; Execution Metrics
            </h3>
          </div>

          {executionTime > 0 && (
            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
              <Clock className="w-3 h-3" />
              {executionTime}ms
            </span>
          )}
        </div>

        {/* Test Pass Rate Progress Bar */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 font-semibold">Test Pass Rate</span>
            <span className={passRate === 100 ? 'text-emerald-400 font-bold' : 'text-slate-200'}>
              {passRate}%
            </span>
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
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

        {/* 4-Column Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-center">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Passed</span>
            <span className="text-lg font-mono font-bold text-emerald-400 mt-0.5 block">
              {passedTests} / {totalTests}
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-center">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Failed</span>
            <span className={`text-lg font-mono font-bold mt-0.5 block ${failedTests > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {failedTests}
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-center">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Debug Attempts</span>
            <span className="text-lg font-mono font-bold text-slate-200 mt-0.5 block">
              {debugAttempts.length}
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-center">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Sandbox VM</span>
            <span className="text-sm font-mono text-emerald-400 font-bold mt-1 block">
              Isolated VM
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
