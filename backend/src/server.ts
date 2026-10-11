import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { healthRouter } from './routes/health.js';
import { servicesRouter } from './routes/services.js';
import { demoRouter } from './routes/demo.js';
import { checkSupabaseConnection } from './db/supabase.js';
import { checkMongoConnection } from './db/mongodb.js';
import { checkRedisConnection } from './db/redis.js';

const app = express();

// Permissive CORS to allow local development and web requests seamlessly
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// Body parsing with safe size limit
app.use(express.json({ limit: '64kb' }));

// Rich terminal logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const time = new Date().toLocaleTimeString();

  // Print incoming request
  const bodyInfo = req.body && Object.keys(req.body).length > 0 ? `| Body: ${JSON.stringify(req.body)}` : '';
  const queryInfo = req.query && Object.keys(req.query).length > 0 ? `| Query: ${JSON.stringify(req.query)}` : '';
  console.log(`\x1b[36m---> [${time}] ${req.method} ${req.originalUrl} ${bodyInfo} ${queryInfo}\x1b[0m`);

  // Intercept json responses to log error reasons if status >= 400
  const originalJson = res.json;
  let responseData: any = null;
  res.json = function (body: any) {
    responseData = body;
    return originalJson.call(this, body);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const finishTime = new Date().toLocaleTimeString();

    // Color code based on status
    let color = '\x1b[32m'; // green 2xx
    if (statusCode >= 500) {
      color = '\x1b[31m'; // red 5xx
    } else if (statusCode >= 400) {
      color = '\x1b[33m'; // yellow 4xx
    } else if (statusCode >= 300) {
      color = '\x1b[34m'; // blue 3xx
    }

    let errorDetail = '';
    if (statusCode >= 400 && responseData) {
      const errMsg = responseData.error?.message || responseData.message || responseData.error || '';
      if (errMsg) {
        errorDetail = ` | Reason: "${errMsg}"`;
      }
    }

    console.log(`${color}<--- [${finishTime}] ${statusCode} ${req.method} ${req.originalUrl} (${duration}ms)${errorDetail}\x1b[0m\n`);
  });

  next();
});

// Mount API routes
app.use('/api/health', healthRouter);
app.use('/api/services', servicesRouter);
app.use('/api/demo', demoRouter);

// Root route convenience check
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'Deployment Playground Express API',
    description: 'Demonstrating deployment connectivity across Vercel, Render, and Coolify',
    endpoints: {
      health: '/api/health',
      readiness: '/api/health/ready',
      services: '/api/services/status',
      supabase: '/api/demo/supabase',
      mongodb: '/api/demo/mongodb',
      redis: '/api/demo/redis',
    },
  });
});

// 404 Fallback
app.use((req: Request, res: Response) => {
  console.error(`\x1b[31m[404 NOT FOUND] ${req.method} ${req.originalUrl}\x1b[0m`);
  res.status(404).json({
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const errorMsg = err instanceof Error ? err.message : String(err);
  console.error(`\x1b[31m[500 SERVER ERROR] ${req.method} ${req.originalUrl} -> ${errorMsg}\x1b[0m`);
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  }

  res.status(500).json({
    success: false,
    error: {
      message: 'Server Error: ' + errorMsg,
    },
  });
});

// Start listening if executed directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, async () => {
    const serverUrl = `http://localhost:${config.port}`;
    let clientUrl = config.corsOrigin;
    if (clientUrl && !clientUrl.startsWith('http://') && !clientUrl.startsWith('https://') && clientUrl !== '*') {
      clientUrl = `http://${clientUrl}`;
    }

    // Ping services in parallel for startup diagnostics
    const [supabaseStatus, redisStatus, mongoStatus] = await Promise.all([
      checkSupabaseConnection({ silent: true }).catch((err: Error) => ({ status: 'unavailable', message: err.message })),
      checkRedisConnection({ silent: true }).catch((err: Error) => ({ status: 'unavailable', message: err.message })),
      checkMongoConnection({ silent: true }).catch((err: Error) => ({ status: 'unavailable', message: err.message })),
    ]);

    const formatService = (label: string, res: { status: string; message: string }) => {
      if (res.status === 'connected') {
        return `\x1b[32m✅ ${label}\x1b[0m`;
      } else if (res.status === 'not_configured') {
        return `\x1b[33m⚠️ ${label} (Not configured)\x1b[0m`;
      } else {
        return `\x1b[31m❌ ${label} (Unavailable: ${res.message})\x1b[0m`;
      }
    };

    console.log(
      `\n` +
      `${formatService('PostgreSQL pool initialized', supabaseStatus)}\n` +
      `${formatService('Redis connected', redisStatus)}\n` +
      `${formatService('MongoDB connected', mongoStatus)}\n` +
      `\x1b[36m🚀 Server running on ${serverUrl}\x1b[0m\n` +
      (clientUrl ? `\x1b[35m🌐 Client URL: ${clientUrl}\x1b[0m\n` : '') +
      `\x1b[90m📍 Environment: ${config.nodeEnv}\x1b[0m\n` +
      `\x1b[34m🔗 Health: ${serverUrl}/api/health\x1b[0m\n` +
      `\x1b[34m🔗 Services: ${serverUrl}/api/services/status\x1b[0m\n` +
      `\x1b[34m🔗 Playground: ${serverUrl}/api/demo/supabase\x1b[0m\n`
    );
  });
}

export { app };
