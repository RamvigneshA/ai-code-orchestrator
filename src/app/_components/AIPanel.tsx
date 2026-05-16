"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { VFSState } from "@/lib/types/vfs";
import { FileText, X, AtSign, Send, Sparkles, User, AlertCircle, Check, Trash2, Square, Copy } from "lucide-react";
import { Message } from "@/app/_hooks/useOrchestrator";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIPanelProps {
  instruction: string;
  setInstruction: (val: string) => void;
  loading: boolean;
  runOrchestrator: (mentionedFiles: string[]) => void;
  files: VFSState;
  messages: Message[];
  applyChanges: () => void;
  discardChanges: () => void;
  orchestration: any;
  cancelOrchestration: () => void;
  activeFile: string;
  onApplySnippet: (content: string) => void;
}

export function AIPanel({ 
  instruction, 
  setInstruction, 
  loading, 
  runOrchestrator, 
  files, 
  messages,
  applyChanges,
  discardChanges,
  orchestration,
  cancelOrchestration,
  activeFile,
  onApplySnippet
}: AIPanelProps) {
  const [mentionedFiles, setMentionedFiles] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const allFilePaths = useMemo(() => {
    return Object.keys(files).filter(p => !p.endsWith('.keep')).sort();
  }, [files]);

  const filteredFiles = useMemo(() => {
    if (!mentionQuery) return allFilePaths;
    const q = mentionQuery.toLowerCase();
    return allFilePaths.filter(p => p.toLowerCase().includes(q));
  }, [allFilePaths, mentionQuery]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredFiles.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInstruction(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@([^\s@]*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
      setMentionQuery("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showDropdown) {
      if (e.key === "Enter" && !e.shiftKey) {
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

  const selectFile = (filePath: string) => {
    if (mentionedFiles.includes(filePath)) {
      setShowDropdown(false);
      return;
    }

    const textarea = textareaRef.current;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = instruction.slice(0, cursorPos);
      const textAfterCursor = instruction.slice(cursorPos);
      const mentionMatch = textBeforeCursor.match(/@([^\s@]*)$/);
      if (mentionMatch) {
        const newBefore = textBeforeCursor.slice(0, textBeforeCursor.length - mentionMatch[0].length);
        setInstruction(newBefore + textAfterCursor);
      }
    }

    setMentionedFiles(prev => [...prev, filePath]);
    setShowDropdown(false);
    setMentionQuery("");
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const removeMention = (filePath: string) => {
    setMentionedFiles(prev => prev.filter(f => f !== filePath));
  };

  const handleSubmit = () => {
    if (!loading && instruction.trim()) {
      runOrchestrator(mentionedFiles);
      setMentionedFiles([]);
    }
  };

  const getFileName = (path: string) => path.split('/').pop() || path;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#111111]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 px-8">
            <div className="p-4 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              <Sparkles size={24} className="text-indigo-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">AI Orchestrator Online</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Ask me to refactor code, create new components, or fix bugs. Use @ to mention specific files for context.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
            <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
               <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                 msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400'
               }`}>
                 {msg.role === 'user' ? <User size={10} /> : <Sparkles size={10} />}
               </div>
               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                 {msg.role === 'user' ? 'You' : 'Polaris AI'}
               </span>
            </div>
            
            <div className={`max-w-[90%] p-3 rounded-2xl text-[12px] leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10' 
                : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-none'
            }`}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const content = String(children).replace(/\n$/, '');
                    if (inline) {
                      return (
                        <code className="bg-white/10 px-1 py-0.5 rounded text-[11px] font-mono" {...props}>
                          {children}
                        </code>
                      );
                    }
                    
                    return (
                      <div className="my-3 border border-white/10 rounded-xl bg-black/40 overflow-hidden group/code">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/5">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                            {className?.replace('language-', '') || 'code'}
                          </span>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => navigator.clipboard.writeText(content)}
                              className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                              title="Copy Code"
                            >
                              <Copy size={12} />
                            </button>
                            {activeFile && (
                              <button 
                                onClick={() => onApplySnippet(content)}
                                className="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white text-[9px] font-bold transition-all"
                                title={`Apply to ${activeFile}`}
                              >
                                <Check size={10} />
                                <span>Apply</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="p-3 overflow-x-auto custom-scrollbar">
                          <code className="block text-[11px] font-mono leading-normal text-indigo-300" {...props}>
                            {children}
                          </code>
                        </div>
                      </div>
                    );
                  },
                  p: ({ children }) => <div className="mb-2 last:mb-0">{children}</div>,
                  ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li>{children}</li>,
                  a: ({ href, children }) => <a href={href} className="text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>

            {/* If it's an assistant message with orchestration, show the changes */}
            {msg.role === 'assistant' && msg.orchestration && msg.orchestration.actions && msg.orchestration.actions.length > 0 && (
              <div className="w-full mt-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Suggested Changes</p>
                  <div className="space-y-1">
                    {msg.orchestration.actions.map((action: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-slate-800/50">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className={`w-1 h-3 rounded-full ${action.type === 'WRITE_FILE' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <span className="text-[10px] text-slate-400 font-mono truncate">{action.path}</span>
                        </div>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          action.type === 'WRITE_FILE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {action.type === 'WRITE_FILE' ? 'Update' : 'Delete'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Only show Apply/Discard buttons if this is the ACTIVE orchestration */}
                {orchestration === msg.orchestration && (
                  <div className="flex gap-2">
                    <button 
                      onClick={applyChanges}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-all"
                    >
                      Apply All
                    </button>
                    <button 
                      onClick={discardChanges}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[11px] font-bold rounded-lg transition-all"
                    >
                      Discard
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex flex-col items-start space-y-2">
            <div className="flex items-center gap-2 mb-1">
               <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400">
                 <Sparkles size={10} className="animate-spin" />
               </div>
               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Polaris AI</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
               <div className="flex gap-1">
                 <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                 <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                 <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
               <span className="text-[10px] text-slate-500 font-medium">Thinking...</span>
               <button 
                 onClick={cancelOrchestration}
                 className="ml-2 p-1 px-1.5 bg-slate-800 hover:bg-red-500/10 border border-slate-700 rounded text-slate-400 hover:text-red-400 transition-all flex items-center gap-1 group/stop"
                 title="Stop Request"
               >
                 <Square size={8} className="fill-current group-hover/stop:animate-pulse" />
                 <span className="text-[8px] font-bold uppercase tracking-widest">Stop</span>
               </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900/40 border-t border-slate-800/50 backdrop-blur-sm">
        <div className="space-y-3">
          {/* Mentions Row */}
          {mentionedFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {mentionedFiles.map(filePath => (
                <span key={filePath} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-300 font-mono">
                  <FileText size={10} />
                  <span className="truncate max-w-[100px]">{getFileName(filePath)}</span>
                  <button onClick={() => removeMention(filePath)} className="ml-1 hover:text-white transition-colors">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Textarea Container */}
          <div className="relative group">
            <textarea
              ref={textareaRef}
              value={instruction}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message Polaris..."
              className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 pr-12 text-[13px] text-slate-200 outline-none focus:border-indigo-500/50 transition-all resize-none placeholder:text-slate-600 min-h-[56px] max-h-[120px] custom-scrollbar"
              rows={1}
            />

            <button
              onClick={handleSubmit}
              disabled={loading || !instruction.trim()}
              className="absolute right-2 bottom-2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 disabled:cursor-not-allowed text-white rounded-xl transition-all active:scale-[0.95]"
            >
              <Send size={16} />
            </button>

            {/* Dropdown */}
            {showDropdown && filteredFiles.length > 0 && (
              <div ref={dropdownRef} className="absolute left-0 right-0 bottom-full mb-2 max-h-48 overflow-y-auto bg-[#1a1a2e] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                {filteredFiles.map((filePath, idx) => (
                  <button
                    key={filePath}
                    onClick={() => selectFile(filePath)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] font-mono transition-colors ${
                      idx === selectedIndex ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <FileText size={12} className="text-slate-500" />
                    <span className="truncate">{filePath}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-[9px] text-slate-600 font-bold uppercase tracking-widest">
              <AtSign size={10} />
              <span>Mention files for context</span>
            </div>
            <span className="text-[9px] text-slate-700">Enter to send • Shift+Enter for new line</span>
          </div>
        </div>
      </div>
    </div>
  );
}
