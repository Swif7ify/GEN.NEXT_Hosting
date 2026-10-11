export type ServiceStatusType = 'connected' | 'unavailable' | 'not_configured' | 'error' | 'checking';

export interface ServiceDetail {
  name: string;
  status: ServiceStatusType;
  configured: boolean;
  latencyMs?: number;
  message: string;
  details?: Record<string, unknown>;
}

export interface ServicesStatusResponse {
  checkedAt?: string;
  services?: {
    api: ServiceDetail;
    supabase: ServiceDetail;
    mongodb: ServiceDetail;
    redis: ServiceDetail;
  };
  // When querying single service
  service?: string;
  status?: ServiceStatusType;
  configured?: boolean;
  latencyMs?: number;
  message?: string;
}

export interface DemoEntryRecord {
  id: string | number;
  name: string;
  created_at: string;
}

export interface RedisDemoRecord {
  key: string;
  name: string;
  saved_at: string;
  ttl_seconds: number;
  explanation: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: {
    field?: string;
    message: string;
  };
  record?: T;
  records?: T[];
  status?: string;
}

const API_BASE = '/api';

export async function fetchAllServicesStatus(): Promise<ServicesStatusResponse> {
  const res = await fetch(`${API_BASE}/services/status`, { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok && !data.services) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

export async function fetchSingleServiceStatus(service: 'api' | 'supabase' | 'mongodb' | 'redis'): Promise<ServiceDetail> {
  const res = await fetch(`${API_BASE}/services/status?service=${service}`, { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok && !data.status) {
    return {
      name: service.toUpperCase(),
      status: 'unavailable',
      configured: false,
      message: data.message || `Failed to check ${service} status (${res.status})`,
    };
  }
  return {
    name: service === 'api' ? 'Express REST API' : service === 'supabase' ? 'Supabase' : service === 'mongodb' ? 'MongoDB' : 'Redis',
    status: data.status || 'unavailable',
    configured: Boolean(data.configured),
    latencyMs: data.latencyMs,
    message: data.message || '',
    details: data.details,
  };
}

export async function checkApiHealth(): Promise<{ status: string; uptime: number; timestamp: string }> {
  const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Health check failed (${res.status})`);
  }
  return res.json();
}

export async function saveDemoRecord(service: 'supabase' | 'mongodb' | 'redis', name: string): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE}/demo/${service}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }));
  return data;
}

export async function getDemoRecords(service: 'supabase' | 'mongodb' | 'redis'): Promise<ApiResponse> {
  const res = await fetch(`${API_BASE}/demo/${service}`, {
    method: 'GET',
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({ success: false, message: 'Invalid JSON response' }));
  return data;
}
