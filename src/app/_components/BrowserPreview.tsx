"use client";
import { useEffect, useRef, useState } from 'react';
import { getWebContainerInstance } from '@/lib/utils/webcontainer';
import { Globe, RefreshCw, ExternalLink, Loader2 } from 'lucide-react';

export function BrowserPreview() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [port, setPort] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function listenForServer() {
      const wc = await getWebContainerInstance();

      wc.on('server-ready', (serverPort: number, url: string) => {
        if (cancelled) return;
        setPort(serverPort);
        setPreviewUrl(url);
        setIsLoading(false);
      });

      // Also listen for port events to show loading state
      wc.on('port', (portNumber: number, type: string) => {
        if (cancelled) return;
        if (type === 'open') {
          setIsLoading(true);
        }
      });
    }

    listenForServer();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleRefresh() {
    if (iframeRef.current && previewUrl) {
      setIsLoading(true);
      iframeRef.current.src = previewUrl;
    }
  }

  function handleOpenExternal() {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#0d0d0d]">
      {/* Browser Chrome Bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#111111] border-b border-slate-800 shrink-0">
        <Globe size={12} className="text-slate-500" />
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 h-7 px-3 rounded-md bg-slate-900/80 border border-slate-800 flex items-center text-[11px] text-slate-400 font-mono truncate select-all">
            {previewUrl || 'No server running...'}
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={!previewUrl}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Refresh preview"
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
        </button>
        <button
          onClick={handleOpenExternal}
          disabled={!previewUrl}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Open in new tab"
        >
          <ExternalLink size={12} />
        </button>
      </div>

      {/* Preview Area */}
      <div className="flex-1 relative">
        {previewUrl ? (
          <>
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d0d0d]/80 backdrop-blur-sm">
                <Loader2 size={24} className="text-indigo-400 animate-spin" />
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full h-full border-0 bg-white"
              title="Browser Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              onLoad={() => setIsLoading(false)}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full space-y-4 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-500/5 via-transparent to-transparent">
            <div className="relative">
              <div className="absolute -inset-3 bg-slate-500/10 rounded-full blur-2xl animate-pulse" />
              <div className="relative h-14 w-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                <Globe size={24} className="text-slate-600" />
              </div>
            </div>
            <div className="text-center space-y-1.5 max-w-xs px-4">
              <p className="text-xs font-semibold text-slate-400">No Preview Available</p>
              <p className="text-[10px] text-slate-600 leading-relaxed">
                Run a dev server in the terminal (e.g. <code className="px-1 py-0.5 rounded bg-slate-800 text-indigo-400">npm run dev</code>) to see the live preview here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
