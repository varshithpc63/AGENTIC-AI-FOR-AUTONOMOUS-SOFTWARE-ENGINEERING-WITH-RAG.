import React from 'react';
import {
  Cpu,
  ShieldCheck,
  Database,
  Menu,
  X,
  Home,
  Code2,
  Plus,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

interface HeaderProps {
  currentView: 'home' | 'builder';
  onNavigate: (view: 'home' | 'builder') => void;
  onOpenKnowledgeBase: () => void;
  onBuildNewApp: () => void;
  activeAppTitle?: string;
  status: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenKnowledgeBase,
  onBuildNewApp,
  activeAppTitle,
  status,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white h-12 flex items-center px-3 sm:px-4 shrink-0 select-none z-30">
      <div className="flex items-center justify-between w-full gap-2">
        {/* Left: Logo, Navigation, and Current Context */}
        <div className="flex items-center gap-3 min-w-0">
          {currentView === 'builder' && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white shrink-0 cursor-pointer"
              title="Toggle Sidebar"
            >
              {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          )}

          {/* Logo & Brand */}
          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition shrink-0"
            title="Go to Home"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-sm">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm tracking-tight text-white hidden xs:inline-block">
                AI App Builder
              </span>
              <span className="hidden lg:inline-block text-[10px] font-mono bg-slate-800 text-indigo-300 border border-slate-700 px-1.5 py-0.2 rounded-md">
                gemini-3.8-flash
              </span>
            </div>
          </div>

          {/* View Navigation Switcher */}
          <div className="hidden sm:flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 ml-1">
            <button
              onClick={() => onNavigate('home')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                currentView === 'home'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => onNavigate('builder')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                currentView === 'builder'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>App Builder</span>
              {activeAppTitle && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 ml-0.5" />
              )}
            </button>
          </div>

          {/* If inside builder, show active app title */}
          {currentView === 'builder' && activeAppTitle && (
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-400 border-l border-slate-800 pl-3">
              <span className="text-[11px] text-slate-500">Editing:</span>
              <span className="font-mono text-slate-200 truncate max-w-[180px]">
                {activeAppTitle}
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick Action Buttons & Status Indicators */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Build New App CTA Button */}
          <button
            onClick={() => onBuildNewApp()}
            className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
            title="Create a new application"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden xs:inline">Build</span>
          </button>

          {/* Sandbox Indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sandbox VM</span>
          </div>

          {/* RAG Knowledge Base */}
          <button
            onClick={onOpenKnowledgeBase}
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 hover:text-white transition cursor-pointer"
            title="Inspect RAG Technical Knowledge Base"
          >
            <Database className="w-3 h-3 text-sky-400" />
            <span>RAG Docs</span>
          </button>

          {/* Status Dot */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-300">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                status === 'generating'
                  ? 'bg-amber-400 animate-pulse'
                  : status === 'completed'
                  ? 'bg-emerald-400'
                  : 'bg-slate-400'
              }`}
            />
            <span className="capitalize hidden xs:inline">{status}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
