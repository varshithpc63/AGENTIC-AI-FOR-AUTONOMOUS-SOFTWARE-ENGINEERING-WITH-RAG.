import React, { useEffect, useState } from 'react';
import { X, BookOpen, FileText, CheckCircle2 } from 'lucide-react';
import { KbDoc } from '../types/client';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({ isOpen, onClose }) => {
  const [docs, setDocs] = useState<KbDoc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<KbDoc | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/knowledge-base')
        .then((res) => res.json())
        .then((data) => {
          if (data.docs) {
            setDocs(data.docs);
            setSelectedDoc(data.docs[0] || null);
          }
        })
        .catch((err) => console.error('Failed to load KB:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[620px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">RAG Technical Knowledge Base</h3>
              <p className="text-xs text-slate-400">
                Authoritative software engineering patterns retrieved by the RAG Agent
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Doc List Sidebar */}
          <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-3 space-y-1 overflow-y-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
              Indexed Documents ({docs.length})
            </span>
            {docs.map((doc) => {
              const isSelected = selectedDoc?.filename === doc.filename;
              return (
                <button
                  key={doc.filename}
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-left transition ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                      : 'text-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <div className="truncate">
                    <p className="truncate leading-tight">{doc.title}</p>
                    <p className={`text-[10px] truncate ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {doc.filename}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Doc Viewer */}
          <div className="flex-1 p-6 overflow-y-auto prose prose-slate max-w-none text-xs leading-relaxed">
            {selectedDoc ? (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h2 className="text-base font-bold text-slate-900">{selectedDoc.title}</h2>
                  <p className="text-slate-400 font-mono text-[11px] mt-0.5">
                    File: knowledge_base/{selectedDoc.filename} • {selectedDoc.sizeBytes} bytes
                  </p>
                </div>
                <div className="whitespace-pre-wrap font-sans text-slate-700 space-y-2">
                  {selectedDoc.content}
                </div>
              </div>
            ) : (
              <p className="text-slate-400">Select a document to view details.</p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>RAG pipeline indexes markdown knowledge files into chunked semantic embeddings</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
