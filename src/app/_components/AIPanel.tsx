"use client";

interface AIPanelProps {
  instruction: string;
  setInstruction: (val: string) => void;
  loading: boolean;
  runOrchestrator: () => void;
}

export function AIPanel({ instruction, setInstruction, loading, runOrchestrator }: AIPanelProps) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-slate-600 uppercase">Instructions</p>
      <textarea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="e.g. 'Add a try/catch block' or 'Refactor to use a hook'..."
        className="w-full h-32 bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-indigo-500/50 transition-colors resize-none placeholder:text-slate-700 font-sans"
      />
      <button
        onClick={runOrchestrator}
        disabled={loading || !instruction.trim()}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/10 active:scale-[0.98]"
      >
        {loading ? "Thinking..." : "Generate Changes"}
      </button>
    </div>
  );
}
