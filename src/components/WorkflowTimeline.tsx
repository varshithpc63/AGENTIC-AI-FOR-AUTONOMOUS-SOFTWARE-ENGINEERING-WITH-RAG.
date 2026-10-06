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
  AlertCircle,
  MinusCircle,
} from 'lucide-react';
import { AgentType } from '../types/client';

interface WorkflowTimelineProps {
  activeAgent: AgentType | null;
  agentProgress: Record<AgentType, { status: string; message?: string }>;
  overallStatus: string;
}

interface StepMeta {
  key: AgentType;
  title: string;
  desc: string;
  icon: React.ElementType;
}

const STEPS: StepMeta[] = [
  { key: 'requirement', title: '1. Requirement Agent', desc: 'Features & constraints', icon: FileText },
  { key: 'design', title: '2. Design Agent', desc: 'Architecture & schema', icon: Compass },
  { key: 'rag', title: '3. RAG Retrieval', desc: 'Technical knowledge docs', icon: Database },
  { key: 'code', title: '4. Code Agent', desc: 'Multi-file codebase', icon: Code2 },
  { key: 'execution', title: '5. Execution', desc: 'Isolated VM sandbox', icon: Box },
  { key: 'testing', title: '6. Testing Agent', desc: 'Automated test suite', icon: CheckCircle2 },
  { key: 'debug', title: '7. Debug Agent', desc: 'Auto-fix genuine errors', icon: Wrench },
  { key: 'completed', title: '8. Completed', desc: 'Live preview ready', icon: Sparkles },
];

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({
  activeAgent,
  agentProgress,
  overallStatus,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Autonomous Agent Workflow</h2>
          <p className="text-xs text-slate-500">Autonomous multi-agent execution pipeline with zero artificial bugs</p>
        </div>
        {overallStatus === 'generating' && (
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Agent Active: {activeAgent?.toUpperCase()}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {STEPS.map((step) => {
          const prog = agentProgress[step.key] || { status: 'idle' };
          const isRunning = prog.status === 'running';
          const isCompleted = prog.status === 'completed';
          const isFailed = prog.status === 'failed';
          const isSkipped = prog.status === 'skipped';
          const isIdle = prog.status === 'idle';

          const IconComponent = step.icon;

          return (
            <div
              key={step.key}
              className={`relative flex flex-col p-3 rounded-xl border transition-all text-left ${
                isRunning
                  ? 'border-indigo-400 bg-indigo-50/60 shadow-xs ring-2 ring-indigo-500/20'
                  : isCompleted
                  ? 'border-emerald-200 bg-emerald-50/40 text-slate-800'
                  : isFailed
                  ? 'border-rose-300 bg-rose-50 text-slate-800'
                  : isSkipped
                  ? 'border-slate-200 bg-slate-50/70 text-slate-400'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                    isRunning
                      ? 'bg-indigo-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isFailed
                      ? 'bg-rose-600 text-white'
                      : isSkipped
                      ? 'bg-slate-200 text-slate-500'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isRunning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isFailed ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : isSkipped ? (
                    <MinusCircle className="w-4 h-4" />
                  ) : (
                    <IconComponent className="w-4 h-4" />
                  )}
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    isRunning
                      ? 'bg-indigo-100 text-indigo-700'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-800'
                      : isFailed
                      ? 'bg-rose-100 text-rose-800'
                      : isSkipped
                      ? 'bg-slate-200 text-slate-600'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isSkipped ? 'Skipped' : prog.status}
                </span>
              </div>

              <p className="text-xs font-bold tracking-tight text-slate-900 leading-tight">
                {step.title.replace(/^\d+\.\s*/, '')}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                {step.desc}
              </p>

              {step.key === 'debug' && isSkipped && (
                <span className="text-[10px] text-emerald-600 font-medium mt-1">
                  ✓ Clean run (no bugs)
                </span>
              )}

              {step.key === 'debug' && isCompleted && (
                <span className="text-[10px] text-amber-700 font-medium mt-1">
                  ✓ Genuine error fixed
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
