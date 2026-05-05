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
      <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-4">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Suggested Changes</p>
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            {orchestration.explanation || "The AI suggested changes across multiple files."}
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-tight">Affected Files</p>
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {orchestration.actions?.map((action: any, i: number) => (
              <div 
                key={i} 
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/50 group hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className={`w-1 h-3 rounded-full ${action.type === 'WRITE_FILE' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="text-[10px] text-slate-400 font-mono truncate">{action.path}</span>
                </div>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  action.type === 'WRITE_FILE' 
                    ? 'bg-emerald-500/10 text-emerald-500' 
                    : 'bg-red-500/10 text-red-500'
                }`}>
                  {action.type === 'WRITE_FILE' ? 'Update' : 'Delete'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button 
            onClick={applyChanges}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg transition-all shadow-lg shadow-indigo-500/10 active:scale-[0.98]"
          >
            Apply All
          </button>
          <button 
            onClick={discardChanges}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[11px] font-bold rounded-lg transition-all active:scale-[0.98]"
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
