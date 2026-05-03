"use client";

import { useState, useEffect, useMemo } from "react";
import { CodeEditor, AIPanel, SuggestionCard, EditorHeader, FileExplorer, DiffEditor } from "@/app/_components";
import { useOrchestrator } from "@/app/_hooks/useOrchestrator";
import { Terminal, Cpu, Sparkles, Command } from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { VFSState } from "@/lib/types/vfs";

const INITIAL_VFS: VFSState = {
  "src/App.tsx": { 
      path: "src/App.tsx", 
      content: "export default function App() {\n  return (\n    <div className=\"min-h-screen bg-slate-900 text-white p-8 font-sans\">\n      <div className=\"max-w-2xl mx-auto space-y-6\">\n        <h1 className=\"text-5xl font-extrabold tracking-tighter bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent italic\">Polaris VFS</h1>\n        <p className=\"text-slate-400 text-lg leading-relaxed\">The Lead AI Orchestrator is now online and monitoring your filesystem. Try asking it to refactor this layout.</p>\n        <div className=\"grid grid-cols-2 gap-4 pt-8\">\n           <div className=\"p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-colors group cursor-pointer\">\n              <h3 className=\"font-bold text-white group-hover:text-indigo-400\">Multi-File Actions</h3>\n              <p className=\"text-xs text-slate-500 mt-1\">Create, update, and delete files in a single turn.</p>\n           </div>\n           <div className=\"p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-colors group cursor-pointer\">\n              <h3 className=\"font-bold text-white group-hover:text-indigo-400\">Side-by-Side Diff</h3>\n              <p className=\"text-xs text-slate-500 mt-1\">Review changes with pixel-perfect accuracy.</p>\n           </div>\n        </div>\n      </div>\n    </div>\n  )\n}" 
  },
  "package.json": { 
      path: "package.json", 
      content: '{\n  "name": "polaris-vfs",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.2.0",\n    "lucide-react": "latest",\n    "clsx": "latest",\n    "tailwind-merge": "latest"\n  }\n}' 
  },
  "src/index.css": {
      path: "src/index.css",
      content: "body {\n  margin: 0;\n  background: #0d0d0d;\n  color: white;\n  -webkit-font-smoothing: antialiased;\n}"
  },
};

export default function Home() {
  const [files, setFiles] = useState<VFSState>(INITIAL_VFS);
  const [activeFile, setActiveFile] = useState("src/App.tsx");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const savedFiles = localStorage.getItem("polaris_vfs_files");
    const savedActiveFile = localStorage.getItem("polaris_active_file");
    if (savedFiles) { try { setFiles(JSON.parse(savedFiles)); } catch (e) { console.error(e); } }
    if (savedActiveFile) { setActiveFile(savedActiveFile); }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("polaris_vfs_files", JSON.stringify(files));
      localStorage.setItem("polaris_active_file", activeFile);
    }
  }, [files, activeFile, isMounted]);

  const currentFile = files[activeFile];

  const updateActiveFileContent = (content: string) => {
    if (!currentFile) return;
    setFiles(prev => ({
      ...prev,
      [activeFile]: { ...prev[activeFile], content }
    }));
  };

  const {
    instruction,
    setInstruction,
    loading,
    orchestration,
    error,
    runOrchestrator,
    applyChanges,
    discardChanges
  } = useOrchestrator(files, setFiles);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (instruction.trim() && !loading) runOrchestrator();
      }
      if (e.key === 'Escape') {
        if (orchestration) discardChanges();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [instruction, loading, orchestration, runOrchestrator, discardChanges]);

  const pendingPaths = orchestration?.actions?.map(a => a.path) || [];
  
  const proposedContent = useMemo(() => {
    const action = orchestration?.actions?.find(a => a.path === activeFile);
    if (action?.type === 'WRITE_FILE') return action.content;
    if (action?.type === 'DELETE_FILE') return "";
    return null;
  }, [orchestration, activeFile]);

  if (!isMounted) return null;

  return (
    <main className="h-screen w-screen bg-[#0d0d0d] text-slate-300 overflow-hidden font-sans selection:bg-indigo-500/30">
      <PanelGroup direction="horizontal">
        {/* 1. File Explorer */}
        <Panel defaultSize={20} minSize={15} maxSize={30}>
          <FileExplorer 
            files={files} 
            activeFile={activeFile} 
            onFileSelect={setActiveFile} 
            highlightedPaths={pendingPaths}
          />
        </Panel>

        <PanelResizeHandle className="w-1 bg-slate-900 hover:bg-indigo-500/30 transition-colors cursor-col-resize relative">
          <div className="absolute inset-y-0 left-1/2 w-px bg-slate-800 -translate-x-1/2" />
        </PanelResizeHandle>

        {/* 2. Main Content - Code Editor */}
        <Panel defaultSize={55} minSize={30}>
          <section className="flex-1 h-full flex flex-col relative bg-[#0d0d0d] border-r border-slate-800">
            <EditorHeader fileName={currentFile?.path || "Welcome"} charCount={currentFile?.content.length || 0} />
            <div className="flex-1 overflow-hidden relative">
              {proposedContent !== null ? (
                <DiffEditor 
                  originalContent={files[activeFile]?.content || ""} 
                  modifiedContent={proposedContent || ""} 
                />
              ) : currentFile ? (
                <CodeEditor value={currentFile.content} onChange={updateActiveFileContent} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-8 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="relative h-20 w-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl">
                       <Cpu size={32} className="text-indigo-400" />
                    </div>
                  </div>
                  <div className="text-center space-y-2 max-w-sm px-4">
                    <h2 className="text-xl font-bold text-white">Polaris Orchestrator</h2>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Select a file from the explorer or ask the AI to generate a new component to get started.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 w-full max-w-[280px]">
                     <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800/50">
                        <span className="text-[11px] text-slate-400 flex items-center gap-2">
                          <Command size={12} /> Generate Changes
                        </span>
                        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 uppercase">⌘ ↵</span>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </Panel>

        <PanelResizeHandle className="w-1 bg-slate-900 hover:bg-indigo-500/30 transition-colors cursor-col-resize relative">
          <div className="absolute inset-y-0 left-1/2 w-px bg-slate-800 -translate-x-1/2" />
        </PanelResizeHandle>

        {/* 3. Sidebar - AI Panel */}
        <Panel defaultSize={25} minSize={20} maxSize={40}>
          <aside className="h-full flex flex-col bg-[#111111]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/20">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-indigo-400" />
                <h1 className="text-[10px] font-bold tracking-widest uppercase text-slate-500">AI Panel</h1>
              </div>
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
        </Panel>
      </PanelGroup>
    </main>
  );
}