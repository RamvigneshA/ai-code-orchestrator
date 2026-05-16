import { useState, useCallback, useRef } from "react";
import { VFSState } from "@/lib/types/vfs";
import { MultiFileOrchestrationResult } from "@/lib/ai/agent";

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  orchestration?: MultiFileOrchestrationResult;
}

export function useOrchestrator(files: VFSState, setFiles: React.Dispatch<React.SetStateAction<VFSState>>) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [orchestration, setOrchestration] = useState<MultiFileOrchestrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelOrchestration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      setMessages(prev => [...prev, {
        id: Math.random().toString(36).substring(7),
        role: 'system',
        content: "Request cancelled by user.",
        timestamp: new Date(),
      }]);
    }
  }, []);

  const runOrchestrator = async (mentionedFiles: string[] = []) => {
    if (!instruction.trim()) return;
    
    const currentInstruction = instruction;
    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: currentInstruction,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInstruction(""); // Clear input immediately
    setLoading(true);
    setError(null);
    setOrchestration(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Build the context: if specific files are mentioned, send them as primary context
      // plus a file listing of all other files for awareness
      let contextFiles: VFSState;
      let fileList: string[] | undefined;

      if (mentionedFiles.length > 0) {
        // Send only mentioned files as full context
        contextFiles = {};
        for (const path of mentionedFiles) {
          if (files[path]) {
            contextFiles[path] = files[path];
          }
        }
        // Also include a list of all other file paths for awareness
        fileList = Object.keys(files).filter(p => !p.endsWith('.keep') && !mentionedFiles.includes(p));
      } else {
        // No mentions — send all files (original behavior)
        contextFiles = files;
      }

      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ 
          files: contextFiles, 
          instruction: currentInstruction,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          ...(fileList ? { fileList } : {})
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setOrchestration(data);
        
        const assistantMessage: Message = {
          id: Math.random().toString(36).substring(7),
          role: 'assistant',
          content: data.explanation || "Changes generated successfully.",
          timestamp: new Date(),
          orchestration: data,
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMsg = data.error || "Orchestration failed";
        setError(errorMsg);
        setMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(7),
          role: 'system',
          content: errorMsg,
          timestamp: new Date(),
        }]);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      const errorMsg = "Connection error";
      setError(errorMsg);
      setMessages(prev => [...prev, {
        id: Math.random().toString(36).substring(7),
        role: 'system',
        content: errorMsg,
        timestamp: new Date(),
      }]);
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setLoading(false);
      }
    }
  };

  const applyChanges = useCallback(() => {
    if (orchestration?.actions) {
      setFiles(prev => {
        const next = { ...prev };
        
        orchestration.actions!.forEach(action => {
          if (action.type === 'WRITE_FILE' && action.content !== undefined) {
            next[action.path] = {
              path: action.path,
              content: action.content
            };
          } else if (action.type === 'DELETE_FILE') {
            delete next[action.path];
          }
        });
        
        return next;
      });
      
      setOrchestration(null);
    }
  }, [orchestration, setFiles]);

  const discardChanges = useCallback(() => {
    setOrchestration(null);
  }, []);

  return {
    instruction,
    setInstruction,
    loading,
    orchestration,
    error,
    messages,
    runOrchestrator,
    cancelOrchestration,
    applyChanges,
    discardChanges
  };
}
