// Force UTC so the `pg` driver interprets TIMESTAMP columns consistently,
// regardless of the host machine's system timezone.
process.env.TZ = 'UTC';

import { createServer } from "http";
import cluster from "cluster";
import os from "os";

import { app } from "./app.js";
import { env } from "./config/env.config.js";
import { database } from "./config/database.config.js";
import { logger } from "./services/logger.service.js";
import { socketService } from "./services/socket.service.js";
import { reminderProcessorJob } from "./jobs/reminder-processor.job.js";
import { workoutAuditJob } from "./jobs/workout-audit.job.js";
import { nutritionAnalysisJob } from "./jobs/nutrition-analysis.job.js";
import { scheduleAutomationJob } from "./jobs/schedule-automation.job.js";
import { proactiveMessagingJob } from "./jobs/proactive-messaging.job.js";
import { dailyScoringJob } from "./jobs/daily-scoring.job.js";
import { leaderboardMaterializationJob } from "./jobs/leaderboard-materialization.job.js";
import { competitionAutoCreateJob } from "./jobs/competition-auto-create.job.js";
import { coachProfileGenerationJob } from "./jobs/coach-profile-generation.job.js";
import { dailyAnalysisJob } from "./jobs/daily-analysis.job.js";
import { whoopSyncJob } from "./jobs/whoop-sync.job.js";
import { activityEventProcessor } from "./workers/activity-event-processor.worker.js";
import { ensureDefaultPlans } from "./services/subscription.service.js";

// Embedding worker and queue require Redis - lazy import to avoid crash when Redis is unavailable
let embeddingWorker: { close: () => Promise<void> } | null = null;
let embeddingQueueService: { close: () => Promise<void> } | null = null;

const numCPUs = os.cpus().length;
const ENABLE_CLUSTERING =
  env.isProduction && process.env["CLUSTER_MODE"] === "true";

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  const shutdownTimeout = setTimeout(() => {
    logger.error("Shutdown timeout reached. Forcing exit.");
    process.exit(1);
  }, 30000); // 30 second timeout

  try {
    // Stop background jobs
    reminderProcessorJob.stop();
    logger.info("Reminder processor job stopped");

    workoutAuditJob.stop();
    logger.info("Workout audit job stopped");

    nutritionAnalysisJob.stop();
    logger.info("Nutrition analysis job stopped");

    scheduleAutomationJob.stop();
    logger.info("Schedule automation job stopped");

    proactiveMessagingJob.stop();
    logger.info("Proactive messaging job stopped");

    dailyScoringJob.stop();
    logger.info("Daily scoring job stopped");

    leaderboardMaterializationJob.stop();
    logger.info("Leaderboard materialization job stopped");

    competitionAutoCreateJob.stop();
    logger.info("Competition auto-create job stopped");

    coachProfileGenerationJob.stop();
    logger.info("Coach profile generation job stopped");

    dailyAnalysisJob.stop();
    logger.info("Daily analysis job stopped");

    await activityEventProcessor.stop();
    logger.info("Activity event processor stopped");

    // Close embedding queue and worker (if started)
    if (embeddingQueueService) await embeddingQueueService.close();
    if (embeddingWorker) await embeddingWorker.close();
    logger.info("Embedding worker and queue closed");

    // Stop accepting new connections
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      logger.info("HTTP server closed");
    }

    // Disconnect from database
    await database.disconnect();
    logger.info("Database disconnected");

    clearTimeout(shutdownTimeout);
    logger.info("Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    clearTimeout(shutdownTimeout);
    logger.error("Error during shutdown", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    process.exit(1);
  }
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Connect to database
    await database.connect();

    // Auto-seed subscription plans if table is empty
    try {
      await ensureDefaultPlans();
    } catch (err) {
      logger.warn("Failed to auto-seed subscription plans", {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.IO
    socketService.initialize(httpServer);

    // Start embedding worker if Redis is configured (before listen, since this is async)
    if (env.redis.enabled) {
      try {
        const workerModule = await import("./workers/embedding-worker.js");
        const queueModule = await import("./services/embedding-queue.service.js");
        embeddingWorker = workerModule.embeddingWorker;
        embeddingQueueService = queueModule.embeddingQueueService;
        logger.info("Embedding worker and queue started (Redis available)");
      } catch (err) {
        logger.warn("Failed to start embedding worker - Redis may be unavailable", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    } else {
      logger.info("Embedding worker skipped (Redis not configured - set REDIS_URL or REDIS_HOST)");
    }

    // Start listening
    httpServer.listen(env.port, env.host, () => {
      logger.info(`Server started`, {
        port: env.port,
        host: env.host,
        environment: env.nodeEnv,
        pid: process.pid,
        nodeVersion: process.version,
      });

      if (env.isDevelopment) {
        logger.info(
          `API available at http://localhost:${env.port}${env.api.prefix}`
        );
        logger.info(
          `Health check at http://localhost:${env.port}${env.api.prefix}/health`
        );
      }

      // Start background jobs. Cron-style jobs run only on one worker in cluster mode to avoid N× repetition.
      const isSchedulerWorker = !cluster.worker || cluster.worker.id === 0;

      if (isSchedulerWorker) {
        // Lightweight jobs — start immediately
        reminderProcessorJob.start();
        logger.info("Reminder processor job started");

        workoutAuditJob.start();
        logger.info("Workout audit job started");

        nutritionAnalysisJob.start();
        logger.info("Nutrition analysis job started");

        scheduleAutomationJob.start();
        logger.info("Schedule automation job started");

        leaderboardMaterializationJob.start();
        logger.info("Leaderboard materialization job started");

        competitionAutoCreateJob.start();
        logger.info("Competition auto-create job started");

        // Heavy jobs — stagger startup to avoid query storm
        setTimeout(() => {
          proactiveMessagingJob.start();
          logger.info("Proactive messaging job started (staggered 30s)");
        }, 30_000);

        setTimeout(() => {
          dailyScoringJob.start();
          logger.info("Daily scoring job started (staggered 60s)");
        }, 60_000);

        setTimeout(() => {
          dailyAnalysisJob.start();
          logger.info("Daily analysis job started (staggered 120s)");
        }, 120_000);

        setTimeout(() => {
          coachProfileGenerationJob.start();
          logger.info("Coach profile generation job started (staggered 180s)");
        }, 180_000);

        setTimeout(() => {
          whoopSyncJob.start();
          logger.info("WHOOP daily sync job started (staggered 240s)");
        }, 240_000);
      }

      // Event-driven / queue consumer — start on all workers (or keep on scheduler only if it's a single consumer)
      activityEventProcessor.start();
      logger.info("Activity event processor started");
    });

    // Store server reference for graceful shutdown
    global.server = httpServer;

    // Handle server errors
    httpServer.on("error", (error: NodeJS.ErrnoException) => {
      if (error.syscall !== "listen") {
        throw error;
      }

      switch (error.code) {
        case "EACCES":
          logger.error(`Port ${env.port} requires elevated privileges`);
          process.exit(1);
          break;
        case "EADDRINUSE":
          logger.error(`Port ${env.port} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  } catch (error) {
    logger.error("Failed to start server", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Server reference for graceful shutdown
let server: ReturnType<typeof createServer> | undefined;

// Cluster mode for production
if (ENABLE_CLUSTERING && cluster.isPrimary) {
  logger.info(`Primary ${process.pid} is running`);
  logger.info(`Forking ${numCPUs} workers...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Handle worker exit
  cluster.on("exit", (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died`, { code, signal });

    // Replace dead worker
    if (!signal) {
      logger.info("Starting a new worker...");
      cluster.fork();
    }
  });

  // Handle worker online
  cluster.on("online", (worker) => {
    logger.info(`Worker ${worker.process.pid} is online`);
  });
} else {
  // Single process mode (development) or worker process
  startServer();

  // Graceful shutdown handlers
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

// Extend global type for server reference
declare global {
  var server: ReturnType<typeof createServer> | undefined;
}

export { startServer };
