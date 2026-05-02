import { useState } from "react";
import { VFSState } from "@/lib/types/vfs";
import { MultiFileOrchestrationResult } from "@/lib/ai/agent";

export function useOrchestrator(files: VFSState, setFiles: React.Dispatch<React.SetStateAction<VFSState>>) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [orchestration, setOrchestration] = useState<MultiFileOrchestrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runOrchestrator = async () => {
    if (!instruction.trim()) return;
    
    setLoading(true);
    setError(null);
    setOrchestration(null);

    try {
      console.log("Sending files:", files);
      console.log("Instruction:", instruction);
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, instruction }),
      });

      const data = await res.json();
      if (res.ok) {
        setOrchestration(data);
      } else {
        setError(data.error || "Orchestration failed");
      }
    } catch (err) {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  const applyChanges = () => {
    if (orchestration?.actions) {
      setFiles(prev => {
        const next = { ...prev };
        
        orchestration.actions.forEach(action => {
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
      setInstruction("");
    }
  };

  const discardChanges = () => {
    setOrchestration(null);
  };

  return {
    instruction,
    setInstruction,
    loading,
    orchestration,
    error,
    runOrchestrator,
    applyChanges,
    discardChanges
  };
}
