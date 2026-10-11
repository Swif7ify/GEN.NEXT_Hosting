'use client';

import React, { useState } from 'react';
import { fetchSingleServiceStatus, fetchAllServicesStatus, ServiceDetail } from '../lib/apiClient';

interface ServiceCardData {
  id: 'api' | 'supabase' | 'mongodb' | 'redis';
  title: string;
  category: string;
  description: string;
  docHint: string;
  status: 'idle' | 'checking' | 'connected' | 'unavailable' | 'not_configured' | 'error';
  latencyMs?: number;
  message: string;
  configured: boolean;
}

const INITIAL_SERVICES: Record<'api' | 'supabase' | 'mongodb' | 'redis', ServiceCardData> = {
  api: {
    id: 'api',
    title: 'Express REST API',
    category: 'Backend Liveness',
    description: 'Core REST API service hosted on Render or Coolify.',
    docHint: 'Runs on port 5000. Proxied through Next.js App Router.',
    status: 'idle',
    message: 'Click "Check Connection" to test backend reachability.',
    configured: true,
  },
  supabase: {
    id: 'supabase',
    title: 'Supabase',
    category: 'Relational Database',
    description: 'PostgreSQL database with row-level security and SQL transactions.',
    docHint: 'Requires SUPABASE_URL and SUPABASE_ANON_KEY on the backend.',
    status: 'idle',
    message: 'Click "Check Connection" to test PostgreSQL connectivity.',
    configured: false,
  },
  mongodb: {
    id: 'mongodb',
    title: 'MongoDB',
    category: 'Document Database',
    description: 'NoSQL document store for semi-structured demonstration entities.',
    docHint: 'Requires MONGODB_URI on the backend.',
    status: 'idle',
    message: 'Click "Check Connection" to test MongoDB Atlas/cluster connectivity.',
    configured: false,
  },
  redis: {
    id: 'redis',
    title: 'Redis',
    category: 'In-Memory Cache / Key-Value',
    description: 'Low-latency in-memory data store with automatic TTL key expiration.',
    docHint: 'Requires REDIS_URL on the backend.',
    status: 'idle',
    message: 'Click "Check Connection" to ping the Redis cache instance.',
    configured: false,
  },
};

interface ServiceStatusSectionProps {
  onLog?: (entry: { type: 'info' | 'success' | 'error'; message: string }) => void;
}

export function ServiceStatusSection({ onLog }: ServiceStatusSectionProps) {
  const [services, setServices] = useState<Record<string, ServiceCardData>>(INITIAL_SERVICES);
  const [isCheckingAll, setIsCheckingAll] = useState(false);

  const checkSingle = async (serviceId: 'api' | 'supabase' | 'mongodb' | 'redis') => {
    setServices((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        status: 'checking',
        message: 'Verifying connectivity with backend...',
      },
    }));

    onLog?.({ type: 'info', message: `Checking connectivity for ${services[serviceId].title}...` });

    try {
      const result: ServiceDetail = await fetchSingleServiceStatus(serviceId);
      setServices((prev) => ({
        ...prev,
        [serviceId]: {
          ...prev[serviceId],
          status: result.status,
          latencyMs: result.latencyMs,
          message: result.message,
          configured: result.configured,
        },
      }));

      if (result.status === 'connected') {
        onLog?.({
          type: 'success',
          message: `${services[serviceId].title} is CONNECTED (${result.latencyMs ? result.latencyMs + 'ms' : 'active'})`,
        });
      } else if (result.status === 'not_configured') {
        onLog?.({
          type: 'info',
          message: `${services[serviceId].title} is NOT CONFIGURED (backend credentials missing)`,
        });
      } else {
        onLog?.({
          type: 'error',
          message: `${services[serviceId].title} check result: ${result.status} — ${result.message}`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection test failed';
      setServices((prev) => ({
        ...prev,
        [serviceId]: {
          ...prev[serviceId],
          status: 'unavailable',
          message: msg,
        },
      }));
      onLog?.({
        type: 'error',
        message: `${services[serviceId].title} is UNAVAILABLE: ${msg}`,
      });
    }
  };

  const checkAll = async () => {
    setIsCheckingAll(true);
    onLog?.({ type: 'info', message: 'Triggering simultaneous health checks across all services...' });

    // Mark all as checking
    setServices((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        updated[k] = { ...updated[k], status: 'checking', message: 'Querying status...' };
      });
      return updated;
    });

    try {
      const allResults = await fetchAllServicesStatus();
      if (allResults.services) {
        setServices((prev) => ({
          api: {
            ...prev.api,
            status: allResults.services!.api.status,
            latencyMs: allResults.services!.api.latencyMs,
            message: allResults.services!.api.message,
            configured: allResults.services!.api.configured,
          },
          supabase: {
            ...prev.supabase,
            status: allResults.services!.supabase.status,
            latencyMs: allResults.services!.supabase.latencyMs,
            message: allResults.services!.supabase.message,
            configured: allResults.services!.supabase.configured,
          },
          mongodb: {
            ...prev.mongodb,
            status: allResults.services!.mongodb.status,
            latencyMs: allResults.services!.mongodb.latencyMs,
            message: allResults.services!.mongodb.message,
            configured: allResults.services!.mongodb.configured,
          },
          redis: {
            ...prev.redis,
            status: allResults.services!.redis.status,
            latencyMs: allResults.services!.redis.latencyMs,
            message: allResults.services!.redis.message,
            configured: allResults.services!.redis.configured,
          },
        }));
        onLog?.({ type: 'success', message: 'All service status checks completed.' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to query service status';
      onLog?.({ type: 'error', message: `Bulk status check error: ${msg}` });
      // Mark API as unavailable
      setServices((prev) => ({
        ...prev,
        api: {
          ...prev.api,
          status: 'unavailable',
          message: 'Unable to reach backend API. Ensure Express is running on port 5000.',
        },
      }));
    } finally {
      setIsCheckingAll(false);
    }
  };

  const getStatusBadge = (status: ServiceCardData['status']) => {
    switch (status) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Connected
          </span>
        );
      case 'not_configured':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Not Configured
          </span>
        );
      case 'unavailable':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            Unavailable
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            Error
          </span>
        );
      case 'checking':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            Checking...
          </span>
        );
      case 'idle':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            Unchecked
          </span>
        );
    }
  };

  return (
    <section className="mb-10" aria-labelledby="service-status-heading">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <h2 id="service-status-heading" className="text-base font-bold text-slate-100 tracking-wide uppercase">
              Section A: Service Status
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time live connectivity checks. Indicators reflect actual network responses, never synthetic mocks.
          </p>
        </div>

        <button
          id="btn-check-all-services"
          onClick={checkAll}
          disabled={isCheckingAll}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer"
        >
          {isCheckingAll ? (
            <>
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              Checking All Services...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Check All Services
            </>
          )}
        </button>
      </div>

      {/* Grid of 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(services) as Array<'api' | 'supabase' | 'mongodb' | 'redis'>).map((key) => {
          const item = services[key];
          return (
            <div
              key={item.id}
              id={`service-card-${item.id}`}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm"
            >
              <div>
                {/* Header of card */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      {item.category}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                      {item.title}
                    </h3>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                  {item.description}
                </p>

                {/* Status Message Box */}
                <div
                  className={`p-2.5 rounded-lg text-xs font-mono mb-3 border ${
                    item.status === 'connected'
                      ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                      : item.status === 'not_configured'
                      ? 'bg-amber-950/30 border-amber-800/40 text-amber-300'
                      : item.status === 'unavailable' || item.status === 'error'
                      ? 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Status Response</span>
                    {item.latencyMs !== undefined && (
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        {item.latencyMs} ms
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed break-words">{item.message}</p>
                </div>
              </div>

              {/* Card Footer with Action */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400 truncate font-mono">
                  {item.configured ? 'Env: Configured' : 'Env: Missing'}
                </span>
                <button
                  id={`btn-check-${item.id}`}
                  onClick={() => checkSingle(item.id)}
                  disabled={item.status === 'checking' || isCheckingAll}
                  className="px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded border border-slate-700 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
                >
                  {item.status === 'checking' ? 'Testing...' : 'Check Connection'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400 mt-2 italic">
        * Health checks are on-demand to avoid redundant polling and preserve server resources.
      </p>
    </section>
  );
}
