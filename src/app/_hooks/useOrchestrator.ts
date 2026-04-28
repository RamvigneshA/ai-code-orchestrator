import { useState } from "react";

export function useOrchestrator(code: string, setCode: (code: string) => void) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [orchestration, setOrchestration] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runOrchestrator = async () => {
    if (!instruction.trim()) return;
    
    setLoading(true);
    setError(null);
    setOrchestration(null);

    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, instruction }),
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
    if (orchestration?.content) {
      setCode(orchestration.content);
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
