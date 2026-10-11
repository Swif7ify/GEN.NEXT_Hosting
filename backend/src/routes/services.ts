import { Router, Request, Response } from 'express';
import { getServiceConfigStatus } from '../config/env.js';
import { checkSupabaseConnection } from '../db/supabase.js';
import { checkMongoConnection } from '../db/mongodb.js';
import { checkRedisConnection } from '../db/redis.js';

export const servicesRouter = Router();

/**
 * GET /api/services/status
 * Returns connectivity status of backend services with terminal visibility.
 */
servicesRouter.get('/status', async (req: Request, res: Response) => {
  const targetService = req.query.service as string | undefined;
  const configStatus = getServiceConfigStatus();

  // If specific service is requested
  if (targetService) {
    console.log(`\x1b[34m[CHECK SERVICE]\x1b[0m Querying status for: "${targetService}"`);
    switch (targetService.toLowerCase()) {
      case 'api': {
        console.log(`\x1b[32m[API OK]\x1b[0m Express API is alive on port 5000`);
        return res.status(200).json({
          service: 'api',
          status: 'connected',
          latencyMs: 1,
          message: 'Express API is alive and reachable.',
          configured: true,
          checkedAt: new Date().toISOString(),
        });
      }
      case 'supabase': {
        const result = await checkSupabaseConnection();
        const color = result.status === 'connected' ? '\x1b[32m' : '\x1b[31m';
        console.log(`${color}[SUPABASE STATUS] ${result.status.toUpperCase()} | ${result.message}\x1b[0m`);
        return res.status(200).json({
          service: 'supabase',
          ...result,
          configured: configStatus.supabase.configured,
          checkedAt: new Date().toISOString(),
        });
      }
      case 'mongodb': {
        const result = await checkMongoConnection();
        const color = result.status === 'connected' ? '\x1b[32m' : '\x1b[31m';
        console.log(`${color}[MONGODB STATUS] ${result.status.toUpperCase()} | ${result.message}\x1b[0m`);
        return res.status(200).json({
          service: 'mongodb',
          ...result,
          configured: configStatus.mongodb.configured,
          checkedAt: new Date().toISOString(),
        });
      }
      case 'redis': {
        const result = await checkRedisConnection();
        const color = result.status === 'connected' ? '\x1b[32m' : '\x1b[31m';
        console.log(`${color}[REDIS STATUS] ${result.status.toUpperCase()} | ${result.message}\x1b[0m`);
        return res.status(200).json({
          service: 'redis',
          ...result,
          configured: configStatus.redis.configured,
          checkedAt: new Date().toISOString(),
        });
      }
      default:
        console.warn(`\x1b[33m[SERVICES 400] Unknown service: "${targetService}"\x1b[0m`);
        return res.status(400).json({
          error: `Unknown service "${targetService}". Valid values: api, supabase, mongodb, redis.`,
        });
    }
  }

  // Check all services concurrently
  console.log(`\x1b[34m[CHECK ALL]\x1b[0m Running connectivity checks on Supabase, MongoDB, and Redis...`);
  const [supabaseStatus, mongoStatus, redisStatus] = await Promise.all([
    checkSupabaseConnection(),
    checkMongoConnection(),
    checkRedisConnection(),
  ]);

  console.log(`[STATUS SUMMARY] Supabase: ${supabaseStatus.status} | MongoDB: ${mongoStatus.status} | Redis: ${redisStatus.status}`);

  return res.status(200).json({
    checkedAt: new Date().toISOString(),
    services: {
      api: {
        name: 'Express REST API',
        status: 'connected',
        latencyMs: 1,
        message: 'Express API is alive and responding.',
        configured: true,
      },
      supabase: {
        name: 'Supabase (PostgreSQL)',
        ...supabaseStatus,
        configured: configStatus.supabase.configured,
      },
      mongodb: {
        name: 'MongoDB',
        ...mongoStatus,
        configured: configStatus.mongodb.configured,
      },
      redis: {
        name: 'Redis',
        ...redisStatus,
        configured: configStatus.redis.configured,
      },
    },
  });
});
