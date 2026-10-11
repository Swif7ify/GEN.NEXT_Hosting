import dotenv from 'dotenv';
dotenv.config();

const clean = (val?: string) => (val ? val.replace(/^["']|["']$/g, '').trim() : '');

export interface ServiceConfigStatus {
  api: {
    configured: boolean;
    name: string;
    environment: string;
  };
  supabase: {
    configured: boolean;
    name: string;
    hasUrl: boolean;
    hasKey: boolean;
  };
  mongodb: {
    configured: boolean;
    name: string;
    hasUri: boolean;
    dbName: string;
  };
  redis: {
    configured: boolean;
    name: string;
    hasUrl: boolean;
  };
}

export const config = {
  port: parseInt(clean(process.env.PORT) || '5000', 10),
  nodeEnv: clean(process.env.NODE_ENV) || 'development',
  corsOrigin: clean(process.env.CORS_ORIGIN) || '*',
  supabase: {
    url: clean(process.env.SUPABASE_URL),
    key: clean(process.env.SUPABASE_ANON_KEY) || clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  },
  mongodb: {
    uri: clean(process.env.MONGODB_URI),
    dbName: clean(process.env.MONGODB_DB_NAME) || 'deployment_playground',
  },
  redis: {
    url: clean(process.env.REDIS_URL),
  },
  requestTimeoutMs: 6000,
};

export function getServiceConfigStatus(): ServiceConfigStatus {
  return {
    api: {
      configured: true,
      name: 'Express REST API',
      environment: config.nodeEnv,
    },
    supabase: {
      configured: Boolean(config.supabase.url && config.supabase.key),
      name: 'Supabase (PostgreSQL)',
      hasUrl: Boolean(config.supabase.url),
      hasKey: Boolean(config.supabase.key),
    },
    mongodb: {
      configured: Boolean(config.mongodb.uri),
      name: 'MongoDB Atlas / Instance',
      hasUri: Boolean(config.mongodb.uri),
      dbName: config.mongodb.dbName,
    },
    redis: {
      configured: Boolean(config.redis.url),
      name: 'Redis Cache & Key-Value',
      hasUrl: Boolean(config.redis.url),
    },
  };
}
