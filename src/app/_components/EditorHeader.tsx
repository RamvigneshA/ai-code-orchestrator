"use client";

interface EditorHeaderProps {
  fileName: string;
  charCount: number;
}

export function EditorHeader({ fileName, charCount }: EditorHeaderProps) {
  return (
    <header className="h-10 border-b border-slate-800 flex items-center px-4 justify-between bg-[#0d0d0d]">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-indigo-500/50" />
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Editor — {fileName}</span>
      </div>
      <div className="text-[10px] text-slate-600 font-mono">
        {charCount} chars
      </div>
    </header>
  );
}
