import {
  ServiceDetail,
  ServicesStatusResponse,
  ApiResponse,
} from './types';

function cleanBaseUrl(url: string): string {
  let cleaned = url.trim();
  if (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1);
  }
  return cleaned;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 7000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms. Check server status and IP address.`);
    }
    throw err;
  }
}

export async function fetchAllServicesStatus(baseUrl: string): Promise<ServicesStatusResponse> {
  const target = `${cleanBaseUrl(baseUrl)}/api/services/status`;
  const res = await fetchWithTimeout(target, { method: 'GET' });
  const data = await res.json();
  if (!res.ok && !data.services) {
    throw new Error(data.message || `Services check failed (${res.status})`);
  }
  return data;
}

export async function fetchSingleServiceStatus(
  baseUrl: string,
  service: 'api' | 'supabase' | 'mongodb' | 'redis'
): Promise<ServiceDetail> {
  const target = `${cleanBaseUrl(baseUrl)}/api/services/status?service=${service}`;
  try {
    const res = await fetchWithTimeout(target, { method: 'GET' });
    const data = await res.json();
    if (!res.ok && !data.status) {
      return {
        name: service.toUpperCase(),
        status: 'unavailable',
        configured: false,
        message: data.message || `Failed to check ${service} (${res.status})`,
      };
    }
    return {
      name:
        service === 'api'
          ? 'Express REST API'
          : service === 'supabase'
          ? 'Supabase (PostgreSQL)'
          : service === 'mongodb'
          ? 'MongoDB'
          : 'Redis (Cache)',
      status: data.status || 'unavailable',
      configured: Boolean(data.configured),
      latencyMs: data.latencyMs,
      message: data.message || 'Connected successfully.',
      details: data.details,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network connection error';
    return {
      name: service.toUpperCase(),
      status: 'unavailable',
      configured: false,
      message,
    };
  }
}

export async function checkApiHealth(baseUrl: string): Promise<{ status: string; uptime: number; timestamp: string }> {
  const target = `${cleanBaseUrl(baseUrl)}/api/health`;
  const res = await fetchWithTimeout(target, { method: 'GET' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Health check failed (${res.status})`);
  }
  return res.json();
}

export async function saveDemoRecord(
  baseUrl: string,
  service: 'supabase' | 'mongodb' | 'redis',
  name: string
): Promise<ApiResponse> {
  const target = `${cleanBaseUrl(baseUrl)}/api/demo/${service}`;
  const res = await fetchWithTimeout(target, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  const data = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response from server' }));
  return data;
}

export async function getDemoRecords(
  baseUrl: string,
  service: 'supabase' | 'mongodb' | 'redis'
): Promise<ApiResponse> {
  const target = `${cleanBaseUrl(baseUrl)}/api/demo/${service}`;
  const res = await fetchWithTimeout(target, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });
  const data = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response from server' }));
  return data;
}
