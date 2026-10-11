'use client';

import React, { useState } from 'react';
import { fetchSingleServiceStatus, fetchAllServicesStatus } from '../lib/apiClient';

interface ServiceItem {
  id: 'api' | 'supabase' | 'mongodb' | 'redis';
  title: string;
  type: string;
  status: 'idle' | 'checking' | 'connected' | 'unavailable' | 'not_configured' | 'error';
  latencyMs?: number;
  message: string;
}

const INITIAL_SERVICES: Record<'api' | 'supabase' | 'mongodb' | 'redis', ServiceItem> = {
  api: {
    id: 'api',
    title: 'Express REST API',
    type: 'Backend Server',
    status: 'idle',
    message: 'Ready to check connection.',
  },
  supabase: {
    id: 'supabase',
    title: 'Supabase',
    type: 'PostgreSQL Database',
    status: 'idle',
    message: 'Ready to check connection.',
  },
  mongodb: {
    id: 'mongodb',
    title: 'MongoDB',
    type: 'Document Database',
    status: 'idle',
    message: 'Ready to check connection.',
  },
  redis: {
    id: 'redis',
    title: 'Redis',
    type: 'Key-Value Cache',
    status: 'idle',
    message: 'Ready to check connection.',
  },
};

export function ServiceStatusSection() {
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [checkingAll, setCheckingAll] = useState(false);

  const checkSingle = async (id: 'api' | 'supabase' | 'mongodb' | 'redis') => {
    setServices((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: 'checking', message: 'Checking connectivity...' },
    }));

    try {
      const res = await fetchSingleServiceStatus(id);
      setServices((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          status: res.status || 'connected',
          latencyMs: res.latencyMs,
          message: res.message || 'Connected successfully.',
        },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setServices((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          status: 'unavailable',
          message: msg,
        },
      }));
    }
  };

  const handleCheckAll = async () => {
    setCheckingAll(true);
    setServices((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        const key = k as 'api' | 'supabase' | 'mongodb' | 'redis';
        updated[key] = { ...updated[key], status: 'checking', message: 'Checking...' };
      });
      return updated;
    });

    try {
      const res = await fetchAllServicesStatus();
      if (res.services) {
        setServices((prev) => ({
          api: {
            ...prev.api,
            status: res.services!.api.status,
            latencyMs: res.services!.api.latencyMs,
            message: res.services!.api.message,
          },
          supabase: {
            ...prev.supabase,
            status: res.services!.supabase.status,
            latencyMs: res.services!.supabase.latencyMs,
            message: res.services!.supabase.message,
          },
          mongodb: {
            ...prev.mongodb,
            status: res.services!.mongodb.status,
            latencyMs: res.services!.mongodb.latencyMs,
            message: res.services!.mongodb.message,
          },
          redis: {
            ...prev.redis,
            status: res.services!.redis.status,
            latencyMs: res.services!.redis.latencyMs,
            message: res.services!.redis.message,
          },
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Check all failed';
      setServices((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((k) => {
          const key = k as 'api' | 'supabase' | 'mongodb' | 'redis';
          updated[key] = { ...updated[key], status: 'unavailable', message: msg };
        });
        return updated;
      });
    } finally {
      setCheckingAll(false);
    }
  };

  const renderStatusBadge = (status: ServiceItem['status'], latency?: number) => {
    switch (status) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Connected {latency !== undefined ? `(${latency}ms)` : ''}
          </span>
        );
      case 'checking':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
            Checking...
          </span>
        );
      case 'unavailable':
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Unavailable
          </span>
        );
      case 'not_configured':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Not Configured
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Idle
          </span>
        );
    }
  };

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Service Status</h2>
          <p className="text-xs text-slate-500">Live connectivity checks across backend and database services</p>
        </div>
        <button
          onClick={handleCheckAll}
          disabled={checkingAll}
          className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          {checkingAll ? 'Checking All...' : 'Check All Services'}
        </button>
      </div>

      {/* Grid of 4 services */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(services) as Array<'api' | 'supabase' | 'mongodb' | 'redis'>).map((id) => {
          const item = services[id];
          const isBusy = item.status === 'checking';

          return (
            <div
              key={id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-slate-900 text-sm">{item.title}</h3>
                  {renderStatusBadge(item.status, item.latencyMs)}
                </div>
                <div className="text-xs text-slate-500 mb-2">{item.type}</div>
                <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px] bg-slate-50 p-2 rounded-md border border-slate-100">
                  {item.message}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  {item.latencyMs !== undefined ? `${item.latencyMs}ms response` : 'No ping yet'}
                </span>
                <button
                  onClick={() => checkSingle(id)}
                  disabled={isBusy || checkingAll}
                  className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isBusy ? 'Checking...' : 'Check'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
