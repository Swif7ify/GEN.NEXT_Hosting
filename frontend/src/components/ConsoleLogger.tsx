'use client';

import React, { useState } from 'react';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error';
  message: string;
}

interface ConsoleLoggerProps {
  logs: LogEntry[];
  onClear: () => void;
}

export function ConsoleLogger({ logs, onClear }: ConsoleLoggerProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm mb-10">
      {/* Header */}
      <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
          <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            Network Activity & Verification Log
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            {logs.length} events
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="text-[11px] font-mono text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
          >
            Clear Log
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-[11px] font-mono text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
          >
            {isOpen ? 'Minimize' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Terminal View */}
      {isOpen && (
        <div className="p-3 bg-slate-950 font-mono text-xs max-h-56 overflow-y-auto space-y-1.5 selection:bg-slate-800">
          {logs.length === 0 ? (
            <div className="text-slate-400 text-center py-4 italic text-[11px]">
              No network events logged yet. Perform a connection check or database operation above.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-[10px] text-slate-400 select-none flex-shrink-0">
                  [{log.timestamp}]
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-1 rounded flex-shrink-0 select-none ${
                    log.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : log.type === 'error'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  }`}
                >
                  {log.type}
                </span>
                <span
                  className={`break-all ${
                    log.type === 'success'
                      ? 'text-emerald-300'
                      : log.type === 'error'
                      ? 'text-rose-300'
                      : 'text-slate-300'
                  }`}
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
