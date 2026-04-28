"use client";

interface SuggestionCardProps {
  orchestration: any;
  applyChanges: () => void;
  discardChanges: () => void;
}

export function SuggestionCard({ orchestration, applyChanges, discardChanges }: SuggestionCardProps) {
  if (!orchestration) return null;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-3">
        <p className="text-[10px] font-bold text-indigo-400 uppercase">Suggested Change</p>
        <div className="max-h-40 overflow-hidden rounded-lg bg-black/40 border border-slate-800 relative group">
          <pre className="p-2 text-[10px] text-slate-400 font-mono">
            <code>{orchestration.content}</code>
          </pre>
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] to-transparent opacity-40" />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={applyChanges}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-colors"
          >
            Apply
          </button>
          <button 
            onClick={discardChanges}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold rounded-lg transition-colors"
          >
            Discard
          </button>
        </div>
      </div>

      {/* Reasoning Area */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-slate-600 uppercase">Reasoning</p>
        <div className="text-[10px] text-slate-500 leading-relaxed italic bg-slate-900/30 p-3 rounded-xl border border-slate-800/50 font-sans">
          {orchestration.reasoning_details || "AI generated a direct solution based on your instruction."}
        </div>
      </div>
    </div>
  );
}
