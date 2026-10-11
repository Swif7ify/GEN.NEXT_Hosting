'use client';

import React from 'react';
import { Header } from '../components/Header';
import { ServiceStatusSection } from '../components/ServiceStatusSection';
import { DatabasePlaygroundSection } from '../components/DatabasePlaygroundSection';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Service Status Section */}
        <ServiceStatusSection />

        {/* Database Playground Section */}
        <DatabasePlaygroundSection />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Deployment Playground — Multi-Cloud Connectivity</span>
          <span className="font-mono text-slate-400">Next.js 15 · Express · Supabase · MongoDB · Redis</span>
        </div>
      </footer>
    </div>
  );
}
