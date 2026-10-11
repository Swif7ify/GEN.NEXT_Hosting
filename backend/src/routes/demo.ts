import { Router, Request, Response } from 'express';
import { validateDemoName } from '../validation/nameValidator.js';
import { checkAndLockSubmission } from '../middleware/dedup.js';
import { saveSupabaseRecord, getSupabaseRecords } from '../db/supabase.js';
import { saveMongoRecord, getMongoRecords } from '../db/mongodb.js';
import { saveRedisRecord, getRedisRecord } from '../db/redis.js';

export const demoRouter = Router();

// ==========================================
// SUPABASE ENDPOINTS
// ==========================================

demoRouter.post('/supabase', async (req: Request, res: Response) => {
  const rawName = req.body?.name;
  const validation = validateDemoName(rawName);

  if (!validation.isValid) {
    console.log(`\x1b[33m[VALIDATION 400] Supabase write rejected: ${validation.error?.message}\x1b[0m`);
    return res.status(400).json({
      success: false,
      error: validation.error,
    });
  }

  const name = validation.sanitizedValue!;

  const dedup = checkAndLockSubmission('supabase', name);
  if (dedup.isDuplicate) {
    console.log(`\x1b[33m[DEDUP 429] Supabase duplicate submission: "${name}"\x1b[0m`);
    return res.status(429).json({
      success: false,
      error: {
        field: 'name',
        message: 'Duplicate submission detected. Please wait a moment before resubmitting the same name.',
      },
    });
  }

  console.log(`\x1b[34m[SUPABASE] Attempting insert: name="${name}"\x1b[0m`);
  const result = await saveSupabaseRecord(name);
  if (!result.success) {
    console.error(`\x1b[31m[SUPABASE ERROR 503] ${result.message}\x1b[0m`);
    return res.status(503).json({
      success: false,
      message: result.message,
    });
  }

  console.log(`\x1b[32m[SUPABASE 201] Insert success, ID: ${result.data?.id}\x1b[0m`);
  return res.status(201).json({
    success: true,
    message: result.message,
    record: result.data,
  });
});

demoRouter.get('/supabase', async (_req: Request, res: Response) => {
  console.log(`\x1b[34m[SUPABASE] Fetching recent records...\x1b[0m`);
  const result = await getSupabaseRecords();
  if (!result.success) {
    console.error(`\x1b[31m[SUPABASE ERROR 503] ${result.message}\x1b[0m`);
    return res.status(503).json({
      success: false,
      message: result.message,
      records: [],
    });
  }

  console.log(`\x1b[32m[SUPABASE 200] Retrieved ${result.records.length} records\x1b[0m`);
  return res.status(200).json({
    success: true,
    message: result.message,
    records: result.records,
  });
});

// ==========================================
// MONGODB ENDPOINTS
// ==========================================

demoRouter.post('/mongodb', async (req: Request, res: Response) => {
  const rawName = req.body?.name;
  const validation = validateDemoName(rawName);

  if (!validation.isValid) {
    console.log(`\x1b[33m[VALIDATION 400] MongoDB write rejected: ${validation.error?.message}\x1b[0m`);
    return res.status(400).json({
      success: false,
      error: validation.error,
    });
  }

  const name = validation.sanitizedValue!;

  const dedup = checkAndLockSubmission('mongodb', name);
  if (dedup.isDuplicate) {
    console.log(`\x1b[33m[DEDUP 429] MongoDB duplicate submission: "${name}"\x1b[0m`);
    return res.status(429).json({
      success: false,
      error: {
        field: 'name',
        message: 'Duplicate submission detected. Please wait a moment before resubmitting the same name.',
      },
    });
  }

  console.log(`\x1b[34m[MONGODB] Attempting insert: name="${name}"\x1b[0m`);
  const result = await saveMongoRecord(name);
  if (!result.success) {
    console.error(`\x1b[31m[MONGODB ERROR 503] ${result.message}\x1b[0m`);
    return res.status(503).json({
      success: false,
      message: result.message,
    });
  }

  console.log(`\x1b[32m[MONGODB 201] Insert success, ID: ${result.data?.id}\x1b[0m`);
  return res.status(201).json({
    success: true,
    message: result.message,
    record: result.data,
  });
});

demoRouter.get('/mongodb', async (_req: Request, res: Response) => {
  console.log(`\x1b[34m[MONGODB] Fetching recent documents...\x1b[0m`);
  const result = await getMongoRecords();
  if (!result.success) {
    console.error(`\x1b[31m[MONGODB ERROR 503] ${result.message}\x1b[0m`);
    return res.status(503).json({
      success: false,
      message: result.message,
      records: [],
    });
  }

  console.log(`\x1b[32m[MONGODB 200] Retrieved ${result.records.length} documents\x1b[0m`);
  return res.status(200).json({
    success: true,
    message: result.message,
    records: result.records,
  });
});

// ==========================================
// REDIS ENDPOINTS
// ==========================================

demoRouter.post('/redis', async (req: Request, res: Response) => {
  const rawName = req.body?.name;
  const validation = validateDemoName(rawName);

  if (!validation.isValid) {
    console.log(`\x1b[33m[VALIDATION 400] Redis write rejected: ${validation.error?.message}\x1b[0m`);
    return res.status(400).json({
      success: false,
      error: validation.error,
    });
  }

  const name = validation.sanitizedValue!;

  const dedup = checkAndLockSubmission('redis', name);
  if (dedup.isDuplicate) {
    console.log(`\x1b[33m[DEDUP 429] Redis duplicate submission: "${name}"\x1b[0m`);
    return res.status(429).json({
      success: false,
      error: {
        field: 'name',
        message: 'Duplicate submission detected. Please wait a moment before resubmitting the same name.',
      },
    });
  }

  console.log(`\x1b[34m[REDIS] Attempting set cache: name="${name}" (TTL: 300s)\x1b[0m`);
  const result = await saveRedisRecord(name);
  if (!result.success) {
    console.error(`\x1b[31m[REDIS ERROR 503] ${result.message}\x1b[0m`);
    return res.status(503).json({
      success: false,
      message: result.message,
    });
  }

  console.log(`\x1b[32m[REDIS 201] Key stored, TTL: ${result.data?.ttl_seconds}s\x1b[0m`);
  return res.status(201).json({
    success: true,
    message: result.message,
    record: result.data,
  });
});

demoRouter.get('/redis', async (_req: Request, res: Response) => {
  console.log(`\x1b[34m[REDIS] Fetching cached key...\x1b[0m`);
  const result = await getRedisRecord();
  if (!result.success) {
    console.error(`\x1b[31m[REDIS ERROR 503] ${result.message}\x1b[0m`);
    return res.status(503).json({
      success: false,
      message: result.message,
      record: null,
    });
  }

  console.log(`\x1b[32m[REDIS 200] Retrieved cached key state: ${result.data ? result.data.name : 'null (expired)'}\x1b[0m`);
  return res.status(200).json({
    success: true,
    message: result.message,
    record: result.data,
  });
});
