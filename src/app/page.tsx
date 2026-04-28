"use client";

import { useState } from "react";
import { CodeEditor, AIPanel, SuggestionCard, EditorHeader } from "@/app/_components";
import { useOrchestrator } from "@/app/_hooks/useOrchestrator";

export default function Home() {
  const [code, setCode] = useState("const x = 100; console.log(x);");
  const {
    instruction,
    setInstruction,
    loading,
    orchestration,
    error,
    runOrchestrator,
    applyChanges,
    discardChanges
  } = useOrchestrator(code, setCode);

  return (
    <main className="flex h-screen w-screen bg-[#0d0d0d] text-slate-300 overflow-hidden font-sans">
      {/* Sidebar - AI Panel */}
      <aside className="w-80 border-r border-slate-800 flex flex-col bg-[#111111]">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h1 className="text-[10px] font-bold tracking-widest uppercase text-slate-500">AI Panel</h1>
          <div className={`h-2 w-2 rounded-full ${loading ? 'bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-slate-700'}`} />
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-6">
          <AIPanel 
            instruction={instruction} 
            setInstruction={setInstruction} 
            loading={loading} 
            runOrchestrator={runOrchestrator} 
          />

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-400">
              {error}
            </div>
          )}

          <SuggestionCard 
            orchestration={orchestration} 
            applyChanges={applyChanges} 
            discardChanges={discardChanges} 
          />
        </div>
      </aside>

      {/* Main Content - Code Editor */}
      <section className="flex-1 flex flex-col relative bg-[#0d0d0d]">
        <EditorHeader fileName="main.js" charCount={code.length} />
        <div className="flex-1 overflow-hidden">
          <CodeEditor value={code} onChange={setCode} />
        </div>
      </section>
    </main>
  );
}