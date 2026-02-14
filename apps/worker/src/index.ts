/**
 * Care Command Worker - BullMQ background jobs
 * Jobs: hourly_axiscare_sync, daily_expiration_scan, reminder_scheduler
 */
import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

async function processJob(job: { name: string; data: unknown }) {
  console.log(`[Worker] Processing job ${job.name}`, job.data);
  // Placeholder - jobs will be implemented in Phase 8
  return { ok: true };
}

const worker = new Worker(
  'carecommand-jobs',
  async (job) => processJob(job),
  { connection, concurrency: 5 }
);

worker.on('completed', (job) => console.log(`[Worker] Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`[Worker] Job ${job?.id} failed:`, err));

console.log('[Worker] Care Command worker started');
