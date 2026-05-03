'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFileIconUrl } from '@/lib/utils/icons';

interface TabBarProps {
  openFiles: string[];
  activeFile: string;
  onFileSelect: (path: string) => void;
  onFileClose: (path: string) => void;
}

export function TabBar({ openFiles, activeFile, onFileSelect, onFileClose }: TabBarProps) {
  if (openFiles.length === 0) return null;

  return (
    <div className="flex h-9 bg-slate-950 border-b border-slate-800 overflow-x-auto no-scrollbar">
      {openFiles.map((path) => {
        const isActive = activeFile === path;
        const fileName = path.split('/').pop() || path;

        return (
          <div
            key={path}
            onClick={() => onFileSelect(path)}
            className={cn(
              "flex items-center gap-2 px-3 min-w-[120px] max-w-[200px] h-full border-r border-slate-800 cursor-pointer group transition-colors relative",
              isActive ? "bg-[#0d0d0d] text-slate-200" : "bg-slate-900/50 text-slate-500 hover:bg-slate-900"
            )}
          >
            <img src={getFileIconUrl(fileName)} className="w-3.5 h-3.5" alt="" />
            <span className="text-[11px] truncate flex-1">{fileName}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFileClose(path);
              }}
              className={cn(
                "p-0.5 rounded-md hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-opacity",
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
            >
              <X size={12} />
            </button>
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500" />
            )}
          </div>
        );
      })}
    </div>
  );
}
