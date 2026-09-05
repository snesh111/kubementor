import React from 'react';
import { Terminal as TerminalIcon, Copy } from 'lucide-react';

export const TerminalView = ({ title = 'kubectl logs -f pod/backend-deployment-8594-x9z', logs = '' }) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl font-mono text-sm">
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <span className="text-xs text-slate-400 font-sans ml-2 flex items-center gap-1.5">
            <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
            {title}
          </span>
        </div>
        <button className="text-slate-500 hover:text-slate-300 transition-colors">
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-4 text-slate-300 max-h-96 overflow-y-auto space-y-1 bg-slate-950">
        {logs ? (
          <pre className="whitespace-pre-wrap leading-relaxed text-xs text-cyan-300">{logs}</pre>
        ) : (
          <p className="text-slate-600 text-xs italic">
            [Ready] Waiting for output or log stream initialization...
          </p>
        )}
      </div>
    </div>
  );
};

export default TerminalView;
