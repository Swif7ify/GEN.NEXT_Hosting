import { MongoClient, Db, Document } from 'mongodb';
import dns from 'node:dns';
import { config } from '../config/env.js';
import { ServiceCheckResult } from './supabase.js';

// Fix for Windows / local loopback querySrv ECONNREFUSED on MongoDB Atlas SRV lookup
try {
  const currentServers = dns.getServers();
  if (currentServers.includes('127.0.0.1') || currentServers.some((s) => s.startsWith('fe80:')) || currentServers.length === 0) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
} catch {
  // fallback if environment restricts dns.setServers
}

let mongoClient: MongoClient | null = null;
let database: Db | null = null;

export async function getMongoDb(): Promise<Db | null> {
  if (!config.mongodb.uri) {
    console.warn('\x1b[33m[MONGODB] MONGODB_URI is not set in environment.\x1b[0m');
    return null;
  }

  if (database) {
    return database;
  }

  try {
    console.log(`\x1b[34m[MONGODB] Connecting to database "${config.mongodb.dbName}"...\x1b[0m`);
    mongoClient = new MongoClient(config.mongodb.uri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
    });
    await mongoClient.connect();
    database = mongoClient.db(config.mongodb.dbName);
    console.log(`\x1b[32m[MONGODB] Connected to "${config.mongodb.dbName}".\x1b[0m`);
    return database;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\x1b[31m[MONGODB CLIENT ERROR] ${msg}\x1b[0m`);
    mongoClient = null;
    database = null;
    return null;
  }
}

export async function checkMongoConnection(): Promise<ServiceCheckResult> {
  if (!config.mongodb.uri) {
    console.warn('\x1b[33m[MONGODB] checkConnection called but MONGODB_URI is empty.\x1b[0m');
    return {
      status: 'not_configured',
      message: 'MongoDB connection string is not configured (missing MONGODB_URI in backend .env).',
    };
  }

  const startTime = Date.now();
  let tempClient: MongoClient | null = null;
  try {
    console.log(`\x1b[34m[MONGODB] Pinging cluster for database "${config.mongodb.dbName}"...\x1b[0m`);
    tempClient = new MongoClient(config.mongodb.uri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
    });

    await tempClient.connect();
    await tempClient.db(config.mongodb.dbName).command({ ping: 1 });
    const latencyMs = Date.now() - startTime;

    console.log(`\x1b[32m[MONGODB SUCCESS] Ping OK (${latencyMs}ms)\x1b[0m`);
    return {
      status: 'connected',
      latencyMs,
      message: `Successfully connected to MongoDB (database: ${config.mongodb.dbName}).`,
    };
  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime;
    const msg = error instanceof Error ? error.message : 'Unknown MongoDB connection error';
    console.error(`\x1b[31m[MONGODB CONNECTION FAILED] ${msg} (${latencyMs}ms)\x1b[0m`);
    return {
      status: 'unavailable',
      latencyMs,
      message: 'Unable to reach MongoDB: ' + msg,
    };
  } finally {
    if (tempClient) {
      tempClient.close().catch(() => {});
    }
  }
}

export interface MongoDemoEntry {
  id: string;
  name: string;
  created_at: string;
}

export async function saveMongoRecord(name: string): Promise<{ success: boolean; data?: MongoDemoEntry; message: string }> {
  if (!config.mongodb.uri) {
    return {
      success: false,
      message: 'MongoDB is not configured on the backend.',
    };
  }

  try {
    const db = await getMongoDb();
    if (!db) {
      return {
        success: false,
        message: 'Could not establish connection to MongoDB.',
      };
    }

    const collection = db.collection('demo_entries');
    const now = new Date();
    const result = await collection.insertOne({
      name,
      createdAt: now,
    });

    console.log(`\x1b[32m[MONGODB INSERT] Document inserted with _id: ${result.insertedId}\x1b[0m`);
    return {
      success: true,
      data: {
        id: result.insertedId.toString(),
        name,
        created_at: now.toISOString(),
      },
      message: 'Document successfully saved to MongoDB collection "demo_entries".',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`\x1b[31m[MONGODB INSERT ERROR] ${msg}\x1b[0m`);
    return {
      success: false,
      message: 'Failed to save to MongoDB: ' + msg,
    };
  }
}

export async function getMongoRecords(): Promise<{ success: boolean; records: MongoDemoEntry[]; message: string }> {
  if (!config.mongodb.uri) {
    return {
      success: false,
      records: [],
      message: 'MongoDB is not configured on the backend.',
    };
  }

  try {
    const db = await getMongoDb();
    if (!db) {
      return {
        success: false,
        records: [],
        message: 'Could not establish connection to MongoDB.',
      };
    }

    const collection = db.collection('demo_entries');
    const docs = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .project({ _id: 1, name: 1, createdAt: 1 })
      .toArray();

    const records: MongoDemoEntry[] = docs.map((doc: Document) => ({
      id: doc._id.toString(),
      name: String(doc.name || ''),
      created_at: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt || ''),
    }));

    console.log(`\x1b[32m[MONGODB QUERY] Retrieved ${records.length} documents.\x1b[0m`);
    return {
      success: true,
      records,
      message: 'Successfully retrieved documents from MongoDB.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`\x1b[31m[MONGODB QUERY ERROR] ${msg}\x1b[0m`);
    return {
      success: false,
      records: [],
      message: 'Failed to retrieve records from MongoDB: ' + msg,
    };
  }
}
