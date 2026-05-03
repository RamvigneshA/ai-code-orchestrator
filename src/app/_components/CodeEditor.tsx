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
import { getLanguageExtension } from '@/lib/utils/languages';

const modularSetup = (fileName: string) => [
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
  getLanguageExtension(fileName),
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
  fileName?: string;
}

import { setGhostText } from './CodeEditor/ghostText';

export function CodeEditor({ value, onChange, fileName = "file.js" }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        ...modularSetup(fileName),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            // Cancel any pending AI request immediately
            if (abortControllerRef.current) {
              abortControllerRef.current.abort();
              abortControllerRef.current = null;
            }

            const isAI = update.transactions.some(tr => tr.isUserEvent('ai'));
            if (!isAI) {
              onChange(update.state.doc.toString());
              
              // Clear ghost text if user is typing
              update.view.dispatch({ effects: setGhostText.of(null) });

              // Debounced trigger
              if (timerRef.current) clearTimeout(timerRef.current);
              timerRef.current = setTimeout(async () => {
                const view = viewRef.current;
                if (!view) return;

                const pos = view.state.selection.main.head;
                const prefix = view.state.doc.sliceString(Math.max(0, pos - 1000), pos);
                
                // Create a new controller for this request
                const controller = new AbortController();
                abortControllerRef.current = controller;

                try {
                  const res = await fetch("/api/autocomplete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prefix }),
                    signal: controller.signal
                  });

                  if (!res.body) return;
                  const reader = res.body.getReader();
                  const decoder = new TextDecoder();
                  let suggestion = "";

                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    suggestion += decoder.decode(value, { stream: true });
                    
                    if (viewRef.current) {
                      viewRef.current.dispatch({
                        effects: setGhostText.of(suggestion)
                      });
                    }
                  }
                } catch (e: any) {
                  if (e.name !== 'AbortError') {
                    console.error("Autocomplete failed", e);
                  }
                } finally {
                  if (abortControllerRef.current === controller) {
                    abortControllerRef.current = null;
                  }
                }
              }, 800);
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
  }, [fileName]);

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