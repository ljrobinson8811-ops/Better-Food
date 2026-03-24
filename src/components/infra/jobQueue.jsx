/**
 * Client-side background job queue
 * - At-least-once processing via localStorage persistence
 * - Configurable retry with exponential backoff
 * - Dead-letter store for exhausted jobs
 * - Named workers: MenuDiscovery, RecipeValidation, RestaurantRefresh,
 *   NutritionCalculation, PriceCache, PhotoModeration, Ranking, Notification
 */

import { base44 } from "@/api/base44Client";

const QUEUE_KEY   = "bf_job_queue";
const DLQ_KEY     = "bf_job_dlq";
const MAX_RETRIES = 3;

function loadQueue()  { try { return JSON.parse(localStorage.getItem(QUEUE_KEY)  || "[]"); } catch { return []; } }
function saveQueue(q) { try { localStorage.setItem(QUEUE_KEY,  JSON.stringify(q)); } catch {} }
function loadDLQ()    { try { return JSON.parse(localStorage.getItem(DLQ_KEY)    || "[]"); } catch { return []; } }
function saveDLQ(q)   { try { localStorage.setItem(DLQ_KEY,    JSON.stringify(q)); } catch {} }

export const JobQueue = {
  /**
   * Enqueue a job
   * @param {string} worker - worker name
   * @param {object} payload - job data
   * @param {{ priority?: 'high'|'normal'|'low', delayMs?: number }} opts
   */
  enqueue(worker, payload, opts = {}) {
    const queue = loadQueue();
    const job = {
      id:          crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      worker,
      payload,
      priority:    opts.priority ?? "normal",
      runAfter:    Date.now() + (opts.delayMs ?? 0),
      attempts:    0,
      createdAt:   Date.now(),
    };
    queue.push(job);
    saveQueue(queue);
    // Log to backend
    base44.entities.ErrorLog.create({
      error_type: "unknown",
      severity:   "low",
      message:    `[JobQueue] Enqueued ${worker}`,
      context:    { jobId: job.id, worker, payload },
    }).catch(() => {});
    return job.id;
  },

  /** Dequeue and run due jobs */
  async flush(workerHandlers = {}) {
    const queue = loadQueue();
    const now   = Date.now();
    const due   = queue.filter(j => j.runAfter <= now);
    const rest  = queue.filter(j => j.runAfter > now);

    for (const job of due) {
      const handler = workerHandlers[job.worker];
      if (!handler) { rest.push(job); continue; }

      job.attempts += 1;
      try {
        await handler(job.payload);
        // success — drop job
      } catch (err) {
        if (job.attempts >= MAX_RETRIES) {
          // Dead-letter
          const dlq = loadDLQ();
          dlq.push({ ...job, failedAt: Date.now(), lastError: String(err) });
          saveDLQ(dlq);
          base44.entities.ErrorLog.create({
            error_type: "unknown",
            severity:   "high",
            message:    `[JobQueue] DLQ: ${job.worker} — ${err}`,
            context:    { job },
          }).catch(() => {});
        } else {
          // Re-queue with backoff: 30s, 5m, 30m
          const backoff = [30_000, 300_000, 1_800_000][job.attempts - 1] ?? 1_800_000;
          job.runAfter  = Date.now() + backoff;
          rest.push(job);
        }
      }
    }

    saveQueue(rest);
  },

  getDLQ() { return loadDLQ(); },
  getQueue() { return loadQueue(); },
  clearDLQ() { saveDLQ([]); },
};