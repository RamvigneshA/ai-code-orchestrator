"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { VFSState } from "@/lib/types/vfs";
import { FileText, X, AtSign } from "lucide-react";

interface AIPanelProps {
  instruction: string;
  setInstruction: (val: string) => void;
  loading: boolean;
  runOrchestrator: (mentionedFiles: string[]) => void;
  files: VFSState;
}

export function AIPanel({ instruction, setInstruction, loading, runOrchestrator, files }: AIPanelProps) {
  const [mentionedFiles, setMentionedFiles] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get all file paths (excluding .keep markers)
  const allFilePaths = useMemo(() => {
    return Object.keys(files).filter(p => !p.endsWith('.keep')).sort();
  }, [files]);

  // Filter files based on mention query
  const filteredFiles = useMemo(() => {
    if (!mentionQuery) return allFilePaths;
    const q = mentionQuery.toLowerCase();
    return allFilePaths.filter(p => p.toLowerCase().includes(q));
  }, [allFilePaths, mentionQuery]);

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredFiles.length]);

  // Detect @ trigger in textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInstruction(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);

    // Find the last @ that isn't preceded by a word character
    const mentionMatch = textBeforeCursor.match(/@([^\s@]*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
      setMentionQuery("");
    }
  };

  // Handle keyboard navigation in dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showDropdown) {
      // Submit on Cmd+Enter / Ctrl+Enter
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filteredFiles.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (filteredFiles[selectedIndex]) {
        selectFile(filteredFiles[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowDropdown(false);
    }
  };

  // Insert file mention
  const selectFile = (filePath: string) => {
    if (mentionedFiles.includes(filePath)) {
      setShowDropdown(false);
      return;
    }

    // Replace the @query text with empty (the pill will represent it)
    const textarea = textareaRef.current;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = instruction.slice(0, cursorPos);
      const textAfterCursor = instruction.slice(cursorPos);

      // Remove the @query part
      const mentionMatch = textBeforeCursor.match(/@([^\s@]*)$/);
      if (mentionMatch) {
        const newBefore = textBeforeCursor.slice(0, textBeforeCursor.length - mentionMatch[0].length);
        setInstruction(newBefore + textAfterCursor);
      }
    }

    setMentionedFiles(prev => [...prev, filePath]);
    setShowDropdown(false);
    setMentionQuery("");

    // Refocus textarea
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  // Remove a mentioned file
  const removeMention = (filePath: string) => {
    setMentionedFiles(prev => prev.filter(f => f !== filePath));
  };

  const handleSubmit = () => {
    if (!loading && instruction.trim()) {
      runOrchestrator(mentionedFiles);
      setMentionedFiles([]);
    }
  };

  // Get just the filename from a path
  const getFileName = (path: string) => path.split('/').pop() || path;

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-slate-600 uppercase">Instructions</p>

      {/* Mentioned File Pills */}
      {mentionedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {mentionedFiles.map(filePath => (
            <span
              key={filePath}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-[10px] text-indigo-300 font-mono group"
              title={filePath}
            >
              <FileText size={10} className="text-indigo-400 shrink-0" />
              <span className="truncate max-w-[120px]">{getFileName(filePath)}</span>
              <button
                onClick={() => removeMention(filePath)}
                className="ml-0.5 p-0.5 rounded hover:bg-indigo-500/30 text-indigo-400/60 hover:text-indigo-300 transition-colors"
              >
                <X size={8} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Textarea with @ Dropdown */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={instruction}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type @ to mention files for context..."
          className="w-full h-32 bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-indigo-500/50 transition-colors resize-none placeholder:text-slate-700 font-sans"
        />

        {/* @ Mention Hint */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[9px] text-slate-700">
          <AtSign size={9} />
          <span>mention files</span>
        </div>

        {/* Dropdown */}
        {showDropdown && filteredFiles.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute left-2 right-2 bottom-full mb-1 max-h-48 overflow-y-auto bg-[#1a1a2e] border border-slate-700 rounded-lg shadow-2xl shadow-black/50 z-50"
          >
            {filteredFiles.map((filePath, idx) => (
              <button
                key={filePath}
                onClick={() => selectFile(filePath)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] font-mono transition-colors ${
                  idx === selectedIndex
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                } ${mentionedFiles.includes(filePath) ? 'opacity-40' : ''}`}
              >
                <FileText size={12} className="text-slate-500 shrink-0" />
                <span className="truncate">{filePath}</span>
                {mentionedFiles.includes(filePath) && (
                  <span className="ml-auto text-[9px] text-indigo-400">added</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {showDropdown && filteredFiles.length === 0 && (
          <div className="absolute left-2 right-2 bottom-full mb-1 bg-[#1a1a2e] border border-slate-700 rounded-lg shadow-2xl shadow-black/50 z-50 p-3 text-center text-[11px] text-slate-600">
            No files matching &ldquo;{mentionQuery}&rdquo;
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !instruction.trim()}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/10 active:scale-[0.98]"
      >
        {loading ? "Thinking..." : "Generate Changes"}
      </button>
    </div>
  );
}
