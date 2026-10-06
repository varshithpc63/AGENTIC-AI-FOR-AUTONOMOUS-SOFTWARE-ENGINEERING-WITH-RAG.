import React from 'react';
import {
  FileText,
  Compass,
  Database,
  CheckCircle2,
  Layers,
  ArrowRight,
  Code2,
  Server,
  Workflow,
  Cpu,
} from 'lucide-react';
import { RagDoc, RequirementSpec, SystemDesignSpec } from '../types/client';

interface AgentArtifactsViewProps {
  requirements: RequirementSpec | null;
  design: SystemDesignSpec | null;
  ragKnowledge: RagDoc[];
}

export const AgentArtifactsView: React.FC<AgentArtifactsViewProps> = ({
  requirements,
  design,
  ragKnowledge,
}) => {
  if (!requirements && !design) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center text-slate-500 text-xs bg-slate-50">
        No architecture specifications generated yet. Run the pipeline to analyze requirements and synthesize architecture.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-y-auto p-4 space-y-5">
      {/* 1. Analyzed Requirements Header */}
      {requirements && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">1. Analyzed Software Requirements</h3>
            </div>
            <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold">
              Requirement Agent
            </span>
          </div>

          <div>
            <h4 className="text-base font-bold text-slate-900">{requirements.appTitle}</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{requirements.summary}</p>
          </div>

          {/* Core Features Grid */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
              Core Functional Capabilities
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {requirements.coreFeatures.map((feat) => (
                <div key={feat.id} className="p-2.5 rounded-md border border-slate-200 bg-slate-50/50 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">{feat.title}</span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                        feat.priority === 'high' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {feat.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">{feat.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Acceptance Criteria */}
          <div className="space-y-1 pt-1">
            <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
              Acceptance Criteria (Verification Checklist)
            </span>
            <div className="space-y-1">
              {requirements.acceptanceCriteria.map((c, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. System Architecture & Diagram */}
      {design && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">2. System Architecture &amp; Data Flow</h3>
            </div>
            <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold">
              Design Agent
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-md border border-slate-200">
            {design.architectureOverview}
          </p>

          {/* Visual Architecture Flow Diagram (B.Tech Presentation / Viva) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
              End-to-End Architectural Pipeline Flow
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs text-center">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center">
                <FileText className="w-4 h-4 text-sky-600 mb-1" />
                <span className="font-bold text-slate-800 text-[11px]">User Spec</span>
                <span className="text-[10px] text-slate-500 mt-0.5">NLP Prompt</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center">
                <Database className="w-4 h-4 text-amber-600 mb-1" />
                <span className="font-bold text-slate-800 text-[11px]">RAG Vector Base</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Technical Docs</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center">
                <Code2 className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="font-bold text-slate-800 text-[11px]">Code Generator</span>
                <span className="text-[10px] text-slate-500 mt-0.5">TypeScript + AST</span>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center">
                <Cpu className="w-4 h-4 text-indigo-600 mb-1" />
                <span className="font-bold text-slate-800 text-[11px]">Isolated Sandbox</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Node.js VM + Runner</span>
              </div>
            </div>
          </div>

          {/* Component Hierarchy */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
              Component Hierarchy ({design.components.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {design.components.map((comp, idx) => (
                <div key={idx} className="p-2.5 rounded-md border border-slate-200 bg-white space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-indigo-700">{comp.name}</span>
                    <span className="text-[9px] uppercase font-semibold text-slate-500 bg-slate-100 px-1 py-0.2 rounded">
                      {comp.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">{comp.responsibility}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Data Models */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
              TypeScript Schema &amp; Data Model
            </span>
            <div className="space-y-2">
              {design.dataModels.map((model, idx) => (
                <div key={idx} className="border border-slate-200 rounded-md overflow-hidden bg-white">
                  <div className="bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-800">
                    interface {model.name}
                  </div>
                  <div className="p-2 divide-y divide-slate-100 text-xs font-mono">
                    {model.fields.map((f, fIdx) => (
                      <div key={fIdx} className="py-1 flex items-center justify-between">
                        <span className="font-semibold text-slate-800">
                          {f.name}
                          {f.required ? '' : '?'}
                        </span>
                        <span className="text-sky-600">{f.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Technology Stack & RAG Sources Used */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">3. Technology Stack &amp; RAG Sources</h3>
          </div>
          <span className="text-[10px] font-mono text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full font-semibold">
            RAG Retriever
          </span>
        </div>

        {/* Tech Stack Chips */}
        <div className="flex flex-wrap gap-2">
          {[
            'React 19',
            'TypeScript 5.x',
            'Tailwind CSS',
            'Gemini 3.8 Flash',
            '@google/genai SDK',
            'Node.js isolated VM',
            'esbuild AST transpiler',
            'HTML5 Sandbox Iframe',
          ].map((tech) => (
            <span key={tech} className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
              {tech}
            </span>
          ))}
        </div>

        {/* RAG Docs Grid */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
            Indexed Technical Knowledge Documents ({ragKnowledge.length})
          </span>
          <div className="space-y-2">
            {ragKnowledge.map((doc) => (
              <div key={doc.id} className="p-2.5 rounded-md border border-slate-200 bg-slate-50/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{doc.title}</span>
                  <span className="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    {(doc.relevanceScore * 100).toFixed(0)}% match
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-500">{doc.sourceFile}</p>
                <p className="text-xs text-slate-600 leading-relaxed bg-white p-2 rounded border border-slate-200">
                  {doc.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
