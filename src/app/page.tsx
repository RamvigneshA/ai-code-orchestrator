"use client";

import { useState } from "react";
import { CodeEditor, AIPanel, SuggestionCard, EditorHeader, FileExplorer } from "@/app/_components";
import { useOrchestrator } from "@/app/_hooks/useOrchestrator";

import { VFSState } from "@/lib/types/vfs";

export default function Home() {
  const [files, setFiles] = useState<VFSState>({
    "src/App.tsx": { 
        path: "src/App.tsx", 
        content: "export default function App() {\n  return (\n    <div className=\"min-h-screen bg-slate-900 text-white p-8\">\n      <h1 className=\"text-4xl font-bold\">Hello VFS</h1>\n      <p className=\"mt-4 text-slate-400\">The Lead AI Orchestrator is now online.</p>\n    </div>\n  )\n}" 
    },
    "package.json": { 
        path: "package.json", 
        content: '{\n  "name": "polaris-vfs",\n  "dependencies": {\n    "react": "^18.2.0",\n    "lucide-react": "latest"\n  }\n}' 
    },
    "src/index.css": {
        path: "src/index.css",
        content: "body {\n  margin: 0;\n  background: #0d0d0d;\n  color: white;\n}"
    },
  });

  const [activeFile, setActiveFile] = useState("src/App.tsx");

  // Ensure activeFile exists in VFS, fallback to App.tsx or first available
  const currentFile = files[activeFile] || files["src/App.tsx"] || Object.values(files)[0];

  // Helper to update active file code
  const updateActiveFileContent = (content: string) => {
    if (!currentFile) return;
    setFiles(prev => ({
      ...prev,
      [currentFile.path]: { ...prev[currentFile.path], content }
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

  const pendingPaths = orchestration?.actions?.map(a => a.path) || [];

  return (
    <main className="flex h-screen w-screen bg-[#0d0d0d] text-slate-300 overflow-hidden font-sans">
      {/* 1. File Explorer */}
      <FileExplorer 
        files={files} 
        activeFile={activeFile} 
        onFileSelect={setActiveFile} 
        highlightedPaths={pendingPaths}
      />

      {/* 2. Main Content - Code Editor */}
      <section className="flex-1 flex flex-col relative bg-[#0d0d0d] border-r border-slate-800">
        <EditorHeader fileName={currentFile?.path || "No file selected"} charCount={currentFile?.content.length || 0} />
        <div className="flex-1 overflow-hidden">
          {currentFile ? (
            <CodeEditor value={currentFile.content} onChange={updateActiveFileContent} />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              Select a file to start editing
            </div>
          )}
        </div>
      </section>

      {/* 3. Sidebar - AI Panel */}
      <aside className="w-80 flex flex-col bg-[#111111]">
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
    </main>
  );
}