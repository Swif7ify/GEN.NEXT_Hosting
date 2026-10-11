import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/env.js';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!config.supabase.url || !config.supabase.key) {
    return null;
  }
  if (!client) {
    client = createClient(config.supabase.url, config.supabase.key, {
      auth: { persistSession: false },
    });
  }
  return client;
}

export interface ServiceCheckResult {
  status: 'connected' | 'unavailable' | 'not_configured' | 'error';
  latencyMs?: number;
  message: string;
  details?: Record<string, unknown>;
}

export async function checkSupabaseConnection(): Promise<ServiceCheckResult> {
  if (!config.supabase.url || !config.supabase.key) {
    console.warn('\x1b[33m[SUPABASE] Missing SUPABASE_URL or SUPABASE_ANON_KEY.\x1b[0m');
    return {
      status: 'not_configured',
      message: 'Supabase credentials are not configured (missing SUPABASE_URL or SUPABASE_ANON_KEY).',
    };
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('\x1b[31m[SUPABASE] Client initialization failed.\x1b[0m');
    return {
      status: 'not_configured',
      message: 'Supabase client could not be initialized.',
    };
  }

  const startTime = Date.now();
  try {
    console.log(`\x1b[34m[SUPABASE] Pinging Supabase project at ${new URL(config.supabase.url).hostname}...\x1b[0m`);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase request timed out after 5000ms')), 5000)
    );

    const queryPromise = supabase.from('demo_entries').select('id').limit(1);

    const result = await Promise.race([queryPromise, timeoutPromise]);
    const latencyMs = Date.now() - startTime;

    if (result.error) {
      if (result.error.code === '42P01' || result.error.message.includes('relation') || result.error.message.includes('does not exist')) {
        console.warn(`\x1b[33m[SUPABASE CONNECTED] Table "demo_entries" not yet created in PostgreSQL (${latencyMs}ms).\x1b[0m`);
        return {
          status: 'connected',
          latencyMs,
          message: 'Connected to Supabase PostgreSQL (Notice: demo_entries table not yet created).',
          details: { tableStatus: 'needs_table_creation' },
        };
      }
      console.error(`\x1b[31m[SUPABASE ERROR] ${result.error.message} (${latencyMs}ms)\x1b[0m`);
      return {
        status: 'error',
        latencyMs,
        message: 'Supabase responded with error: ' + (result.error.message || 'Unknown database error'),
      };
    }

    console.log(`\x1b[32m[SUPABASE SUCCESS] Ping OK (${latencyMs}ms)\x1b[0m`);
    return {
      status: 'connected',
      latencyMs,
      message: 'Successfully connected to Supabase PostgreSQL.',
    };
  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime;
    const msg = error instanceof Error ? error.message : 'Unknown connection error';
    console.error(`\x1b[31m[SUPABASE CONNECTION FAILED] ${msg} (${latencyMs}ms)\x1b[0m`);
    return {
      status: 'unavailable',
      latencyMs,
      message: 'Unable to reach Supabase: ' + msg,
    };
  }
}

export interface DemoEntry {
  id: string | number;
  name: string;
  created_at: string;
}

export async function saveSupabaseRecord(name: string): Promise<{ success: boolean; data?: DemoEntry; message: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase is not configured on the backend.',
    };
  }

  try {
    const { data, error } = await supabase
      .from('demo_entries')
      .insert([{ name }])
      .select('id, name, created_at')
      .single();

    if (error) {
      console.error(`\x1b[31m[SUPABASE INSERT ERROR] ${error.message} (code: ${error.code})\x1b[0m`);
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          success: false,
          message: 'Table "demo_entries" does not exist in Supabase. Please run: CREATE TABLE demo_entries (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, name text NOT NULL, created_at timestamp with time zone DEFAULT now());',
        };
      }
      return {
        success: false,
        message: 'Supabase insert failed: ' + error.message,
      };
    }

    console.log(`\x1b[32m[SUPABASE INSERT] Row inserted with ID: ${data.id}\x1b[0m`);
    return {
      success: true,
      data: data as DemoEntry,
      message: 'Record successfully saved to Supabase PostgreSQL.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`\x1b[31m[SUPABASE INSERT EXCEPTION] ${msg}\x1b[0m`);
    return {
      success: false,
      message: 'Failed to save to Supabase: ' + msg,
    };
  }
}

export async function getSupabaseRecords(): Promise<{ success: boolean; records: DemoEntry[]; message: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      records: [],
      message: 'Supabase is not configured on the backend.',
    };
  }

  try {
    const { data, error } = await supabase
      .from('demo_entries')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error(`\x1b[31m[SUPABASE QUERY ERROR] ${error.message}\x1b[0m`);
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          success: false,
          records: [],
          message: 'Table "demo_entries" does not exist yet in Supabase.',
        };
      }
      return {
        success: false,
        records: [],
        message: 'Supabase query failed: ' + error.message,
      };
    }

    console.log(`\x1b[32m[SUPABASE QUERY] Retrieved ${(data || []).length} rows.\x1b[0m`);
    return {
      success: true,
      records: (data || []) as DemoEntry[],
      message: 'Successfully retrieved records from Supabase.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`\x1b[31m[SUPABASE QUERY EXCEPTION] ${msg}\x1b[0m`);
    return {
      success: false,
      records: [],
      message: 'Failed to retrieve records from Supabase: ' + msg,
    };
  }
}
