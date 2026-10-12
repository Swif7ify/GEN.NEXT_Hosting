export type ServiceStatusType = 'connected' | 'unavailable' | 'not_configured' | 'error' | 'checking' | 'idle';

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
  explanation?: string;
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
