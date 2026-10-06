import React, { useState, useEffect, useRef } from 'react';
import {
  FileCode,
  FolderTree,
  Copy,
  Check,
  Download,
  FileText,
  FileCheck,
  Play,
  RotateCcw,
  Save,
  Sparkles,
  Info,
  Layers,
} from 'lucide-react';
import { GeneratedFile } from '../types/client';

interface CodeViewerProps {
  files: GeneratedFile[];
  appTitle: string;
  projectId?: string;
  onSaveFiles?: (updatedFiles: GeneratedFile[]) => Promise<void>;
  isSaving?: boolean;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  files,
  appTitle,
  projectId,
  onSaveFiles,
  isSaving = false,
}) => {
  const [selectedPath, setSelectedPath] = useState<string>(files[0]?.path || '');
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize or synchronize local edited file contents
  useEffect(() => {
    const map: Record<string, string> = {};
    files.forEach((f) => {
      map[f.path] = f.content;
    });
    setFileContents(map);
    if (!selectedPath && files[0]) {
      setSelectedPath(files[0].path);
    }
  }, [files]);

  const activeFile = files.find((f) => f.path === selectedPath) || files[0];
  const currentText = (activeFile && fileContents[activeFile.path]) ?? (activeFile?.content || '');
  const isDirty = activeFile && currentText !== activeFile.content;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!activeFile) return;
    setFileContents((prev) => ({
      ...prev,
      [activeFile.path]: e.target.value,
    }));
  };

  // Support Tab key indentation in editor
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      const newText = currentText.substring(0, start) + '  ' + currentText.substring(end);
      if (activeFile) {
        setFileContents((prev) => ({
          ...prev,
          [activeFile.path]: newText,
        }));
      }

      // Maintain cursor position after indent
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const handleRevert = () => {
    if (!activeFile) return;
    setFileContents((prev) => ({
      ...prev,
      [activeFile.path]: activeFile.content,
    }));
  };

  const handleSaveAndRun = async () => {
    if (!onSaveFiles) return;
    const updated = files.map((f) => ({
      ...f,
      content: fileContents[f.path] !== undefined ? fileContents[f.path] : f.content,
    }));
    await onSaveFiles(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleCopy = () => {
    if (currentText) {
      navigator.clipboard.writeText(currentText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleDownloadJson = () => {
    const updated = files.map((f) => ({
      ...f,
      content: fileContents[f.path] !== undefined ? fileContents[f.path] : f.content,
    }));
    const payload = JSON.stringify(updated, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(appTitle || 'app').toLowerCase().replace(/\s+/g, '-')}-project.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!files || files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center text-slate-500 text-xs bg-slate-50 select-none">
        No project files generated yet.
      </div>
    );
  }

  const lines = currentText.split('\n');

  return (
    <div className="h-full flex flex-row bg-slate-950 text-slate-200 overflow-hidden select-none">
      {/* File Tree Explorer (Left Sidebar) */}
      <div className="w-56 sm:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="h-9 px-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono">
            <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
            <span>Files ({files.length})</span>
          </div>

          <button
            onClick={handleDownloadJson}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Download project files (JSON)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tree items list */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 font-mono text-xs">
          {files.map((file) => {
            const isSelected = file.path === (activeFile?.path || '');
            const isTest = file.path.includes('test');
            const isReadme = file.path.includes('README');
            const fileModified = fileContents[file.path] !== undefined && fileContents[file.path] !== file.content;

            return (
              <button
                key={file.path}
                onClick={() => setSelectedPath(file.path)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left transition ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-medium shadow-2xs'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {isTest ? (
                    <FileCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  ) : isReadme ? (
                    <FileText className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  ) : (
                    <FileCode className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                  )}
                  <span className="truncate text-xs">{file.path}</span>
                </div>

                {fileModified && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Modified" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Save & Run action bar in file tree */}
        {onSaveFiles && (
          <div className="p-2 border-t border-slate-800 bg-slate-950/80">
            <button
              onClick={handleSaveAndRun}
              disabled={isSaving}
              className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : isDirty
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Saved &amp; Built!</span>
                </>
              ) : isSaving ? (
                <span>Compiling...</span>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Save &amp; Run Code</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Code Editor Area */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
        {/* Editor Tab Header */}
        <div className="h-9 px-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 font-mono text-xs truncate">
            <span className="text-slate-200 font-semibold truncate">{activeFile?.path}</span>
            {isDirty && (
              <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800 px-1.5 py-0.2 rounded">
                Unsaved edits
              </span>
            )}
            <span className="text-[10px] text-slate-500 hidden sm:inline truncate">
              {activeFile?.description}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded uppercase">
              {activeFile?.language || 'typescript'}
            </span>

            {isDirty && (
              <button
                onClick={handleRevert}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                title="Revert changes in this file"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="text-[11px] hidden sm:inline">Revert</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              title="Copy code to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold text-[11px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="text-[11px] hidden sm:inline">Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Interactive Code Editor with line numbers */}
        <div className="flex-1 flex overflow-hidden font-mono text-xs">
          {/* Line Numbers column */}
          <div className="w-10 bg-slate-900/60 border-r border-slate-800/80 py-3 text-right pr-2 select-none text-slate-600 font-mono text-[11px] overflow-hidden leading-relaxed shrink-0">
            {lines.map((_, idx) => (
              <div key={idx} className="h-5 flex items-center justify-end">
                {idx + 1}
              </div>
            ))}
          </div>

          {/* Editable Textarea */}
          <textarea
            ref={textareaRef}
            value={currentText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="flex-1 bg-transparent text-slate-100 p-3 font-mono text-xs leading-relaxed resize-none outline-none border-0 select-text overflow-auto whitespace-pre leading-5"
            placeholder="Edit code here..."
          />
        </div>
      </div>
    </div>
  );
};
