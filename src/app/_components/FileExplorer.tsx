"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, FilePlus, FolderPlus, RefreshCw, ListCollapse, FileText, Folder as FolderIcon, Edit2, Copy, Trash2 } from "lucide-react";
import { TreeNode, buildFileTree } from "@/lib/utils/file-tree";
import { VFSState } from "@/lib/types/vfs";
import { cn } from "@/lib/utils";
import { getFileIconUrl, getFolderIconUrl } from "@/lib/utils/icons";

interface FileExplorerProps {
  files: VFSState;
  activeFile: string;
  onFileSelect: (path: string) => void;
  onFileCreate?: (path: string, type: 'file' | 'folder') => void;
  onFileRename?: (oldPath: string, newPath: string, isFolder: boolean) => void;
  onFileDelete?: (path: string, isFolder: boolean) => void;
  onFileDuplicate?: (path: string) => void;
  highlightedPaths?: string[];
}

export function FileExplorer({ files, activeFile, onFileSelect, onFileCreate, onFileRename, onFileDelete, onFileDuplicate, highlightedPaths = [] }: FileExplorerProps) {
  const tree = buildFileTree(files);
  const [focusedPath, setFocusedPath] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState<'file' | 'folder' | false>(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, path: string, type: 'file' | 'folder' } | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Auto-reveal highlighted paths
  useEffect(() => {
    if (highlightedPaths.length > 0) {
      setExpandedFolders(prev => {
        const next = new Set(prev);
        highlightedPaths.forEach(path => {
          const parts = path.split('/');
          let current = '';
          for (let i = 0; i < parts.length - 1; i++) {
            current = current ? `${current}/${parts[i]}` : parts[i];
            next.add(current);
          }
        });
        return next;
      });
    }
  }, [highlightedPaths]);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const collapseAll = () => {
    setExpandedFolders(new Set());
    setFocusedPath(null);
  };

  const handleCreateRequest = (type: 'file' | 'folder') => {
    if (focusedPath) {
      setExpandedFolders(prev => new Set(prev).add(focusedPath));
    }
    setIsCreating(type);
  };

  const handleInlineSubmit = (name: string) => {
    if (!name.trim()) {
      setIsCreating(false);
      return;
    }
    
    if (name.includes('/') || name.includes('\\')) {
      alert("Invalid characters in name.");
      return;
    }

    const basePath = focusedPath ? `${focusedPath}/` : '';
    const fullPath = `${basePath}${name}`;

    if (files[fullPath] || files[`${fullPath}/.keep`]) {
      alert("A file or folder with this name already exists at this location.");
      return;
    }

    if (onFileCreate) {
      onFileCreate(fullPath, isCreating as 'file' | 'folder');
    }
    
    setIsCreating(false);
  };

  const handleRenameSubmit = (newName: string, oldPath: string, isFolder: boolean) => {
    if (!newName.trim() || newName === oldPath.split('/').pop()) {
      setRenamingPath(null);
      return;
    }

    if (newName.includes('/') || newName.includes('\\')) {
      alert("Invalid characters in name.");
      return;
    }

    const basePath = oldPath.substring(0, oldPath.lastIndexOf('/'));
    const fullNewPath = basePath ? `${basePath}/${newName}` : newName;

    if (files[fullNewPath] || files[`${fullNewPath}/.keep`]) {
      alert("A file or folder with this name already exists.");
      return;
    }

    if (onFileRename) {
      onFileRename(oldPath, fullNewPath, isFolder);
    }
    
    setRenamingPath(null);
  };

  return (
    <div 
      className="flex-1 border-r border-slate-800 bg-slate-950 flex flex-col h-full overflow-hidden relative"
      onClick={() => {
        if (!isCreating && !renamingPath) setFocusedPath(null);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu(null);
      }}
    >
      <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Explorer</span>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); handleCreateRequest('file'); }} className="p-1 hover:bg-slate-800 rounded-md text-slate-500 hover:text-slate-300 transition-colors" title="New File">
            <FilePlus size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleCreateRequest('folder'); }} className="p-1 hover:bg-slate-800 rounded-md text-slate-500 hover:text-slate-300 transition-colors" title="New Folder">
            <FolderPlus size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); }} className="p-1 hover:bg-slate-800 rounded-md text-slate-500 hover:text-slate-300 transition-colors" title="Refresh Explorer">
            <RefreshCw size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); collapseAll(); }} className="p-1 hover:bg-slate-800 rounded-md text-slate-500 hover:text-slate-300 transition-colors" title="Collapse All">
            <ListCollapse size={14} />
          </button>
        </div>
      </div>
      
      {contextMenu && (
        <div 
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 min-w-[160px] bg-slate-900 border border-slate-700 rounded-md shadow-2xl py-1"
        >
          <button 
            className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-indigo-500 hover:text-white flex items-center gap-2"
            onClick={() => { setRenamingPath(contextMenu.path); setContextMenu(null); }}
          >
            <Edit2 size={12} /> Rename
          </button>
          {contextMenu.type === 'file' && (
            <button 
              className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-indigo-500 hover:text-white flex items-center gap-2"
              onClick={() => { if (onFileDuplicate) onFileDuplicate(contextMenu.path); setContextMenu(null); }}
            >
              <Copy size={12} /> Duplicate
            </button>
          )}
          <div className="h-px bg-slate-800 my-1 w-full" />
          <button 
            className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500 hover:text-white flex items-center gap-2"
            onClick={() => { if (onFileDelete) onFileDelete(contextMenu.path, contextMenu.type === 'folder'); setContextMenu(null); }}
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-2">
        {/* Root Level Inline Input */}
        {isCreating && !focusedPath && (
          <div className="flex items-center py-1 px-2">
            {isCreating === 'file' ? <FileText size={14} className="mr-2 text-indigo-400" /> : <FolderIcon size={14} className="mr-2 text-indigo-400" />}
            <input
              autoFocus
              className="bg-[#1e1e1e] border border-indigo-500 outline-none text-sm px-1 py-0.5 w-full text-slate-300 focus:ring-1 focus:ring-indigo-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInlineSubmit(e.currentTarget.value);
                if (e.key === 'Escape') setIsCreating(false);
              }}
              onBlur={() => setIsCreating(false)}
            />
          </div>
        )}

        {tree.map((node) => (
          <TreeItem 
            key={node.path} 
            node={node} 
            activeFile={activeFile} 
            onFileSelect={onFileSelect} 
            highlightedPaths={highlightedPaths}
            focusedPath={focusedPath}
            setFocusedPath={setFocusedPath}
            isCreating={isCreating}
            setIsCreating={setIsCreating}
            handleInlineSubmit={handleInlineSubmit}
            expandedFolders={expandedFolders}
            toggleFolder={toggleFolder}
            depth={0}
            setContextMenu={setContextMenu}
            renamingPath={renamingPath}
            handleRenameSubmit={handleRenameSubmit}
          />
        ))}
      </div>
    </div>
  );
}

interface TreeItemProps {
  node: TreeNode;
  activeFile: string;
  onFileSelect: (path: string) => void;
  highlightedPaths: string[];
  focusedPath: string | null;
  setFocusedPath: (path: string | null) => void;
  isCreating: 'file' | 'folder' | false;
  setIsCreating: (val: 'file' | 'folder' | false) => void;
  handleInlineSubmit: (name: string) => void;
  expandedFolders: Set<string>;
  toggleFolder: (path: string) => void;
  depth: number;
  setContextMenu: (menu: { x: number, y: number, path: string, type: 'file' | 'folder' } | null) => void;
  renamingPath: string | null;
  handleRenameSubmit: (newName: string, oldPath: string, isFolder: boolean) => void;
}

function TreeItem({ 
  node, 
  activeFile, 
  onFileSelect,
  highlightedPaths,
  focusedPath,
  setFocusedPath,
  isCreating,
  setIsCreating,
  handleInlineSubmit,
  expandedFolders,
  toggleFolder,
  depth,
  setContextMenu,
  renamingPath,
  handleRenameSubmit
}: TreeItemProps) { 
  const isFolder = node.type === "folder";
  const isOpen = expandedFolders.has(node.path);
  const isFocused = focusedPath === node.path;
  const isHighlighted = highlightedPaths.some(p => p === node.path || p.startsWith(`${node.path}/`));
  const isActive = activeFile === node.path;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder) {
      setFocusedPath(node.path);
      toggleFolder(node.path);
    } else {
      setFocusedPath(node.path); // Focus the file
      onFileSelect(node.path);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFocusedPath(node.path);
    setContextMenu({ x: e.clientX, y: e.clientY, path: node.path, type: node.type as 'file' | 'folder' });
  };

  if (!isFolder) {
    return (
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className={cn(
          "flex items-center gap-2 py-1 cursor-pointer transition-colors text-[13px] relative group",
          isActive ? "bg-indigo-500/10 text-indigo-300" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
          isFocused && !isActive ? "bg-slate-800/80 ring-1 ring-inset ring-slate-700" : ""
        )}
      >
        <div className="w-4 h-4 flex items-center justify-center opacity-0" />
        <img src={getFileIconUrl(node.name)} alt="" className="w-4 h-4" />
        {renamingPath === node.path ? (
          <input
            autoFocus
            defaultValue={node.name}
            className="bg-[#1e1e1e] border border-indigo-500 outline-none text-sm px-1 py-0 w-full text-slate-300"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit(e.currentTarget.value, node.path, false);
              if (e.key === 'Escape') handleRenameSubmit(node.name, node.path, false);
            }}
            onBlur={(e) => handleRenameSubmit(e.currentTarget.value, node.path, false)}
          />
        ) : (
          <span className="truncate">{node.name}</span>
        )}
        {isHighlighted && (
          <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-[1px]">
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className={cn(
          "flex items-center gap-2 py-1 cursor-pointer transition-colors text-[13px] relative",
          isFocused ? "bg-slate-800/80 ring-1 ring-inset ring-slate-700 text-slate-200" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
        )}
      >
        <div className="flex items-center gap-1">
          {isOpen ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
          <img 
            src={getFolderIconUrl(node.name, isOpen)} 
            alt="" 
            className="w-4 h-4"
            onError={(e) => {
              (e.target as HTMLImageElement).src = isOpen ? 'https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/default_folder_opened.svg' : 'https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons/default_folder.svg';
            }}
          />
        </div>
        {renamingPath === node.path ? (
          <input
            autoFocus
            defaultValue={node.name}
            className="bg-[#1e1e1e] border border-indigo-500 outline-none text-sm px-1 py-0 w-full text-slate-300"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit(e.currentTarget.value, node.path, true);
              if (e.key === 'Escape') handleRenameSubmit(node.name, node.path, true);
            }}
            onBlur={(e) => handleRenameSubmit(e.currentTarget.value, node.path, true)}
          />
        ) : (
          <span className="truncate">{node.name}</span>
        )}
        {isHighlighted && (
          <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
        )}
      </div>
      
      {isOpen && (
        <div className="w-full">
          {/* Nested Inline Input */}
          {isCreating && isFocused && (
            <div className="flex items-center py-1" style={{ paddingLeft: `${(depth + 1) * 12 + 28}px` }}>
              {isCreating === 'file' ? <FileText size={14} className="mr-2 text-indigo-400" /> : <FolderIcon size={14} className="mr-2 text-indigo-400" />}
              <input
                autoFocus
                className="bg-[#1e1e1e] border border-indigo-500 outline-none text-sm px-1 py-0.5 w-full text-slate-300 focus:ring-1 focus:ring-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInlineSubmit(e.currentTarget.value);
                  if (e.key === 'Escape') setIsCreating(false);
                }}
                onBlur={() => setIsCreating(false)}
              />
            </div>
          )}

          {node.children?.map((child) => (
            <TreeItem 
              key={child.path} 
              node={child} 
              activeFile={activeFile} 
              onFileSelect={onFileSelect} 
              highlightedPaths={highlightedPaths}
              focusedPath={focusedPath}
              setFocusedPath={setFocusedPath}
              isCreating={isCreating}
              setIsCreating={setIsCreating}
              handleInlineSubmit={handleInlineSubmit}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              depth={depth + 1}
              setContextMenu={setContextMenu}
              renamingPath={renamingPath}
              handleRenameSubmit={handleRenameSubmit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
