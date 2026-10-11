import { Router, Request, Response } from 'express';
import { getServiceConfigStatus } from '../config/env.js';

export const healthRouter = Router();

/**
 * GET /api/health
 * Basic application liveness check.
 */
healthRouter.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'Deployment Playground Express API',
  });
});

/**
 * GET /api/health/ready
 * Readiness probe for container orchestrators (Render, Coolify, Kubernetes).
 */
healthRouter.get('/ready', (_req: Request, res: Response) => {
  const serviceConfig = getServiceConfigStatus();

  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    configuredServices: {
      api: serviceConfig.api.configured,
      supabase: serviceConfig.supabase.configured,
      mongodb: serviceConfig.mongodb.configured,
      redis: serviceConfig.redis.configured,
    },
  });
});
