import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {
  Terminal as TerminalIcon,
  RotateCcw,
  Sparkles,
  Wifi,
  WifiOff,
  Trash2,
  Maximize2,
} from 'lucide-react';

export const TerminalPane = ({ session }) => {
  const terminalRef = useRef(null);
  const xtermInstance = useRef(null);
  const fitAddonInstance = useRef(null);
  const socketRef = useRef(null);

  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected'
  const [sessionMeta, setSessionMeta] = useState({
    mode: session?.mode || 'simulation',
    namespace: session?.namespace || '',
  });

  const connectWebSocket = useCallback(() => {
    if (!session?.labId) return;

    // Retrieve JWT auth token
    const token = localStorage.getItem('token');
    if (!token) {
      setConnectionStatus('disconnected');
      if (xtermInstance.current) {
        xtermInstance.current.writeln('\r\n\x1b[31m[Authentication Error] No JWT token found. Please log in again.\x1b[0m\r\n');
      }
      return;
    }

    setConnectionStatus('connecting');

    // Close any previous socket
    if (socketRef.current) {
      socketRef.current.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:5000' : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/terminal?token=${encodeURIComponent(token)}&labId=${encodeURIComponent(session.labId)}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ready') {
          setSessionMeta({
            mode: msg.mode,
            namespace: msg.namespace,
          });
        } else if (msg.type === 'output' && xtermInstance.current) {
          xtermInstance.current.write(msg.data);
        } else if (msg.type === 'error' && xtermInstance.current) {
          xtermInstance.current.writeln(`\r\n\x1b[31m[Server Error] ${msg.message}\x1b[0m\r\n`);
        }
      } catch (err) {
        // Fallback for raw text output
        if (xtermInstance.current) {
          xtermInstance.current.write(event.data);
        }
      }
    };

    ws.onclose = (e) => {
      setConnectionStatus('disconnected');
      if (xtermInstance.current && e.code !== 1000) {
        xtermInstance.current.writeln(`\r\n\x1b[33m[Connection Closed] Terminal disconnected (Code: ${e.code}). Click Reconnect to resume.\x1b[0m\r\n`);
      }
    };

    ws.onerror = (err) => {
      console.error('[TerminalPane] WebSocket error:', err);
      setConnectionStatus('disconnected');
    };
  }, [session?.labId]);

  // Initialize xterm.js instance
  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 12,
      lineHeight: 1.25,
      theme: {
        background: '#020617', // slate-950
        foreground: '#e2e8f0', // slate-200
        cursor: '#38bdf8', // sky-400
        cursorAccent: '#020617',
        selectionBackground: '#334155',
        black: '#0f172a',
        red: '#f43f5e',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#d946ef',
        cyan: '#06b6d4',
        white: '#f8fafc',
        brightBlack: '#475569',
        brightRed: '#fb7185',
        brightGreen: '#34d399',
        brightYellow: '#fbbf24',
        brightBlue: '#60a5fa',
        brightMagenta: '#e879f9',
        brightCyan: '#22d3ee',
        brightWhite: '#ffffff',
      },
      convertEol: true,
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermInstance.current = term;
    fitAddonInstance.current = fitAddon;

    // Forward user keystrokes over WebSocket
    term.onData((data) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'input', data }));
      }
    });

    // Resize observer to auto-fit terminal whenever container dimensions change
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(
            JSON.stringify({
              type: 'resize',
              cols: term.cols,
              rows: term.rows,
            })
          );
        }
      } catch (e) {}
    });

    resizeObserver.observe(terminalRef.current);

    connectWebSocket();

    return () => {
      resizeObserver.disconnect();
      if (socketRef.current) {
        socketRef.current.close();
      }
      term.dispose();
    };
  }, [connectWebSocket]);

  const handleClear = () => {
    if (xtermInstance.current) {
      xtermInstance.current.clear();
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'input', data: '\x0c' }));
      }
    }
  };

  return (
    <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 flex flex-col overflow-hidden font-mono text-xs shadow-2xl">
      {/* Terminal Header Bar */}
      <div className="bg-slate-900 px-3 py-2 border-b border-slate-800 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          {/* macOS style dots */}
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>

          <span className="text-[11px] text-slate-300 font-sans ml-2 flex items-center gap-1.5 font-semibold">
            <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
            Interactive Linux Shell (kubectl CLI)
          </span>

          {/* Connection Status Pill */}
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${
              connectionStatus === 'connected'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : connectionStatus === 'connecting'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : connectionStatus === 'connecting'
                  ? 'bg-amber-400 animate-spin'
                  : 'bg-rose-400'
              }`}
            ></span>
            {connectionStatus === 'connected'
              ? 'Connected'
              : connectionStatus === 'connecting'
              ? 'Connecting...'
              : 'Disconnected'}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {sessionMeta.namespace && (
            <span className="hidden md:inline-block text-[10px] font-mono text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              ns: {sessionMeta.namespace}
            </span>
          )}

          <button
            type="button"
            onClick={handleClear}
            title="Clear Terminal Screen (Ctrl+L)"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={connectWebSocket}
            title="Reconnect Terminal Session"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* xterm.js DOM Mount Surface */}
      <div className="flex-1 p-2 bg-slate-950 overflow-hidden relative">
        <div ref={terminalRef} className="w-full h-full" />
      </div>

      {/* Terminal Footer Bar */}
      <div className="p-2 bg-slate-900/90 border-t border-slate-800 text-[11px] font-sans text-slate-400 flex items-center justify-between shrink-0 select-none">
        <span className="flex items-center gap-1.5 text-cyan-300 font-mono text-[10px]">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          {sessionMeta.mode === 'kubernetes'
            ? 'Live Kubernetes Cluster Shell (Strict Namespace RBAC Active)'
            : 'Interactive Simulation Sandbox (Telemetry Grounded)'}
        </span>
        <span className="text-[10px] font-mono text-slate-500">PART 4 TERMINAL</span>
      </div>
    </div>
  );
};

export default TerminalPane;
