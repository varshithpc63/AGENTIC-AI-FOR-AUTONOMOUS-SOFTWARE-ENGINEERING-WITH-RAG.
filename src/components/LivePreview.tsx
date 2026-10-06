import React, { useState, useRef, useEffect } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Terminal,
  AlertCircle,
  Wrench,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface LivePreviewProps {
  previewUrl?: string;
  previewHtml?: string;
  appTitle: string;
  projectId?: string;
  isCompleted: boolean;
  isGenerating: boolean;
  totalTestsPassed: number;
  buildStatus?: 'idle' | 'building' | 'success' | 'failed';
  runtimeStatus?: 'idle' | 'running' | 'stopped' | 'failed';
  buildError?: string;
  runtimeError?: string;
  onRetryBuild?: () => void;
}

interface ConsoleMsg {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  previewUrl,
  previewHtml,
  appTitle,
  projectId,
  isCompleted,
  isGenerating,
  totalTestsPassed,
  buildStatus,
  runtimeStatus,
  buildError,
  runtimeError,
  onRetryBuild,
}) => {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [reloadKey, setReloadKey] = useState(0);
  const [isStopped, setIsStopped] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleMsg[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for live console output from running sandbox application
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PREVIEW_CONSOLE_LOG') {
        const entry: ConsoleMsg = {
          id: Math.random().toString(36).substring(2, 8),
          level: event.data.level || 'info',
          message: event.data.message || '',
          timestamp: event.data.timestamp || new Date().toLocaleTimeString(),
        };
        setConsoleLogs((prev) => [...prev.slice(-99), entry]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleRefresh = () => {
    setIsStopped(false);
    setReloadKey((prev) => prev + 1);
    if (iframeRef.current && previewUrl) {
      iframeRef.current.src = previewUrl + (previewUrl.includes('?') ? '&' : '?') + 'r=' + Date.now();
    }
  };

  const handleRestart = () => {
    setIsStopped(false);
    setConsoleLogs([]);
    setReloadKey((prev) => prev + 1);
    if (iframeRef.current && previewUrl) {
      iframeRef.current.src = previewUrl + (previewUrl.includes('?') ? '&' : '?') + 'reset=' + Date.now();
    }
  };

  const handleToggleRun = async () => {
    const nextStopped = !isStopped;
    setIsStopped(nextStopped);
    if (projectId) {
      try {
        await fetch('/api/project/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            status: nextStopped ? 'stopped' : 'running',
          }),
        });
      } catch (err) {
        console.error('Failed to update project status:', err);
      }
    }
    if (!nextStopped) {
      handleRefresh();
    }
  };

  const handleOpenNewWindow = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    } else if (previewHtml) {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(previewHtml);
        win.document.close();
      }
    }
  };

  const getViewportStyle = () => {
    if (viewport === 'mobile') return 'max-w-[390px]';
    if (viewport === 'tablet') return 'max-w-[768px]';
    return 'w-full';
  };

  // Determine current active status
  const hasBuildError = buildStatus === 'failed' || Boolean(buildError);
  const hasRuntimeError = runtimeStatus === 'failed' || Boolean(runtimeError);
  const isRunning = (previewUrl || previewHtml) && !hasBuildError && !isStopped && !isGenerating;

  const statusLabel = isGenerating
    ? 'Building'
    : hasBuildError
    ? 'Build Failed'
    : hasRuntimeError
    ? 'Runtime Error'
    : isStopped
    ? 'Stopped'
    : isRunning
    ? 'Running'
    : 'Idle';

  const statusBadgeStyle = isGenerating
    ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
    : hasBuildError || hasRuntimeError
    ? 'bg-rose-50 text-rose-700 border-rose-200'
    : isStopped
    ? 'bg-slate-100 text-slate-600 border-slate-200'
    : isRunning
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-slate-100 text-slate-500 border-slate-200';

  const statusDotColor = isGenerating
    ? 'bg-amber-500 animate-pulse'
    : hasBuildError || hasRuntimeError
    ? 'bg-rose-500'
    : isStopped
    ? 'bg-slate-400'
    : isRunning
    ? 'bg-emerald-500'
    : 'bg-slate-400';

  // Idle state (no application yet)
  if (!previewUrl && !previewHtml && !isGenerating && !hasBuildError) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50 select-none">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-2xs">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">No Application Running</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Describe software requirements on the left panel and click &quot;Generate Software&quot;. The autonomous engineer will build and execute your live application here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-100 overflow-hidden">
      {/* Small Toolbar */}
      <div className="h-10 px-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 select-none">
        {/* Left: App Title, Status & Live URL */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 truncate">
            <span className={`w-2 h-2 rounded-full shrink-0 ${statusDotColor}`} />
            <span className="truncate">{appTitle || 'Generated Application'}</span>
          </div>

          <span className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded border ${statusBadgeStyle}`}>
            {statusLabel}
          </span>

          {previewUrl && !hasBuildError && (
            <span className="hidden md:inline-flex items-center font-mono text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 truncate">
              {previewUrl}
            </span>
          )}
        </div>

        {/* Right: Controls & Viewports */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Action buttons */}
          {!hasBuildError && (
            <>
              <button
                onClick={handleToggleRun}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition"
                title={isStopped ? 'Resume application execution' : 'Pause application execution'}
              >
                {isStopped ? (
                  <>
                    <Play className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                    <span className="hidden sm:inline">Run</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 text-slate-600 fill-slate-600" />
                    <span className="hidden sm:inline">Pause</span>
                  </>
                )}
              </button>

              <button
                onClick={handleRestart}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition"
                title="Restart application state"
              >
                <RotateCcw className="w-3 h-3 text-slate-600" />
                <span className="hidden sm:inline">Restart</span>
              </button>

              <button
                onClick={handleRefresh}
                className="p-1 rounded text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
                title="Refresh preview"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setShowConsole(!showConsole)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition ${
                  showConsole
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
                title="Toggle Live Console Logs"
              >
                <Terminal className="w-3 h-3" />
                <span className="hidden sm:inline">Logs</span>
                {consoleLogs.length > 0 && (
                  <span className="text-[9px] font-mono px-1 rounded-full bg-slate-200 text-slate-700">
                    {consoleLogs.length}
                  </span>
                )}
              </button>

              <div className="h-4 w-px bg-slate-200 mx-0.5" />

              {/* Viewport switchers */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200">
                <button
                  onClick={() => setViewport('desktop')}
                  className={`p-1 rounded text-xs transition ${
                    viewport === 'desktop' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Desktop View (100% width)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewport('tablet')}
                  className={`p-1 rounded text-xs transition ${
                    viewport === 'tablet' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Tablet View (768px width)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewport('mobile')}
                  className={`p-1 rounded text-xs transition ${
                    viewport === 'mobile' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Mobile View (390px width)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={handleOpenNewWindow}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition"
                title="Open preview in new browser tab"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="hidden sm:inline">Open</span>
              </button>
            </>
          )}

          {hasBuildError && onRetryBuild && (
            <button
              onClick={onRetryBuild}
              className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 shadow-2xs"
            >
              <Wrench className="w-3 h-3" />
              <span>Retry Build</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Real Compilation or Runtime Error Display */}
        {hasBuildError ? (
          <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-100 overflow-auto">
            <div className="max-w-xl w-full bg-slate-900 border border-rose-800/80 rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-950/80 border border-rose-700/80 flex items-center justify-center text-rose-400 shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Application Build Error</h3>
                  <p className="text-xs text-rose-300/90 mt-0.5">
                    Isolated compiler detected a syntax, import, or bundling failure in the generated source code.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 font-mono text-xs text-rose-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-60">
                {buildError || 'Unknown build failure occurred during compilation.'}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-[11px] text-slate-400 font-mono">
                  Autonomous Debug Agent will inspect this log and repair genuine defects.
                </span>
                {onRetryBuild && (
                  <button
                    onClick={onRetryBuild}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-500 transition shadow-xs"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Run Debug Fix</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : isStopped ? (
          /* Stopped Application State */
          <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-100 text-center">
            <div className="bg-white p-6 rounded-xl border border-slate-200 max-w-sm w-full shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                <Pause className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Application Execution Paused</h3>
              <p className="text-xs text-slate-500">
                The isolated runtime runner is currently stopped. Click below to resume execution.
              </p>
              <button
                onClick={handleToggleRun}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
              >
                Resume Running Application
              </button>
            </div>
          </div>
        ) : (
          /* Live Running Application Canvas */
          <div className="flex-1 p-2 sm:p-4 flex items-center justify-center overflow-auto bg-slate-100">
            <div
              className={`${getViewportStyle()} w-full h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all duration-200`}
            >
              {previewUrl ? (
                <iframe
                  key={`${previewUrl}-${reloadKey}`}
                  ref={iframeRef}
                  src={previewUrl}
                  sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
                  title={appTitle || 'Autonomous Software Execution Live Preview'}
                  className="w-full h-full border-0 bg-white"
                />
              ) : previewHtml ? (
                <iframe
                  key={`html-${reloadKey}`}
                  ref={iframeRef}
                  srcDoc={previewHtml}
                  sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
                  title={appTitle || 'Autonomous Software Live Preview'}
                  className="w-full h-full border-0 bg-white"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Initializing preview container...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collapsible Live Runtime Console Drawer */}
        {showConsole && (
          <div className="h-44 border-t border-slate-800 bg-slate-950 text-slate-200 flex flex-col shrink-0 select-none">
            <div className="h-7 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Terminal className="w-3 h-3 text-indigo-400" />
                <span className="font-mono font-semibold text-[11px] text-slate-300">
                  Live Application Console Stream
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConsoleLogs([])}
                  className="text-[10px] text-slate-400 hover:text-slate-200 font-mono"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowConsole(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-2 font-mono text-[11px] overflow-y-auto space-y-1">
              {consoleLogs.length === 0 ? (
                <div className="text-slate-500 italic py-2">
                  No runtime logs recorded yet. User interactions in the preview will emit logs here.
                </div>
              ) : (
                consoleLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-600 shrink-0 text-[10px]">{log.timestamp}</span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1 rounded shrink-0 ${
                        log.level === 'error'
                          ? 'bg-rose-900/60 text-rose-300'
                          : log.level === 'warn'
                          ? 'bg-amber-900/60 text-amber-300'
                          : 'bg-indigo-900/60 text-indigo-300'
                      }`}
                    >
                      {log.level}
                    </span>
                    <span
                      className={`break-all ${
                        log.level === 'error'
                          ? 'text-rose-300'
                          : log.level === 'warn'
                          ? 'text-amber-300'
                          : 'text-slate-200'
                      }`}
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
