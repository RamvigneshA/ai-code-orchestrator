"use client";
import { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { getWebContainerInstance } from '@/lib/utils/webcontainer';

export function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // 1. Initialize XTerm
    const term = new XTerm({
      cursorBlink: true,
      theme: {
        background: '#0d0d0d', // Match th̦e IDE's background
        foreground: '#ffffff',
      },̦
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    // Wait for the resizable panel to paint and provide dimensions
    const initTimeout = setTimeout(() => {
      if (terminalRef.current) {
        try {
          term.open(terminalRef.current);
          fitAddon.fit();
        } catch (e) {}
      }
    }, 50);
    
    xtermRef.current = term;

    // 2. Spawn the Shell Process
    async function startShell() {
      try {
        const wc = await getWebContainerInstance();
        
        // Ensure standard paths exist in WebContainer
        // so that shell prompt acts normally.
        const shellProcess = await wc.spawn('jsh', {
          terminal: {
            cols: term.cols,
            rows: term.rows,
          },
        });

        // Pipe Output to UI
        shellProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              term.write(data);
            },
          })
        );

        // Pipe Input to Shell
        const input = shellProcess.input.getWriter();
        term.onData((data) => {
          input.write(data);
        });

        // Handle Resizing
        const resizeObserver = new ResizeObserver(() => {
          try {
            fitAddon.fit();
            shellProcess.resize({
              cols: term.cols,
              rows: term.rows,
            });
          } catch(e) {}
        });
        
        if (terminalRef.current) {
          resizeObserver.observe(terminalRef.current);
        }

        return () => {
          resizeObserver.disconnect();
        };

      } catch(error) {
        console.error("Failed to boot webcontainer shell", error);
        term.write("\r\n\x1b[31mFailed to start terminal.\x1b[0m\r\n");
      }
    }

    startShell();

    return () => {
      clearTimeout(initTimeout);
      term.dispose();
    };
  }, []);

  return (
    <div className="h-full w-full bg-[#0d0d0d] p-2 overflow-hidden">
      <div ref={terminalRef} className="h-full w-full" />
    </div>
  );
}
