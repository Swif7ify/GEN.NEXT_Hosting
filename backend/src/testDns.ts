import dns from 'node:dns';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const mongoUri = (process.env.MONGODB_URI || '').replace(/^["']|["']$/g, '');

console.log('--- TESTING NODE DNS RESOLUTION ---');
console.log('Default servers:', dns.getServers());

async function testWithDefaultDns() {
  console.log('\n[1] Testing with default DNS servers:');
  try {
    const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 4000 });
    await client.connect();
    console.log('Default DNS connection: SUCCESS!');
    await client.close();
  } catch (err: any) {
    console.log('Default DNS connection: FAILED ->', err.message);
  }
}

async function testWithCustomDns() {
  console.log('\n[2] Setting dns.setServers(["8.8.8.8", "1.1.1.1"])');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  console.log('New DNS servers:', dns.getServers());

  try {
    const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 4000 });
    await client.connect();
    console.log('Custom DNS connection: SUCCESS!');
    const ping = await client.db('mongodbtest').command({ ping: 1 });
    console.log('Ping result:', ping);
    await client.close();
  } catch (err: any) {
    console.log('Custom DNS connection: FAILED ->', err.message);
  }
}

async function run() {
  await testWithDefaultDns();
  await testWithCustomDns();
  process.exit(0);
}

run();
