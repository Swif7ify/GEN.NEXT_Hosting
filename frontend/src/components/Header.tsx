'use client';

import React from 'react';

export function Header() {
  return (
    <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Title and Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-mono font-bold text-white shadow-md shadow-indigo-500/20">
            DP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">Deployment Playground</h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Single-Page Console
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cross-Platform Connectivity & Real Validation Benchmark
            </p>
          </div>
        </div>

        {/* Deployment Pipeline Flow */}
        <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-950/80 px-3 py-1.5 rounded-md border border-slate-800 text-slate-300 overflow-x-auto">
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Browser
          </span>
          <span className="text-slate-600">→</span>
          <span className="text-cyan-400">Next.js (Vercel)</span>
          <span className="text-slate-600">→</span>
          <span className="text-purple-400">Express API (Render / Coolify)</span>
          <span className="text-slate-600">→</span>
          <span className="text-amber-400">Databases & Cache</span>
        </div>
      </div>
    </header>
  );
}
