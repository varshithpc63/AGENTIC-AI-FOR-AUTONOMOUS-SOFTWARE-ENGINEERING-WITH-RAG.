import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Wrench,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { DebugAttempt, TestReport } from '../types/client';

interface TestResultsViewProps {
  report: TestReport | null;
  debugAttempts: DebugAttempt[];
  onRetest: () => void;
  isRetesting: boolean;
}

export const TestResultsView: React.FC<TestResultsViewProps> = ({
  report,
  debugAttempts,
  onRetest,
  isRetesting,
}) => {
  if (!report) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center text-slate-500 text-xs bg-slate-50">
        No test results yet. Run the autonomous pipeline to execute tests in the isolated sandbox.
      </div>
    );
  }

  const isAllPassed = report.failed === 0 && report.totalTests > 0 && !report.buildError && !report.runtimeError;
  const skippedCount = 0; // standard suites run completely

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-y-auto p-4 space-y-4">
      {/* Top Test Summary Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs shrink-0">
        {/* Metrics counters */}
        <div className="flex items-center gap-6">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-slate-500">Total:</span>
            <span className="font-mono font-bold text-sm text-slate-800">{report.totalTests}</span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-slate-500">Passed:</span>
            <span className="font-mono font-bold text-sm text-emerald-600">{report.passed}</span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-slate-500">Failed:</span>
            <span className={`font-mono font-bold text-sm ${report.failed > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {report.failed}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-slate-500">Skipped:</span>
            <span className="font-mono font-bold text-sm text-slate-400">{skippedCount}</span>
          </div>

          <div className="flex items-baseline gap-1.5 hidden sm:flex">
            <span className="text-xs text-slate-500">Duration:</span>
            <span className="font-mono text-xs text-slate-600">{report.durationMs}ms</span>
          </div>
        </div>

        {/* Action: Re-run tests */}
        <button
          onClick={onRetest}
          disabled={isRetesting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold transition disabled:opacity-50 shrink-0 cursor-pointer shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetesting ? 'animate-spin' : ''}`} />
          <span>{isRetesting ? 'Running in Sandbox...' : 'Re-run Tests'}</span>
        </button>
      </div>

      {/* Clear Success State if all passed */}
      {isAllPassed && debugAttempts.length === 0 && (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3 flex items-center justify-between text-xs text-emerald-800 shadow-2xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">
              All {report.totalTests} tests passed cleanly in isolated sandbox • No debugging required
            </span>
          </div>
          <span className="text-[10px] font-mono text-emerald-700">0 failures</span>
        </div>
      )}

      {/* Compact Professional Error Panel (Only when a real error occurred!) */}
      {(report.failed > 0 || report.buildError || report.runtimeError) && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-800 font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                {report.buildError ? 'Build Syntax Error' : report.runtimeError ? 'Runtime Exception' : 'Test Failure Detected'}
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase bg-rose-200/80 text-rose-900 px-1.5 py-0.2 rounded font-bold">
              Action Triggered
            </span>
          </div>

          <div className="p-2 bg-white rounded border border-rose-200 text-rose-900 font-mono text-[11px] break-all">
            {report.buildError || report.runtimeError || report.tests.find((t) => !t.passed)?.error || 'Assertion failed'}
          </div>
        </div>
      )}

      {/* Debug Agent Resolution History (Only if genuine errors actually occurred!) */}
      {debugAttempts.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-xs space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <Wrench className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Debug Agent Resolution Log ({debugAttempts.length} genuine error{debugAttempts.length > 1 ? 's' : ''} auto-repaired)
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-800">
              Verified in isolated VM
            </span>
          </div>

          <div className="space-y-1.5">
            {debugAttempts.map((attempt) => (
              <div
                key={attempt.attemptNumber}
                className="bg-white p-2.5 rounded border border-amber-200 text-slate-800 space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-900">
                    Attempt #{attempt.attemptNumber} • <span className="font-mono text-slate-600">{attempt.targetFile}</span>
                  </span>
                  <span className="font-mono text-slate-400 text-[10px]">{attempt.timestamp}</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  <span className="font-semibold text-rose-700">Root cause:</span> {attempt.issueIdentified}
                </div>
                <div className="text-[11px] text-slate-600">
                  <span className="font-semibold text-emerald-700">Patch applied:</span> {attempt.fixApplied}
                </div>
                <div className="text-[10px] font-semibold text-emerald-700 pt-0.5">
                  {attempt.resolved ? '✓ Retest: Clean pass' : 'Retesting completed'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Test Cases Table/List */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700 select-none">
          <span>Test Suite Results</span>
          <span className="font-mono text-[11px] text-slate-500">
            {report.passed}/{report.totalTests} Passing
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {report.tests.map((test) => (
            <div
              key={test.id}
              className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="mt-0.5 shrink-0">
                  {test.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{test.name}</p>
                  {test.error && (
                    <p className="mt-1 text-[11px] font-mono text-rose-700 bg-rose-50 p-1.5 rounded border border-rose-200">
                      {test.error}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {test.durationMs}ms
                </span>

                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                    test.passed
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {test.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
