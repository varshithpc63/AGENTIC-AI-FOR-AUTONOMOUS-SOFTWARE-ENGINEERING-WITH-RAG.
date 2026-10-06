import React from 'react';
import { Play, RefreshCw, X, ChevronDown, Sparkles } from 'lucide-react';
import { SamplePrompt } from '../types/client';

interface PromptSectionProps {
  prompt: string;
  setPrompt: (val: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  samples: SamplePrompt[];
  onSelectSample: (sample: SamplePrompt) => void;
}

export const PromptSection: React.FC<PromptSectionProps> = ({
  prompt,
  setPrompt,
  onGenerate,
  isGenerating,
  samples,
  onSelectSample,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2.5 shrink-0 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center gap-2">
        {/* Text Input Row */}
        <div className="flex-1 flex items-center gap-2 relative">
          <textarea
            rows={1}
            disabled={isGenerating}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe software requirement (e.g. Build a student attendance management system...)"
            className="w-full text-xs py-1.5 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 text-slate-900 placeholder:text-slate-400 resize-none h-[38px] leading-relaxed"
          />

          {prompt && !isGenerating && (
            <button
              type="button"
              onClick={() => setPrompt('')}
              className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-1"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Templates and Actions Row */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Compact Template Selector */}
          <div className="relative">
            <select
              disabled={isGenerating}
              onChange={(e) => {
                const s = samples.find((x) => x.id === e.target.value);
                if (s) onSelectSample(s);
              }}
              defaultValue=""
              className="text-xs bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 hover:bg-slate-200/70 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition cursor-pointer pr-6 appearance-none h-[38px]"
            >
              <option value="" disabled>
                Load preset...
              </option>
              {samples.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 top-3 pointer-events-none" />
          </div>

          {/* Generate Button */}
          <button
            type="button"
            disabled={isGenerating || !prompt.trim()}
            onClick={onGenerate}
            className="inline-flex items-center justify-center gap-1.5 px-4 h-[38px] rounded-lg font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-xs shrink-0 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Generate Software</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
