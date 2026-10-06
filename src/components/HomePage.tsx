import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Play,
  Pause,
  ArrowRight,
  FolderTree,
  CheckCircle2,
  Clock,
  Trash2,
  ExternalLink,
  Code2,
  Layers,
  ShieldCheck,
  Cpu,
  Terminal,
  Activity,
  Search,
  Wand2,
} from 'lucide-react';
import { SavedApp, SamplePrompt } from '../types/client';

interface HomePageProps {
  savedApps: SavedApp[];
  samples: SamplePrompt[];
  onBuildNewApp: (initialPrompt?: string) => void;
  onOpenApp: (savedApp: SavedApp) => void;
  onToggleAppStatus: (appId: string, currentStatus: string) => void;
  onDeleteApp: (appId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  savedApps,
  samples,
  onBuildNewApp,
  onOpenApp,
  onToggleAppStatus,
  onDeleteApp,
}) => {
  const [quickPrompt, setQuickPrompt] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleQuickBuild = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickPrompt.trim();
    if (trimmed) {
      onBuildNewApp(trimmed);
    } else {
      onBuildNewApp();
    }
  };

  const filteredApps = savedApps.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = app.project.requirements?.appTitle || app.project.userPrompt;
    const desc = app.project.requirements?.summary || app.project.userPrompt;
    return title.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 select-none">
      {/* ======================================================== */}
      {/* 1. HERO SECTION                                          */}
      {/* ======================================================== */}
      <section className="relative border-b border-slate-800/80 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950 px-4 sm:px-8 pt-12 pb-16">
        {/* Glow ambient decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-56 bg-indigo-500/10 blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Autonomous Software Engineering Platform</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Build Real Software with{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
              AI App Builder
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Describe what you want in plain English. Gemini architectures, writes real React &amp; TypeScript code, runs in an isolated sandbox, tests, and serves live interactive previews.
          </p>

          {/* Interactive Prompt & Build Form */}
          <div className="max-w-2xl mx-auto pt-2">
            <form
              onSubmit={handleQuickBuild}
              className="bg-slate-900/90 border border-slate-700/80 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 rounded-2xl p-2 sm:p-2.5 flex flex-col sm:flex-row items-center gap-2 shadow-2xl transition"
            >
              <div className="flex items-center gap-2 px-3 w-full sm:flex-1">
                <Code2 className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={quickPrompt}
                  onChange={(e) => setQuickPrompt(e.target.value)}
                  placeholder="Describe an app to build (e.g. 'Calculator with calculation history')..."
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none py-1.5 select-text"
                />
              </div>

              {/* Prominent "Build" Button */}
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:from-indigo-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/30 shrink-0 cursor-pointer"
                title="Create a new application and open App Builder"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Build</span>
              </button>
            </form>

            {/* Quick Inspiration Chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3">
              <span className="text-[11px] text-slate-500 mr-1">Try:</span>
              {samples.slice(0, 3).map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => onBuildNewApp(sample.prompt)}
                  className="px-2.5 py-1 text-[11px] font-mono bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. YOUR APPS / RECENT BUILDS SECTION                     */}
      {/* ======================================================== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Your Apps &amp; Recent Builds
              </h2>
              <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                {savedApps.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any app to resume building, modify features, or test in Live Preview.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {savedApps.length > 0 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your apps..."
                  className="bg-slate-900 border border-slate-800 focus:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none w-48 sm:w-56 select-text"
                />
              </div>
            )}

            <button
              onClick={() => onBuildNewApp()}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer shrink-0"
              title="Start a new application from scratch"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New App</span>
            </button>
          </div>
        </div>

        {/* Empty State when no apps created yet */}
        {savedApps.length === 0 && (
          <div className="py-16 px-4 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-indigo-400 mx-auto">
              <Code2 className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-sm font-bold text-slate-200">No applications built yet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Click “Build” above or choose a sample template to start generating your first full-stack application.
              </p>
            </div>
            <button
              onClick={() => onBuildNewApp()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 shadow-md cursor-pointer transition"
            >
              <Plus className="w-4 h-4" />
              <span>Build Your First App</span>
            </button>
          </div>
        )}

        {/* Saved Apps Grid */}
        {savedApps.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredApps.map((savedApp) => {
              const { project, lastUpdated } = savedApp;
              const title = project.requirements?.appTitle || 'Generated Application';
              const summary = project.requirements?.summary || project.userPrompt;
              const isPaused = project.runtimeStatus === 'stopped';
              const isRunning = project.runtimeStatus === 'running' || project.buildStatus === 'success';
              const totalTests = project.testReport?.totalTests || 0;
              const passedTests = project.testReport?.passed || 0;
              const fileCount = project.files?.length || 0;

              return (
                <div
                  key={project.id}
                  className="group rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-950/20 transition-all flex flex-col overflow-hidden select-none"
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-slate-800/70 flex items-start justify-between gap-3 bg-slate-950/40">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white tracking-tight truncate group-hover:text-indigo-300 transition">
                          {title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {lastUpdated}
                        </span>
                        <span>•</span>
                        <span className="uppercase text-slate-500 font-bold">
                          {project.projectType || 'React'}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {isPaused ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800/60">
                          <Pause className="w-2.5 h-2.5 fill-amber-300" />
                          <span>PAUSED</span>
                        </span>
                      ) : isRunning ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>RUNNING</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          <span>READY</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body / Description */}
                  <div className="p-4 flex-1 space-y-3">
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {summary}
                    </p>

                    {/* App Stats Row */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-center gap-2 text-xs">
                        <FolderTree className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-500 block leading-none">Files</span>
                          <span className="font-mono font-bold text-slate-200">{fileCount} generated</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-500 block leading-none">Sandbox Tests</span>
                          <span className="font-mono font-bold text-slate-200">
                            {passedTests}/{totalTests} passed
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-3 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenApp(savedApp)}
                      className="flex-1 py-2 px-3 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 active:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                      title="Open application in App Builder"
                    >
                      <span>Open Builder</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Pause / Resume Button */}
                    <button
                      type="button"
                      onClick={() => onToggleAppStatus(project.id, project.runtimeStatus || 'running')}
                      className={`p-2 rounded-lg border text-xs transition cursor-pointer ${
                        isPaused
                          ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'
                          : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
                      }`}
                      title={isPaused ? 'Resume App Execution' : 'Pause App Execution'}
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5 fill-emerald-400" /> : <Pause className="w-3.5 h-3.5 fill-amber-400" />}
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => onDeleteApp(project.id)}
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-950/80 border border-slate-700/80 hover:border-rose-800/80 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                      title="Delete saved app"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* 3. PLATFORM CAPABILITIES SECTION                         */}
      {/* ======================================================== */}
      <section className="border-t border-slate-800/80 bg-slate-900/40 px-4 sm:px-8 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Enterprise Autonomous Architecture
            </h3>
            <p className="text-xs text-slate-400">
              Complete development lifecycle executed automatically in isolated environments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Isolated VM Sandbox</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Compiles source trees with real esbuild bundlers and runs test assertions inside memory-isolated sandboxes.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Self-Healing Debug Agent</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Detects genuine compiler errors, runtime exceptions, and failing unit tests, repairing source code automatically.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Wand2 className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Iterative Conversational Modifications</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Modify any existing application by prompt. Gemini remembers the entire codebase, applying surgical updates.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
