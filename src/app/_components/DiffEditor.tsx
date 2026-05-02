'use client';

import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, keymap } from '@codemirror/view';
import { standardKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching, foldGutter, foldKeymap, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { MergeView } from '@codemirror/merge';

interface DiffEditorProps {
  originalContent: string;
  modifiedContent: string;
}

const commonExtensions = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  foldGutter(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  highlightSelectionMatches(),
  javascript(),
  oneDark,
  keymap.of([
    ...closeBracketsKeymap,
    ...standardKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    ...searchKeymap
  ])
];

export function DiffEditor({ originalContent, modifiedContent }: DiffEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mergeViewRef = useRef<MergeView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const mergeView = new MergeView({
      a: {
        doc: originalContent,
        extensions: [...commonExtensions, EditorView.editable.of(false), EditorState.readOnly.of(true)],
      },
      b: {
        doc: modifiedContent,
        extensions: commonExtensions,
      },
      parent: containerRef.current,
      orientation: "horizontal"
    });

    mergeViewRef.current = mergeView;

    return () => {
      mergeView.destroy();
    };
  }, [originalContent, modifiedContent]);

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900/50 border-b border-slate-800">
        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
          <span className="text-slate-500">Original</span>
          <span className="text-indigo-400 ml-auto">Proposed Changes</span>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-hidden" />
    </div>
  );
}
