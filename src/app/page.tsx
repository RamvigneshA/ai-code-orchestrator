"use client";

import { useState } from "react";

export default function Home() {
  const [orchestration, setOrchestration] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("const x = 10; console.log(x);");
  const [instruction, setInstruction] = useState("Rename x to userCount and make it a let variable.");

  const testOrchestrator = async () => {
    setLoading(true);
    setOrchestration(null);
    setError(null);

    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          instruction,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setOrchestration(data);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-8 flex flex-col items-center justify-center font-sans">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-black tracking-tighter bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            AI Code Orchestrator
          </h1>
          <p className="text-slate-400 text-xl font-medium">Testing Reasoning-Enabled Orchestration</p>
        </div>

        <div className="p-1 rounded-[2.5rem] bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl">
          <div className="p-8 bg-slate-900/90 backdrop-blur-xl rounded-[2.3rem] border border-slate-800/50 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400/80 ml-2">Input Code</label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-32 p-4 bg-slate-950/50 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
                  placeholder="Enter your code here..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/80 ml-2">Instruction</label>
                <textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  className="w-full h-32 p-4 bg-slate-950/50 rounded-2xl border border-slate-800 text-sm text-slate-300 italic focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all resize-none"
                  placeholder="Enter orchestration instructions..."
                />
              </div>
            </div>

            <button
              onClick={testOrchestrator}
              disabled={loading}
              className="group relative w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Thinking...
                  </>
                ) : "Execute Orchestration"}
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-4">
            {error}
          </div>
        )}

        {orchestration && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Orchestrated Code */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Orchestrated Output
                </h2>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
                  {orchestration.path}
                </span>
              </div>
              <pre className="p-6 bg-slate-900 border border-slate-800 rounded-[2rem] overflow-auto text-sm text-cyan-300 shadow-2xl min-h-[200px]">
                <code>{orchestration.content}</code>
              </pre>
            </div>

            {/* Reasoning Details */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Chain of Thought
              </h2>
              <div className="p-6 bg-slate-900/50 border border-slate-800/50 rounded-[2rem] text-sm text-slate-400 leading-relaxed shadow-xl max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                {orchestration.reasoning_details ? (
                  <div className="whitespace-pre-wrap">
                    {Array.isArray(orchestration.reasoning_details) 
                      ? orchestration.reasoning_details.map((r: any) => r.text || r).join('\n\n')
                      : orchestration.reasoning_details}
                  </div>
                ) : (
                  <p className="italic text-slate-600">No reasoning details provided for this model.</p>
                )}
              </div>
              {orchestration.usage && (
                <div className="flex gap-4 px-2">
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider">
                    Tokens: <span className="text-slate-400 font-mono">{orchestration.usage.total_tokens}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 uppercase tracking-wider">
                    Reasoning: <span className="text-amber-500/80 font-mono">
                      {orchestration.usage.completion_tokens_details?.reasoning_tokens || orchestration.usage.reasoning_tokens || 0}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}