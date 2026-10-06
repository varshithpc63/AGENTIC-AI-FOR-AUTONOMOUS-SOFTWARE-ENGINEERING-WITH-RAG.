import React, { useEffect, useState, useRef } from 'react';
import {
  Activity,
  Monitor,
  FolderTree,
  CheckCircle2,
  FileText,
  Terminal,
  AlertTriangle,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { PromptWorkspace } from './components/PromptWorkspace';
import { AgentMonitorTab } from './components/AgentMonitorTab';
import { TerminalPanel } from './components/TerminalPanel';
import { LivePreview } from './components/LivePreview';
import { CodeViewer } from './components/CodeViewer';
import { TestResultsView } from './components/TestResultsView';
import { AgentArtifactsView } from './components/AgentArtifactsView';
import { ActivityLogsView } from './components/ActivityLogsView';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';
import {
  SamplePrompt,
  SoftwareProject,
  ChatMessage,
  ActivityStep,
  SavedApp,
  GeneratedFile,
  AgentType,
} from './types/client';

type TabType = 'monitor' | 'preview' | 'code' | 'tests' | 'artifacts' | 'logs';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'builder'>('home');
  const [samples, setSamples] = useState<SamplePrompt[]>([]);
  const [project, setProject] = useState<SoftwareProject | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [savedApps, setSavedApps] = useState<SavedApp[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('preview');
  const [isKbModalOpen, setIsKbModalOpen] = useState(false);
  const [isRetesting, setIsRetesting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Resizable panel width state (default: ~42% left, ~58% right)
  const [leftWidthPercent, setLeftWidthPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ase_panel_split');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 25 && val <= 65) return val;
      }
    } catch {}
    return 42;
  });

  const isDraggingDividerRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load sample prompts and saved apps from storage on mount
  useEffect(() => {
    fetch('/api/samples')
      .then((res) => res.json())
      .then((data) => {
        if (data.samples) {
          setSamples(data.samples);
        }
      })
      .catch((err) => console.error('Failed to fetch samples:', err));

    // Load saved apps from localStorage
    try {
      const stored = localStorage.getItem('ase_saved_apps');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedApps(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not parse stored apps:', e);
    }
  }, []);

  // Helper to persist saved apps to localStorage
  const persistSavedApps = (apps: SavedApp[]) => {
    setSavedApps(apps);
    try {
      localStorage.setItem('ase_saved_apps', JSON.stringify(apps));
    } catch (e) {
      console.warn('Failed to save apps to localStorage:', e);
    }
  };

  // Upsert project into saved apps list
  const upsertSavedApp = (proj: SoftwareProject, msgs: ChatMessage[]) => {
    setSavedApps((prev) => {
      const existingIdx = prev.findIndex((a) => a.project.id === proj.id);
      const entry: SavedApp = {
        project: proj,
        messages: msgs,
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      let updatedList: SavedApp[];
      if (existingIdx !== -1) {
        updatedList = [...prev];
        updatedList[existingIdx] = entry;
      } else {
        updatedList = [entry, ...prev];
      }

      try {
        localStorage.setItem('ase_saved_apps', JSON.stringify(updatedList));
      } catch {}
      return updatedList;
    });
  };

  const handleSelectSample = (sample: SamplePrompt) => {
    // Loaded into prompt workspace
  };

  // Draggable divider event handlers
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingDividerRef.current = true;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingDividerRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newPercent = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(65, Math.max(25, newPercent));
      setLeftWidthPercent(clamped);
      try {
        localStorage.setItem('ase_panel_split', clamped.toFixed(1));
      } catch {}
    };

    const handleMouseUp = () => {
      isDraggingDividerRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Compute live activity steps from active agent progress
  const getCurrentSteps = (
    prog?: Record<string, { status: string; message?: string }>,
    isMod?: boolean
  ): ActivityStep[] => {
    if (!prog) return [];

    if (isMod) {
      const steps: ActivityStep[] = [
        {
          agent: 'requirement',
          label: 'Analyzing modification request...',
          status: (prog.requirement?.status as any) || 'pending',
        },
        {
          agent: 'code',
          label: 'Updating project files & components...',
          status: (prog.code?.status as any) || 'pending',
        },
        {
          agent: 'execution',
          label: 'Compiling & bundling application...',
          status: (prog.execution?.status as any) || 'pending',
        },
        {
          agent: 'testing',
          label: 'Executing tests in sandbox...',
          status: (prog.testing?.status as any) || 'pending',
        },
      ];

      if (prog.debug?.status === 'running' || prog.debug?.status === 'completed' || prog.debug?.status === 'failed') {
        steps.push({
          agent: 'debug',
          label: 'Debugging & fixing errors...',
          status: (prog.debug?.status as any) || 'pending',
        });
      }

      steps.push({
        agent: 'completed',
        label: 'Preview ready',
        status: (prog.completed?.status as any) || 'pending',
      });

      return steps;
    }

    const steps: ActivityStep[] = [
      {
        agent: 'requirement',
        label: 'Analyzing requirement...',
        status: (prog.requirement?.status as any) || 'pending',
      },
      {
        agent: 'design',
        label: 'Designing application architecture...',
        status: (prog.design?.status as any) || 'pending',
      },
      {
        agent: 'rag',
        label: 'Retrieving RAG technical knowledge...',
        status: (prog.rag?.status as any) || 'pending',
      },
      {
        agent: 'code',
        label: 'Generating code & test suite...',
        status: (prog.code?.status as any) || 'pending',
      },
      {
        agent: 'execution',
        label: 'Bootstrapping isolated VM sandbox...',
        status: (prog.execution?.status as any) || 'pending',
      },
      {
        agent: 'testing',
        label: 'Executing tests in sandbox...',
        status: (prog.testing?.status as any) || 'pending',
      },
    ];

    if (prog.debug?.status === 'running' || prog.debug?.status === 'completed' || prog.debug?.status === 'failed') {
      steps.push({
        agent: 'debug',
        label: 'Debugging & fixing errors...',
        status: (prog.debug?.status as any) || 'pending',
      });
    }

    steps.push({
      agent: 'completed',
      label: 'Preview ready',
      status: (prog.completed?.status as any) || 'pending',
    });

    return steps;
  };

  // Build New App from Home or Navbar
  const handleBuildNewApp = (initialPrompt?: string) => {
    setProject(null);
    setMessages([]);
    setErrorBanner(null);
    setActiveTab('preview');
    setCurrentView('builder');

    if (initialPrompt && initialPrompt.trim()) {
      setTimeout(() => {
        handleSubmitPrompt(initialPrompt.trim());
      }, 50);
    }
  };

  // Open existing app from Home Page cards
  const handleOpenApp = (savedApp: SavedApp) => {
    setProject(savedApp.project);
    setMessages(savedApp.messages || []);
    setErrorBanner(null);
    setActiveTab('preview');
    setCurrentView('builder');
  };

  // Toggle Run / Pause status for an app
  const handleToggleAppStatus = async (appId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'stopped' ? 'running' : 'stopped';
    try {
      await fetch('/api/project/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: appId, status: nextStatus }),
      });

      // Update in savedApps
      setSavedApps((prev) => {
        const updated = prev.map((a) => {
          if (a.project.id === appId) {
            return {
              ...a,
              project: {
                ...a.project,
                runtimeStatus: nextStatus as any,
              },
            };
          }
          return a;
        });
        try {
          localStorage.setItem('ase_saved_apps', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // If active project is this one, update local state
      if (project && project.id === appId) {
        setProject((prev) => (prev ? { ...prev, runtimeStatus: nextStatus as any } : null));
      }
    } catch (err) {
      console.error('Failed to toggle app status:', err);
    }
  };

  // Delete saved app
  const handleDeleteApp = (appId: string) => {
    const updated = savedApps.filter((a) => a.project.id !== appId);
    persistSavedApps(updated);
    if (project && project.id === appId) {
      setProject(null);
      setMessages([]);
    }
  };

  // Unified Submit prompt handler (Auto-detects whether to generate a new app or modify current app)
  const handleSubmitPrompt = (text: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const hasActiveProject = Boolean(project && project.files && project.files.length > 0);
    const action: 'generate' | 'modify' = hasActiveProject ? 'modify' : 'generate';

    // Add user message to conversation history
    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      actionType: action,
      text,
      timestamp,
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    if (action === 'generate') {
      runGeneratePipeline(text, updatedMessages);
    } else {
      runModifyPipeline(text, updatedMessages);
    }
  };

  // Execute full autonomous generation pipeline
  const runGeneratePipeline = (promptText: string, currentMsgs: ChatMessage[]) => {
    setIsGenerating(true);
    setErrorBanner(null);
    setActiveTab('monitor');

    // Initial project state
    const initialProject: SoftwareProject = {
      id: 'proj-' + Math.random().toString(36).substring(2, 9),
      userPrompt: promptText,
      requirements: null,
      design: null,
      ragKnowledge: [],
      files: [],
      testReport: null,
      debugAttempts: [],
      previewHtml: '',
      status: 'generating',
      activeAgent: 'requirement',
      agentProgress: {
        requirement: { status: 'running', message: 'Analyzing requirements...' },
        design: { status: 'idle' },
        rag: { status: 'idle' },
        code: { status: 'idle' },
        execution: { status: 'idle' },
        testing: { status: 'idle' },
        debug: { status: 'idle' },
        completed: { status: 'idle' },
      },
      logs: [
        {
          id: 'log-0',
          agent: 'requirement',
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          message: 'Autonomous Software Engineer pipeline initialized.',
        },
      ],
      createdAt: new Date().toISOString(),
    };
    setProject(initialProject);

    // Connect to Server-Sent Events stream
    const eventSource = new EventSource(`/api/generate-stream?prompt=${encodeURIComponent(promptText)}`);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === 'update' && payload.project) {
          setProject(payload.project);
        } else if (payload.type === 'complete' && payload.project) {
          const finalProj = payload.project as SoftwareProject;
          setProject(finalProj);
          setIsGenerating(false);
          eventSource.close();
          setActiveTab('preview');

          // Append completed system message to conversation history
          const finalSteps = getCurrentSteps(finalProj.agentProgress, false);
          const passedCount = finalProj.testReport?.passed || 0;
          const totalCount = finalProj.testReport?.totalTests || 0;
          const appTitle = finalProj.requirements?.appTitle || 'Application';

          const sysMsg: ChatMessage = {
            id: 'sys-' + Date.now(),
            sender: 'system',
            actionType: 'generate',
            text: `✓ Built "${appTitle}" successfully! All ${passedCount}/${totalCount} tests passed in isolated sandbox. Live Preview ready.`,
            timestamp: new Date().toLocaleTimeString(),
            steps: finalSteps,
            isComplete: true,
          };
          const allMsgs = [...currentMsgs, sysMsg];
          setMessages(allMsgs);
          upsertSavedApp(finalProj, allMsgs);
        } else if (payload.type === 'error') {
          setErrorBanner(payload.error || 'Pipeline encountered an unexpected error.');
          setIsGenerating(false);
          eventSource.close();

          const errorMsg: ChatMessage = {
            id: 'sys-err-' + Date.now(),
            sender: 'system',
            actionType: 'generate',
            text: `✕ Error: ${payload.error || 'Pipeline failed'}`,
            timestamp: new Date().toLocaleTimeString(),
            isComplete: true,
          };
          const allMsgs = [...currentMsgs, errorMsg];
          setMessages(allMsgs);
        }
      } catch (err) {
        console.error('Failed to parse SSE payload:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('SSE stream closed or error:', err);
      setIsGenerating(false);
      eventSource.close();
    };
  };

  // Execute surgical modification pipeline on existing project
  const runModifyPipeline = (instructionText: string, currentMsgs: ChatMessage[]) => {
    if (!project) return;

    setIsModifying(true);
    setErrorBanner(null);

    const eventSource = new EventSource(
      `/api/modify-stream?projectId=${encodeURIComponent(project.id)}&instruction=${encodeURIComponent(instructionText)}`
    );

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === 'update' && payload.project) {
          setProject(payload.project);
        } else if (payload.type === 'complete' && payload.project) {
          const finalProj = payload.project as SoftwareProject;
          setProject(finalProj);
          setIsModifying(false);
          eventSource.close();
          setActiveTab('preview');

          // Append completed system message to conversation history
          const finalSteps = getCurrentSteps(finalProj.agentProgress, true);
          const passedCount = finalProj.testReport?.passed || 0;
          const totalCount = finalProj.testReport?.totalTests || 0;

          const sysMsg: ChatMessage = {
            id: 'sys-' + Date.now(),
            sender: 'system',
            actionType: 'modify',
            text: `✓ Modification applied and verified: "${instructionText}". Sandbox tests: ${passedCount}/${totalCount} passed. Live Preview updated.`,
            timestamp: new Date().toLocaleTimeString(),
            steps: finalSteps,
            isComplete: true,
          };
          const allMsgs = [...currentMsgs, sysMsg];
          setMessages(allMsgs);
          upsertSavedApp(finalProj, allMsgs);
        } else if (payload.type === 'error') {
          setErrorBanner(payload.error || 'Modification failed.');
          setIsModifying(false);
          eventSource.close();

          const errorMsg: ChatMessage = {
            id: 'sys-err-' + Date.now(),
            sender: 'system',
            actionType: 'modify',
            text: `✕ Modification error: ${payload.error || 'Failed to modify application'}`,
            timestamp: new Date().toLocaleTimeString(),
            isComplete: true,
          };
          const allMsgs = [...currentMsgs, errorMsg];
          setMessages(allMsgs);
        }
      } catch (err) {
        console.error('Failed to parse modify SSE payload:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('Modify SSE stream error:', err);
      setIsModifying(false);
      eventSource.close();
    };
  };

  // Retest project via test runner API
  const handleRetest = async () => {
    if (!project || !project.files.length) return;
    setIsRetesting(true);
    try {
      const res = await fetch('/api/retest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: project.files }),
      });
      const data = await res.json();
      if (data.report) {
        const updatedProj = { ...project, testReport: data.report };
        setProject(updatedProj);
        upsertSavedApp(updatedProj, messages);
      }
    } catch (err) {
      console.error('Retest failed:', err);
    } finally {
      setIsRetesting(false);
    }
  };

  // Update files directly from Code Editor
  const handleUpdateFiles = async (updatedFiles: GeneratedFile[]) => {
    if (!project) return;
    try {
      const res = await fetch('/api/update-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, files: updatedFiles }),
      });
      const data = await res.json();
      if (data.project) {
        setProject(data.project);
        upsertSavedApp(data.project, messages);
      }
    } catch (err) {
      console.error('Failed to save code files:', err);
    }
  };

  const defaultProgress: Record<AgentType, { status: string; message?: string }> = {
    requirement: { status: 'idle' },
    design: { status: 'idle' },
    rag: { status: 'idle' },
    code: { status: 'idle' },
    execution: { status: 'idle' },
    testing: { status: 'idle' },
    debug: { status: 'idle' },
    completed: { status: 'idle' },
  };

  const appStatus = isGenerating || isModifying ? 'generating' : project?.status || 'idle';
  const testReport = project?.testReport || null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Top Navbar */}
      <Header
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenKnowledgeBase={() => setIsKbModalOpen(true)}
        onBuildNewApp={() => handleBuildNewApp()}
        activeAppTitle={project?.requirements?.appTitle}
        status={appStatus}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* VIEW 1: HOME PAGE */}
      {currentView === 'home' && (
        <HomePage
          savedApps={savedApps}
          samples={samples}
          onBuildNewApp={handleBuildNewApp}
          onOpenApp={handleOpenApp}
          onToggleAppStatus={handleToggleAppStatus}
          onDeleteApp={handleDeleteApp}
        />
      )}

      {/* VIEW 2: APP BUILDER WORKSPACE */}
      {currentView === 'builder' && (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Sub-Header Banner with Back to Home & App Title */}
          <div className="h-9 bg-slate-950/90 border-b border-slate-800/80 px-3 sm:px-4 flex items-center justify-between text-xs shrink-0 select-none">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('home')}
                className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition cursor-pointer"
                title="Return to Home Page"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="font-semibold">Home</span>
              </button>

              <span className="text-slate-700">•</span>

              <span className="text-slate-300 font-bold truncate max-w-xs sm:max-w-md">
                {project?.requirements?.appTitle || 'New Application'}
              </span>

              {project && (
                <span
                  className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold ${
                    project.runtimeStatus === 'stopped'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : project.runtimeStatus === 'running'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {project.runtimeStatus || 'Ready'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBuildNewApp()}
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-xs font-semibold px-2 py-0.5 rounded hover:bg-slate-800 transition cursor-pointer"
                title="Start a fresh application"
              >
                <Plus className="w-3 h-3" />
                <span>+ New App</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorBanner && (
            <div className="bg-rose-950 border-b border-rose-800 px-4 py-2 text-rose-200 text-xs flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorBanner}</span>
              </div>
              <button
                onClick={() => setErrorBanner(null)}
                className="text-rose-400 hover:text-white text-xs underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Main Two-Panel Resizable Workspace */}
          <div
            ref={containerRef}
            className="flex-1 flex flex-row overflow-hidden relative"
          >
            {/* ======================================================== */}
            {/* LEFT PANEL: Dedicated Conversational AI Prompt Workspace */}
            {/* ======================================================== */}
            <div
              style={{ width: `${leftWidthPercent}%` }}
              className={`${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
              } fixed md:static inset-y-12 md:inset-auto z-20 md:z-auto transition-transform md:transition-none duration-200 h-full shrink-0 flex flex-col min-w-[300px] max-w-[65vw]`}
            >
              <PromptWorkspace
                messages={messages}
                currentSteps={
                  isGenerating
                    ? getCurrentSteps(project?.agentProgress, false)
                    : isModifying
                    ? getCurrentSteps(project?.agentProgress, true)
                    : []
                }
                isGenerating={isGenerating}
                isModifying={isModifying}
                hasProject={Boolean(project && project.files && project.files.length > 0)}
                activeAppTitle={project?.requirements?.appTitle}
                samples={samples}
                onSelectSample={handleSelectSample}
                onSubmitPrompt={handleSubmitPrompt}
                onNewApp={() => handleBuildNewApp()}
                onClearHistory={() => setMessages([])}
              />
            </div>

            {/* Mobile backdrop for sidebar */}
            {isSidebarOpen && (
              <div
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/60 z-10 md:hidden"
              />
            )}

            {/* ======================================================== */}
            {/* DRAGGABLE VERTICAL DIVIDER                               */}
            {/* ======================================================== */}
            <div
              onMouseDown={handleDividerMouseDown}
              className="hidden md:flex w-1.5 hover:w-2 bg-slate-800 hover:bg-indigo-500 cursor-col-resize items-center justify-center transition-colors shrink-0 z-10 select-none group"
              title="Drag to resize panels"
            >
              <div className="w-0.5 h-8 bg-slate-600 group-hover:bg-white rounded-full transition-colors" />
            </div>

            {/* ======================================================== */}
            {/* RIGHT PANEL: Main Workspace Tabs + Bottom Terminal       */}
            {/* ======================================================== */}
            <div
              style={{ width: `${100 - leftWidthPercent}%` }}
              className="flex-1 flex flex-col min-w-0 bg-slate-900 overflow-hidden h-full"
            >
              {/* Top Tab Bar */}
              <div className="h-10 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between gap-1 shrink-0 select-none">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {/* TAB 1: Live Preview */}
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition shrink-0 cursor-pointer ${
                      activeTab === 'preview'
                        ? 'bg-slate-800 text-white border-b-2 border-indigo-500 shadow-2xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Live Preview</span>
                    {project?.previewUrl && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
                    )}
                  </button>

                  {/* TAB 2: Agent Monitor */}
                  <button
                    onClick={() => setActiveTab('monitor')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition shrink-0 cursor-pointer ${
                      activeTab === 'monitor'
                        ? 'bg-slate-800 text-white border-b-2 border-indigo-500 shadow-2xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Agent Monitor</span>
                    {isGenerating && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />
                    )}
                  </button>

                  {/* TAB 3: Generated Files */}
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition shrink-0 cursor-pointer ${
                      activeTab === 'code'
                        ? 'bg-slate-800 text-white border-b-2 border-indigo-500 shadow-2xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <FolderTree className="w-3.5 h-3.5" />
                    <span>Generated Files</span>
                    {project?.files.length ? (
                      <span className="text-[10px] font-mono bg-slate-700/80 text-slate-300 px-1.5 py-0.2 rounded-full">
                        {project.files.length}
                      </span>
                    ) : null}
                  </button>

                  {/* TAB 4: Test Results */}
                  <button
                    onClick={() => setActiveTab('tests')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition shrink-0 cursor-pointer ${
                      activeTab === 'tests'
                        ? 'bg-slate-800 text-white border-b-2 border-indigo-500 shadow-2xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Test Results</span>
                    {testReport && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                          testReport.failed === 0
                            ? 'bg-emerald-900/60 text-emerald-300'
                            : 'bg-rose-900/60 text-rose-300'
                        }`}
                      >
                        {testReport.passed}/{testReport.totalTests}
                      </span>
                    )}
                  </button>

                  {/* TAB 5: Specs & Architecture */}
                  <button
                    onClick={() => setActiveTab('artifacts')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition shrink-0 cursor-pointer ${
                      activeTab === 'artifacts'
                        ? 'bg-slate-800 text-white border-b-2 border-indigo-500 shadow-2xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Specs &amp; Architecture</span>
                  </button>

                  {/* TAB 6: Activity & Logs */}
                  <button
                    onClick={() => setActiveTab('logs')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition shrink-0 cursor-pointer ${
                      activeTab === 'logs'
                        ? 'bg-slate-800 text-white border-b-2 border-indigo-500 shadow-2xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Activity &amp; Logs</span>
                    {project?.logs.length ? (
                      <span className="text-[10px] font-mono bg-slate-700/80 text-slate-300 px-1.5 py-0.2 rounded-full">
                        {project.logs.length}
                      </span>
                    ) : null}
                  </button>
                </div>
              </div>

              {/* Active Tab Content Area */}
              <div className="flex-1 overflow-hidden relative">
                {activeTab === 'preview' && (
                  <LivePreview
                    previewUrl={project?.previewUrl}
                    previewHtml={project?.previewHtml}
                    appTitle={project?.requirements?.appTitle || 'Application'}
                    projectId={project?.id}
                    isCompleted={project?.status === 'completed'}
                    isGenerating={isGenerating || isModifying}
                    totalTestsPassed={project?.testReport?.passed || 0}
                    buildStatus={project?.buildStatus}
                    runtimeStatus={project?.runtimeStatus}
                    buildError={project?.buildError}
                    runtimeError={project?.runtimeError}
                    onRetryBuild={() => project && handleUpdateFiles(project.files)}
                  />
                )}

                {activeTab === 'monitor' && (
                  <AgentMonitorTab
                    activeAgent={project?.activeAgent || null}
                    agentProgress={project?.agentProgress || defaultProgress}
                    overallStatus={appStatus}
                    testReport={testReport}
                    debugAttempts={project?.debugAttempts || []}
                  />
                )}

                {activeTab === 'code' && (
                  <CodeViewer
                    files={project?.files || []}
                    appTitle={project?.requirements?.appTitle || 'Codebase'}
                    projectId={project?.id}
                    onSaveFiles={handleUpdateFiles}
                  />
                )}

                {activeTab === 'tests' && (
                  <TestResultsView
                    report={testReport}
                    debugAttempts={project?.debugAttempts || []}
                    isRetesting={isRetesting}
                    onRetest={handleRetest}
                  />
                )}

                {activeTab === 'artifacts' && (
                  <AgentArtifactsView
                    requirements={project?.requirements || null}
                    design={project?.design || null}
                    ragKnowledge={project?.ragKnowledge || []}
                  />
                )}

                {activeTab === 'logs' && (
                  <ActivityLogsView logs={project?.logs || []} />
                )}
              </div>

              {/* Permanent Bottom Terminal on Right Panel */}
              <div className="h-44 shrink-0 border-t border-slate-800 bg-slate-950">
                <TerminalPanel logs={project?.logs || []} status={appStatus} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RAG Docs Modal */}
      <KnowledgeBaseModal
        isOpen={isKbModalOpen}
        onClose={() => setIsKbModalOpen(false)}
      />
    </div>
  );
}
