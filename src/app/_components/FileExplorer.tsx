"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, FileCode, Folder, FolderOpen } from "lucide-react";
import { TreeNode, buildFileTree } from "@/lib/utils/file-tree";
import { VFSState } from "@/lib/types/vfs";
import { cn } from "@/lib/utils";

interface FileExplorerProps {
  files: VFSState;
  activeFile: string;
  onFileSelect: (path: string) => void;
  highlightedPaths?: string[];
}

export function FileExplorer({ files, activeFile, onFileSelect, highlightedPaths = [] }: FileExplorerProps) {
  const tree = buildFileTree(files);

  return (
    <div className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Explorer</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 py-4">
        {tree.map((node) => (
          <TreeItem 
            key={node.path} 
            node={node} 
            activeFile={activeFile} 
            onFileSelect={onFileSelect} 
            highlightedPaths={highlightedPaths}
          />
        ))}
      </div>
    </div>
  );
}

function TreeItem({ 
  node, 
  activeFile, 
  onFileSelect,
  highlightedPaths
}: { 
  node: TreeNode, 
  activeFile: string, 
  onFileSelect: (path: string) => void,
  highlightedPaths: string[]
}) {
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = activeFile === node.path;
  const isHighlighted = highlightedPaths.includes(node.path);

  if (node.type === "file") {
    return (
      <div
        onClick={() => onFileSelect(node.path)}
        className={cn(
          "flex items-center justify-between group px-2 py-1.5 rounded-md cursor-pointer transition-colors text-xs font-medium",
          isSelected ? "bg-indigo-500/20 text-indigo-400" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <FileCode size={14} className={isSelected ? "text-indigo-400" : "text-slate-500"} />
          <span className="truncate">{node.name}</span>
        </div>
        
        {isHighlighted && (
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors text-xs font-medium"
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {isOpen ? <FolderOpen size={14} className="text-indigo-400/70" /> : <Folder size={14} className="text-slate-500" />}
        <span>{node.name}</span>
      </div>
      {isOpen && (
        <div className="ml-4 border-l border-slate-800/50 pl-1">
          {node.children?.map((child) => (
            <TreeItem 
              key={child.path} 
              node={child} 
              activeFile={activeFile} 
              onFileSelect={onFileSelect} 
              highlightedPaths={highlightedPaths}
            />
          ))}
        </div>
      )}
    </div>
  );
}
