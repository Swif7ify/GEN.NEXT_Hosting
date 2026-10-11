'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { validateDemoName } from '../lib/nameValidator';
import {
  saveDemoRecord,
  getDemoRecords,
  DemoEntryRecord,
  RedisDemoRecord,
} from '../lib/apiClient';

export function DatabasePlaygroundSection() {
  // Form input state
  const [name, setName] = useState('Ada Lovelace');
  const [bypassFrontendValidation] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Loading indicator for active action
  const [activeAction, setActiveAction] = useState<string | null>(null);

  // Status banner for operation results
  const [banner, setBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Database stored data states
  const [supabaseRecords, setSupabaseRecords] = useState<DemoEntryRecord[]>([]);
  const [mongoRecords, setMongoRecords] = useState<DemoEntryRecord[]>([]);
  const [redisRecord, setRedisRecord] = useState<RedisDemoRecord | null>(null);

  // Auto-fetch existing records on initial load (pure async, no synchronous setState in effect)
  useEffect(() => {
    let active = true;

    async function loadInitial() {
      try {
        const [sub, mongo, redis] = await Promise.allSettled([
          getDemoRecords('supabase'),
          getDemoRecords('mongodb'),
          getDemoRecords('redis'),
        ]);

        if (!active) return;

        if (sub.status === 'fulfilled' && sub.value.success) {
          setSupabaseRecords((sub.value.records as DemoEntryRecord[]) || []);
        }
        if (mongo.status === 'fulfilled' && mongo.value.success) {
          setMongoRecords((mongo.value.records as DemoEntryRecord[]) || []);
        }
        if (redis.status === 'fulfilled' && redis.value.success) {
          setRedisRecord((redis.value.record as RedisDemoRecord) || null);
        }
      } catch {
        // silent initial load
      }
    }

    loadInitial();

    return () => {
      active = false;
    };
  }, []);

  // Manual refresh handlers triggered by user clicks
  const fetchSupabase = async () => {
    setActiveAction('fetch-supabase');
    try {
      const res = await getDemoRecords('supabase');
      if (res.success) {
        setSupabaseRecords((res.records as DemoEntryRecord[]) || []);
      }
    } catch {
      // silent
    } finally {
      setActiveAction(null);
    }
  };

  const fetchMongo = async () => {
    setActiveAction('fetch-mongo');
    try {
      const res = await getDemoRecords('mongodb');
      if (res.success) {
        setMongoRecords((res.records as DemoEntryRecord[]) || []);
      }
    } catch {
      // silent
    } finally {
      setActiveAction(null);
    }
  };

  const fetchRedis = async () => {
    setActiveAction('fetch-redis');
    try {
      const res = await getDemoRecords('redis');
      if (res.success) {
        setRedisRecord((res.record as RedisDemoRecord) || null);
      } else {
        setRedisRecord(null);
      }
    } catch {
      // silent
    } finally {
      setActiveAction(null);
    }
  };

  // Live client-side validation
  const clientValidation = useMemo(() => {
    if (bypassFrontendValidation) {
      return { isValid: true, error: null };
    }
    if (!name.trim()) {
      return { isValid: false, error: 'Name is required and cannot be blank.' };
    }
    const result = validateDemoName(name);
    if (!result.isValid) {
      return { isValid: false, error: result.error?.message || 'Invalid name.' };
    }
    return { isValid: true, error: null };
  }, [name, bypassFrontendValidation]);

  // Combined error displayed under the input
  const displayError = backendError || (!clientValidation.isValid ? clientValidation.error : null);

  const handleNameChange = (val: string) => {
    setName(val);
    if (backendError) setBackendError(null);
  };

  // ----------------------------------------------------
  // SUPABASE
  // ----------------------------------------------------
  const saveToSupabase = async () => {
    if (!bypassFrontendValidation && !clientValidation.isValid) return;
    setActiveAction('save-supabase');
    setBanner(null);
    setBackendError(null);

    try {
      const res = await saveDemoRecord('supabase', name);
      if (res.success && res.record) {
        setSupabaseRecords((prev) => [res.record as DemoEntryRecord, ...prev.filter((r) => r.id !== (res.record as DemoEntryRecord).id)]);
        setBanner({ type: 'success', message: `Saved "${name}" to Supabase PostgreSQL table "demo_entries".` });
      } else {
        const msg = res.error?.message || res.message || 'Supabase save failed';
        setBackendError(msg);
        setBanner({ type: 'error', message: `Supabase Error: ${msg}` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      setBanner({ type: 'error', message: `Network error: ${msg}` });
    } finally {
      setActiveAction(null);
    }
  };

  // ----------------------------------------------------
  // MONGODB
  // ----------------------------------------------------
  const saveToMongo = async () => {
    if (!bypassFrontendValidation && !clientValidation.isValid) return;
    setActiveAction('save-mongo');
    setBanner(null);
    setBackendError(null);

    try {
      const res = await saveDemoRecord('mongodb', name);
      if (res.success && res.record) {
        setMongoRecords((prev) => [res.record as DemoEntryRecord, ...prev.filter((r) => r.id !== (res.record as DemoEntryRecord).id)]);
        setBanner({ type: 'success', message: `Saved "${name}" to MongoDB collection "demo_entries".` });
      } else {
        const msg = res.error?.message || res.message || 'MongoDB save failed';
        setBackendError(msg);
        setBanner({ type: 'error', message: `MongoDB Error: ${msg}` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      setBanner({ type: 'error', message: `Network error: ${msg}` });
    } finally {
      setActiveAction(null);
    }
  };

  // ----------------------------------------------------
  // REDIS
  // ----------------------------------------------------
  const saveToRedis = async () => {
    if (!bypassFrontendValidation && !clientValidation.isValid) return;
    setActiveAction('save-redis');
    setBanner(null);
    setBackendError(null);

    try {
      const res = await saveDemoRecord('redis', name);
      if (res.success && res.record) {
        setRedisRecord(res.record as RedisDemoRecord);
        setBanner({ type: 'success', message: `Cached "${name}" in Redis with 300s TTL.` });
      } else {
        const msg = res.error?.message || res.message || 'Redis save failed';
        setBackendError(msg);
        setBanner({ type: 'error', message: `Redis Error: ${msg}` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      setBanner({ type: 'error', message: `Network error: ${msg}` });
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <section className="space-y-6">
      {/* Input Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="max-w-2xl">
          <label htmlFor="name-input" className="block text-sm font-semibold text-slate-900 mb-1">
            Name
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Enter a name to validate (1–50 characters, profanity filtered) and send to a target database.
          </p>

          <div className="space-y-2">
            <div className="relative">
              <input
                id="name-input"
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Marie Curie"
                maxLength={60}
                className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg outline-hidden transition-colors ${
                  displayError
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-100'
                }`}
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">
                {name.length}/50
              </span>
            </div>

            {/* Validation Message */}
            {displayError ? (
              <p className="text-xs font-medium text-rose-600 flex items-center gap-1.5 mt-1.5">
                <span>⚠️</span>
                <span>{displayError}</span>
              </p>
            ) : name.trim() ? (
              <p className="text-xs font-medium text-emerald-600 flex items-center gap-1.5 mt-1.5">
                <span>✓</span>
                <span>Valid name — ready to submit</span>
              </p>
            ) : null}

          
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={saveToSupabase}
              disabled={activeAction !== null || (!bypassFrontendValidation && !clientValidation.isValid)}
              className="px-4 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
            >
              {activeAction === 'save-supabase' ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Saving to Supabase...
                </>
              ) : (
                'Save to Supabase'
              )}
            </button>

            <button
              onClick={saveToMongo}
              disabled={activeAction !== null || (!bypassFrontendValidation && !clientValidation.isValid)}
              className="px-4 py-2 text-xs font-medium bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
            >
              {activeAction === 'save-mongo' ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Saving to MongoDB...
                </>
              ) : (
                'Save to MongoDB'
              )}
            </button>

            <button
              onClick={saveToRedis}
              disabled={activeAction !== null || (!bypassFrontendValidation && !clientValidation.isValid)}
              className="px-4 py-2 text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
            >
              {activeAction === 'save-redis' ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Caching in Redis...
                </>
              ) : (
                'Save to Redis (Cache)'
              )}
            </button>
          </div>
        </div>

        {/* Operation Banner */}
        {banner && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs font-medium border flex items-center justify-between ${
              banner.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <span>{banner.message}</span>
            <button
              onClick={() => setBanner(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer text-sm font-bold ml-3"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Database Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Supabase PostgreSQL Column */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h3 className="text-sm font-semibold text-slate-900">Supabase (PostgreSQL)</h3>
              </div>
              <button
                onClick={fetchSupabase}
                disabled={activeAction === 'fetch-supabase'}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
              >
                {activeAction === 'fetch-supabase' ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            <div className="text-xs text-slate-500 mb-3">
              Table: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">demo_entries</code> ({supabaseRecords.length} entries)
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {supabaseRecords.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No records found. Click &quot;Save to Supabase&quot; above.</p>
              ) : (
                supabaseRecords.map((r) => (
                  <div key={r.id} className="p-2 bg-slate-50 border border-slate-100 rounded-md text-xs flex justify-between items-center">
                    <span className="font-medium text-slate-800 truncate mr-2">{r.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(r.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* MongoDB Column */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <h3 className="text-sm font-semibold text-slate-900">MongoDB</h3>
              </div>
              <button
                onClick={fetchMongo}
                disabled={activeAction === 'fetch-mongo'}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
              >
                {activeAction === 'fetch-mongo' ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            <div className="text-xs text-slate-500 mb-3">
              Collection: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">demo_entries</code> ({mongoRecords.length} docs)
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {mongoRecords.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No documents found. Click &quot;Save to MongoDB&quot; above.</p>
              ) : (
                mongoRecords.map((r) => (
                  <div key={r.id} className="p-2 bg-slate-50 border border-slate-100 rounded-md text-xs flex justify-between items-center">
                    <span className="font-medium text-slate-800 truncate mr-2">{r.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(r.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Redis Column */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <h3 className="text-sm font-semibold text-slate-900">Redis (Cache)</h3>
              </div>
              <button
                onClick={fetchRedis}
                disabled={activeAction === 'fetch-redis'}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
              >
                {activeAction === 'fetch-redis' ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            <div className="text-xs text-slate-500 mb-3">
              Key: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">demo:playground:latest_entry</code>
            </div>

            <div className="min-h-24">
              {redisRecord ? (
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-md text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Cached Name:</span>
                    <span className="font-semibold text-slate-900">{redisRecord.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Remaining TTL:</span>
                    <span className="font-mono text-emerald-600 font-medium">{redisRecord.ttl_seconds}s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Saved At:</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(redisRecord.saved_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic py-2">No active cached key. Click &quot;Save to Redis&quot; above.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
