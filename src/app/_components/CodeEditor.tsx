'use client';

import { useEffect, useRef } from 'react';
import { EditorState, Transaction } from '@codemirror/state';
import { EditorView, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, keymap } from '@codemirror/view';
import { standardKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching, foldGutter, foldKeymap, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { ghostTextExtension } from './CodeEditor/ghostText';

const modularSetup = [
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
  ghostTextExtension,
  keymap.of([
    ...closeBracketsKeymap,
    ...standardKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
    ...searchKeymap
  ])
];

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

import { setGhostText } from './CodeEditor/ghostText';

export function CodeEditor({ value, onChange }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        ...modularSetup,
        javascript(),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const isAI = update.transactions.some(tr => tr.isUserEvent('ai'));
            if (!isAI) {
              onChange(update.state.doc.toString());
              
              // Trigger Autocomplete logic
              if (timerRef.current) clearTimeout(timerRef.current);
              timerRef.current = setTimeout(async () => {
                const view = viewRef.current;
                if (!view) return;

                const pos = view.state.selection.main.head;
                const prefix = view.state.doc.sliceString(0, pos);
                
                try {
                  const res = await fetch("/api/autocomplete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prefix }),
                  });
                  const { suggestion } = await res.json();
                  
                  if (suggestion && viewRef.current) {
                    viewRef.current.dispatch({
                      effects: setGhostText.of(suggestion)
                    });
                  }
                } catch (e) {
                  console.error("Autocomplete failed", e);
                }
              }, 1000); // 1 second pause
            }
          }
        })
      ]
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });
    viewRef.current = view;
    return () => view.destroy();
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const current = view.state.doc.toString();

    if (value !== current) {
      view.dispatch({
        changes: {
          from: 0,
          to: current.length,
          insert: value,
        },
        selection: view.state.selection,
        annotations: Transaction.userEvent.of('ai')
      });
    }
  }, [value]);

  return <div ref={editorRef} className="min-h-[150px]" />;
}