import { Redis } from 'ioredis';
import { config } from '../config/env.js';
import { ServiceCheckResult } from './supabase.js';

const DEMO_CACHE_KEY = 'demo:playground:latest_entry';
const DEFAULT_TTL_SECONDS = 300; // 5 minutes TTL

export function createRedisClient(): Redis | null {
  if (!config.redis.url) {
    return null;
  }

  try {
    const isTls = config.redis.url.startsWith('rediss://') || config.redis.url.includes('upstash.io');
    const client = new Redis(config.redis.url, {
      connectTimeout: 5000,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      retryStrategy: () => null,
      ...(isTls && !config.redis.url.startsWith('rediss://') ? { tls: {} } : {}),
    });
    return client;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\x1b[31m[REDIS CLIENT INIT ERROR] ${msg}\x1b[0m`);
    return null;
  }
}

export async function checkRedisConnection(): Promise<ServiceCheckResult> {
  if (!config.redis.url) {
    console.warn('\x1b[33m[REDIS] Missing REDIS_URL in environment.\x1b[0m');
    return {
      status: 'not_configured',
      message: 'Redis connection URL is not configured (missing REDIS_URL in backend .env).',
    };
  }

  const startTime = Date.now();
  const client = createRedisClient();
  if (!client) {
    console.error('\x1b[31m[REDIS] Failed to construct client.\x1b[0m');
    return {
      status: 'not_configured',
      message: 'Unable to initialize Redis client from REDIS_URL.',
    };
  }

  try {
    console.log(`\x1b[34m[REDIS] Pinging Redis instance...\x1b[0m`);
    await client.connect();
    const pong = await client.ping();
    const latencyMs = Date.now() - startTime;

    console.log(`\x1b[32m[REDIS SUCCESS] Ping OK: ${pong} (${latencyMs}ms)\x1b[0m`);
    return {
      status: 'connected',
      latencyMs,
      message: `Successfully connected to Redis instance (ping response: ${pong}).`,
    };
  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime;
    const msg = error instanceof Error ? error.message : 'Unknown Redis connection error';
    console.error(`\x1b[31m[REDIS CONNECTION FAILED] ${msg} (${latencyMs}ms)\x1b[0m`);
    return {
      status: 'unavailable',
      latencyMs,
      message: 'Unable to reach Redis: ' + msg,
    };
  } finally {
    try {
      await client.quit();
    } catch {
      client.disconnect();
    }
  }
}

export interface RedisDemoEntry {
  key: string;
  name: string;
  saved_at: string;
  ttl_seconds: number;
  explanation: string;
}

export async function saveRedisRecord(name: string): Promise<{ success: boolean; data?: RedisDemoEntry; message: string }> {
  if (!config.redis.url) {
    return {
      success: false,
      message: 'Redis is not configured on the backend.',
    };
  }

  const client = createRedisClient();
  if (!client) {
    return {
      success: false,
      message: 'Redis client initialization failed.',
    };
  }

  try {
    await client.connect();
    const now = new Date().toISOString();
    const payload = JSON.stringify({
      name,
      saved_at: now,
    });

    await client.set(DEMO_CACHE_KEY, payload, 'EX', DEFAULT_TTL_SECONDS);
    const ttl = await client.ttl(DEMO_CACHE_KEY);

    console.log(`\x1b[32m[REDIS SET] Key "${DEMO_CACHE_KEY}" set (name: "${name}", TTL: ${ttl}s)\x1b[0m`);

    return {
      success: true,
      data: {
        key: DEMO_CACHE_KEY,
        name,
        saved_at: now,
        ttl_seconds: ttl > 0 ? ttl : DEFAULT_TTL_SECONDS,
        explanation: 'Redis stores this entry as an in-memory key-value pair with an automatic 300-second TTL to keep demo environments clean.',
      },
      message: 'Value successfully stored in Redis with 300s TTL.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`\x1b[31m[REDIS SET ERROR] ${msg}\x1b[0m`);
    return {
      success: false,
      message: 'Failed to save value in Redis: ' + msg,
    };
  } finally {
    try {
      await client.quit();
    } catch {
      client.disconnect();
    }
  }
}

export async function getRedisRecord(): Promise<{ success: boolean; data?: RedisDemoEntry | null; message: string }> {
  if (!config.redis.url) {
    return {
      success: false,
      data: null,
      message: 'Redis is not configured on the backend.',
    };
  }

  const client = createRedisClient();
  if (!client) {
    return {
      success: false,
      data: null,
      message: 'Redis client initialization failed.',
    };
  }

  try {
    await client.connect();
    const raw = await client.get(DEMO_CACHE_KEY);
    if (!raw) {
      console.log(`\x1b[34m[REDIS GET] Key "${DEMO_CACHE_KEY}" does not exist or expired.\x1b[0m`);
      return {
        success: true,
        data: null,
        message: 'No active demo key found in Redis (it may have expired or not yet been set).',
      };
    }

    const ttl = await client.ttl(DEMO_CACHE_KEY);
    const parsed = JSON.parse(raw);

    console.log(`\x1b[32m[REDIS GET] Found key "${DEMO_CACHE_KEY}" (name: "${parsed.name}", remaining TTL: ${ttl}s)\x1b[0m`);

    return {
      success: true,
      data: {
        key: DEMO_CACHE_KEY,
        name: parsed.name,
        saved_at: parsed.saved_at,
        ttl_seconds: ttl,
        explanation: 'Redis is serving this value directly from RAM memory cache.',
      },
      message: 'Successfully retrieved cached key from Redis.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`\x1b[31m[REDIS GET ERROR] ${msg}\x1b[0m`);
    return {
      success: false,
      data: null,
      message: 'Failed to retrieve value from Redis: ' + msg,
    };
  } finally {
    try {
      await client.quit();
    } catch {
      client.disconnect();
    }
  }
}
