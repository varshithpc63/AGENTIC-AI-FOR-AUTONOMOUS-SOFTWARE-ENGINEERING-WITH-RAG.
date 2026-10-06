import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon,
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { AgentLogEntry } from '../types/client';

interface TerminalPanelProps {
  logs: AgentLogEntry[];
  onClearLogs?: () => void;
  status: string;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  logs,
  onClearLogs,
  status,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [height, setHeight] = useState(190);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleCopy = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.agent.toUpperCase()}] [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Drag resizer
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;

    const startY = e.clientY;
    const startHeight = height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaY = startY - moveEvent.clientY;
      const newHeight = Math.min(380, Math.max(120, startHeight + deltaY));
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      style={{ height: isCollapsed ? '32px' : `${height}px` }}
      className="border-t border-slate-800 bg-slate-950 text-slate-200 flex flex-col shrink-0 select-none transition-[height] duration-150 relative"
    >
      {/* Resizer Handle */}
      {!isCollapsed && (
        <div
          onMouseDown={handleMouseDown}
          className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize hover:bg-indigo-500/40 z-10"
          title="Drag to resize terminal"
        />
      )}

      {/* Terminal Title Bar */}
      <div className="h-8 px-3 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] font-mono font-semibold text-slate-200">
            Developer Console &amp; Execution Output
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
            node:vm sandbox [isolated]
          </span>
        </div>

        {/* Small Controls */}
        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer mr-1">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-500 w-3 h-3"
            />
            <span>Auto-scroll</span>
          </label>

          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Copy all terminal output"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>

          {onClearLogs && (
            <button
              onClick={onClearLogs}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
              title="Clear terminal"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition ml-1"
            title={isCollapsed ? 'Expand terminal' : 'Collapse terminal'}
          >
            {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Output Scroll Area */}
      {!isCollapsed && (
        <div className="flex-1 p-2.5 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1 select-text">
          {logs.length === 0 ? (
            <div className="text-slate-500 italic">
              [SYSTEM] Terminal ready. Waiting for autonomous pipeline execution...
            </div>
          ) : (
            logs.map((log) => {
              const isError = log.level === 'error';
              const isWarn = log.level === 'warn';
              const isSuccess = log.level === 'success';

              return (
                <div key={log.id} className="flex items-start gap-2 hover:bg-slate-900/40 px-1 py-0.5 rounded">
                  <span className="text-slate-600 select-none text-[10px] shrink-0 pt-0.5 font-mono">
                    {log.timestamp}
                  </span>
                  <span
                    className={`text-[9px] uppercase font-bold px-1 rounded shrink-0 select-none ${
                      log.agent === 'execution'
                        ? 'bg-indigo-900/60 text-indigo-300'
                        : log.agent === 'testing'
                        ? 'bg-cyan-900/60 text-cyan-300'
                        : log.agent === 'debug'
                        ? 'bg-rose-900/60 text-rose-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {log.agent}
                  </span>
                  <div
                    className={`flex-1 break-all ${
                      isError
                        ? 'text-rose-400 font-semibold'
                        : isWarn
                        ? 'text-amber-400'
                        : isSuccess
                        ? 'text-emerald-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {log.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};
