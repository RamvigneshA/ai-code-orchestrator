"use client";
import { useState } from "react";
import { CodeEditor } from "@/app/_components";

export default function Home() {
  const [code, setCode] = useState("const x = 100; console.log(x);");
  const [instruction, setInstruction] = useState("Rename x to userCount and make it a let variable.");

  return (
    <main className="flex h-screen w-screen bg-[#0d0d0d] text-slate-300 overflow-hidden font-sans">
      {/* Sidebar - Orchestration Controls */}
      <aside className="w-80 border-r border-slate-800 flex flex-col bg-[#111111]">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h1 className="text-[10px] font-bold tracking-widest uppercase text-slate-500">AI Orchestrator</h1>
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-6">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-slate-600 uppercase">Status</p>
            <div className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
              Ready to orchestrate
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content - Code Editor */}
      <section className="flex-1 flex flex-col relative bg-[#0d0d0d]">
        <header className="h-10 border-b border-slate-800 flex items-center px-4">
          <div className="text-[10px] text-slate-500 font-mono">main.js</div>
        </header>
        <div className="flex-1 overflow-hidden">
          <CodeEditor value={code} onChange={setCode} />
        </div>
      </section>
    </main>
  );
}