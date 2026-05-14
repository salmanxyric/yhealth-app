// Force UTC so the `pg` driver interprets TIMESTAMP columns consistently,
// regardless of the host machine's system timezone.
process.env.TZ = 'UTC';

import { createServer } from "http";
import cluster from "cluster";
import os from "os";

import { app } from "./app.js";
import { env } from "./config/env.config.js";
import { database, query } from "./config/database.config.js";
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
import { insightsComputationJob } from "./jobs/insights-computation.job.js";
import { lifeHistoryDigestJob } from "./jobs/life-history-digest.job.js";
import { engagementScoringJob } from "./jobs/engagement-scoring.job.js";
import { startEmailDigestJob, stopEmailDigestJob } from "./jobs/email-digest.job.js";
import { streakValidationJob } from "./jobs/streak-validation.job.js";
import { statusFollowUpJob } from "./jobs/status-followup.job.js";
import { statusPatternAnalysisJob } from "./jobs/status-pattern-analysis.job.js";
import { accountabilityTriggerJob } from "./jobs/accountability-trigger.job.js";
import { checkinCallJob } from "./jobs/checkin-call.job.js";
import { contractEvaluationJob } from "./jobs/contract-evaluation.job.js";
import { obstacleDetectorJob } from "./jobs/obstacle-detector.job.js";
import { goalReconnectionJob } from "./jobs/goal-reconnection.job.js";
import { timingProfileJob } from "./jobs/timing-profile.job.js";
import { startMicroWinsJob, stopMicroWinsJob } from "./jobs/micro-wins.job.js";
import { startAchievementCheckJob, stopAchievementCheckJob } from "./jobs/achievement-check.job.js";
import { startBuddySuggestionJob, stopBuddySuggestionJob } from "./jobs/buddy-suggestion.job.js";
import { calendarSyncJob } from "./jobs/calendar-sync.job.js";
import { dataSourceSyncJob } from "./jobs/data-source-sync.job.js";
import { correlationComputeJob } from "./jobs/correlation-compute.job.js";
import { memoryDecayJob } from "./jobs/memory-decay.job.js";
import { memoryExtractionJob } from "./jobs/memory-extraction.job.js";
import { coreProfileCalibrationJob } from "./jobs/core-profile-calibration.job.js";
import { wikiSynthesisJob } from "./jobs/wiki-synthesis.job.js";
import { wikiLintJob } from "./jobs/wiki-lint.job.js";
import { aiCoachCallReconcilerJob } from "./jobs/ai-coach-call-reconciler.job.js";
import { activityEventProcessor } from "./workers/activity-event-processor.worker.js";
import { ensureDefaultPlans } from "./services/subscription.service.js";
import { runGraceExpirationJob } from "./jobs/graceExpirationJob.js";
import { runDunningRetryJob } from "./jobs/dunning-retry.job.js";
import { runStaleReservationCleanup } from "./jobs/stale-reservation-cleanup.job.js";
import { runMonthlyCreditResetJob } from "./jobs/monthly-credit-reset.job.js";

// Embedding & email workers require Redis - lazy import to avoid crash when Redis is unavailable
let embeddingWorker: { close: () => Promise<void> } | null = null;
let emailWorker: { close: () => Promise<void> } | null = null;
let embeddingQueueService: { close: () => Promise<void> } | null = null;
let aiCoachCallWorker: { close: () => Promise<void> } | null = null;
let aiCoachCallQueueServiceRef: { close: () => Promise<void> } | null = null;

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

    insightsComputationJob.stop();
    logger.info("Insights computation job stopped");

    lifeHistoryDigestJob.stop();
    logger.info("Life history digest job stopped");

    engagementScoringJob.stop();
    logger.info("Engagement scoring job stopped");

    stopEmailDigestJob();
    logger.info("Email digest job stopped");

    streakValidationJob.stop();
    logger.info("Streak validation job stopped");

    statusFollowUpJob.stop();
    logger.info("Status follow-up job stopped");

    statusPatternAnalysisJob.stop();
    logger.info("Status pattern analysis job stopped");

    accountabilityTriggerJob.stop();
    logger.info("Accountability trigger job stopped");

    checkinCallJob.stop();
    logger.info("Check-in call job stopped");

    calendarSyncJob.stop();
    logger.info("Calendar sync job stopped");

    dataSourceSyncJob.stop();
    logger.info("Data source sync job stopped");

    correlationComputeJob.stop();
    logger.info("Correlation compute job stopped");

    memoryDecayJob.stop();
    logger.info("Memory decay job stopped");

    memoryExtractionJob.stop();
    logger.info("Memory extraction job stopped");

    coreProfileCalibrationJob.stop();
    logger.info("Core profile calibration job stopped");

    contractEvaluationJob.stop();
    logger.info("Contract evaluation job stopped");

    stopMicroWinsJob();
    logger.info("Micro-wins job stopped");

    stopAchievementCheckJob();
    logger.info("Achievement check job stopped");

    stopBuddySuggestionJob();
    logger.info("Buddy suggestion job stopped");

    timingProfileJob.stop();
    logger.info("Timing profile job stopped");

    await activityEventProcessor.stop();
    logger.info("Activity event processor stopped");

    // Close embedding queue and worker (if started)
    if (embeddingQueueService) await embeddingQueueService.close();
    if (embeddingWorker) await embeddingWorker.close();
    logger.info("Embedding worker and queue closed");

    // Close email worker (if started)
    if (emailWorker) await emailWorker.close();
    logger.info("Email worker closed");

    // Close AI coach call worker and queue (if started)
    if (aiCoachCallWorker) await aiCoachCallWorker.close();
    if (aiCoachCallQueueServiceRef) await aiCoachCallQueueServiceRef.close();
    logger.info("AI coach call worker and queue closed");

    aiCoachCallReconcilerJob.stop();
    logger.info("AI coach call reconciler stopped");

    // Stop accepting new connections
    if (global.server) {
      await new Promise<void>((resolve, reject) => {
        global.server!.close((err) => {
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

    // Lightweight column sync (idempotent, ~2-5s).
    // Full migrations: npm run db:migrate
    try {
      const { runColumnSync } = await import('./database/auto-migrate.js');
      await runColumnSync();
    } catch (err) {
      logger.warn('Column sync failed (non-fatal)', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Verify required bootstrap data exists (created by migration 20260507000000_bootstrap_required_data.sql)
    const rolesCheck = await query<{ count: string }>(`SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'roles'`);
    if (rolesCheck.rows[0]?.count === '0') {
      logger.error('Required "roles" table missing — run: npm run db:migrate');
    }

    // Auto-seed subscription plans if table is empty (idempotent, read-heavy)
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

      // Start email worker
      try {
        const { startEmailWorker } = await import("./workers/email-worker.js");
        emailWorker = startEmailWorker();
        logger.info("Email worker started (Redis available)");
      } catch (err) {
        logger.warn("Failed to start email worker", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
      // Start AI coach call worker
      try {
        const { startAICoachCallWorker } = await import("./workers/ai-coach-call.worker.js");
        const { aiCoachCallQueueService } = await import("./services/ai-coach-call-queue.service.js");
        aiCoachCallWorker = startAICoachCallWorker();
        aiCoachCallQueueServiceRef = aiCoachCallQueueService;
        logger.info("AI coach call worker started (Redis available)");
      } catch (err) {
        logger.warn("Failed to start AI coach call worker", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    } else {
      logger.info("Embedding/email workers skipped (Redis not configured - set REDIS_URL or REDIS_HOST)");
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

      // Warn if entitlement enforcement is in shadow mode in production
      if (env.isProduction && env.entitlement.mode === 'shadow') {
        logger.warn('[SECURITY] Entitlement enforcement is in shadow mode — all paywalls are bypassed. Set ENTITLEMENT_ENFORCEMENT_MODE=enforce-all for production.');
      }

      // Start background jobs. Cron-style jobs run only on one worker in cluster mode to avoid N× repetition.
      // Set ENABLE_BACKGROUND_JOBS=false in .env to disable all background jobs (useful for development)
      const backgroundJobsEnabled = process.env.ENABLE_BACKGROUND_JOBS !== 'false';
      const isSchedulerWorker = !cluster.worker || cluster.worker.id === 0;

      if (isSchedulerWorker && backgroundJobsEnabled) {
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
          logger.info("Coach profile generation job started (staggered 300s)");
        }, 300_000); // 5 minutes — gives proactive messaging (30s) and daily analysis (90s) time to finish and populate cache

        setTimeout(() => {
          whoopSyncJob.start();
          logger.info("WHOOP daily sync job started (staggered 240s)");
        }, 240_000);

        setTimeout(() => {
          insightsComputationJob.start();
          logger.info("Insights computation job started (staggered 360s)");
        }, 360_000);

        setTimeout(() => {
          lifeHistoryDigestJob.start();
          logger.info("Life history digest job started (staggered 420s)");
        }, 420_000);

        setTimeout(() => {
          engagementScoringJob.start();
          logger.info("Engagement scoring job started (staggered 480s)");
        }, 480_000);

        setTimeout(() => {
          startEmailDigestJob();
          logger.info("Email digest job started (staggered 540s)");
        }, 540_000);

        setTimeout(() => {
          streakValidationJob.start();
          logger.info("Streak validation job started (staggered 600s)");
        }, 600_000);

        setTimeout(() => {
          statusFollowUpJob.start();
          logger.info("Status follow-up job started (staggered 660s)");
        }, 660_000);

        setTimeout(() => {
          statusPatternAnalysisJob.start();
          logger.info("Status pattern analysis job started (staggered 720s)");
        }, 720_000);

        setTimeout(() => {
          accountabilityTriggerJob.start();
          logger.info("Accountability trigger job started (staggered 780s)");
        }, 780_000);

        setTimeout(() => {
          contractEvaluationJob.start();
          logger.info("Contract evaluation job started (staggered 840s)");
        }, 840_000);

        setTimeout(() => {
          startMicroWinsJob();
          logger.info("Micro-wins job started (staggered 900s)");
        }, 900_000);

        setTimeout(() => {
          startAchievementCheckJob();
          logger.info("Achievement check job started (staggered 930s)");
        }, 930_000);

        setTimeout(() => {
          checkinCallJob.start();
          logger.info("Check-in call job started (staggered 990s)");
        }, 990_000);

        setTimeout(() => {
          startBuddySuggestionJob();
          logger.info("Buddy suggestion job started (staggered 960s)");
        }, 960_000);

        setTimeout(() => {
          calendarSyncJob.start();
          logger.info("Calendar sync job started (staggered 1020s)");
        }, 1020_000);

        setTimeout(() => {
          obstacleDetectorJob.start();
          logger.info("Obstacle detector job started (staggered 1080s)");
        }, 1080_000);

        setTimeout(() => {
          goalReconnectionJob.start();
          logger.info("Goal reconnection job started (staggered 1140s)");
        }, 1140_000);

        setTimeout(() => {
          timingProfileJob.start();
          logger.info("Timing profile job started (staggered 1260s)");
        }, 1260_000);

        setTimeout(() => {
          dataSourceSyncJob.start();
          logger.info("Data source sync job started (staggered 1320s)");
        }, 1320_000);

        setTimeout(() => {
          correlationComputeJob.start();
          logger.info("Correlation compute job started (staggered 1380s)");
        }, 1380_000);

        setTimeout(() => {
          memoryDecayJob.start();
          logger.info("Memory decay job started (staggered 1440s)");
        }, 1440_000);

        setTimeout(() => {
          memoryExtractionJob.start();
          logger.info("Memory extraction job started (staggered 1500s)");
        }, 1500_000);

        setTimeout(() => {
          coreProfileCalibrationJob.start();
          logger.info("Core profile calibration job started (staggered 1560s)");
        }, 1560_000);

        setTimeout(() => {
          wikiSynthesisJob.start();
          logger.info("Wiki synthesis job started (staggered 1620s)");
        }, 1620_000);

        setTimeout(() => {
          wikiLintJob.start();
          logger.info("Wiki lint job started (staggered 1800s)");
        }, 1800_000);

        setTimeout(() => {
          aiCoachCallReconcilerJob.start();
          logger.info("AI coach call reconciler job started (staggered 1860s)");
        }, 1860_000);

        // ── Subscription lifecycle jobs ──

        // Grace expiration: flip grace → canceled for expired grace periods (hourly)
        const GRACE_EXPIRATION_INTERVAL_MS = 60 * 60 * 1000;
        const runGraceJob = async () => {
          try { await runGraceExpirationJob(); } catch (err) {
            logger.error('[graceExpirationJob] Failed', { error: err instanceof Error ? err.message : String(err) });
          }
        };
        setTimeout(() => {
          void runGraceJob();
          setInterval(() => void runGraceJob(), GRACE_EXPIRATION_INTERVAL_MS);
          logger.info("Grace expiration job started (hourly, staggered 1620s)");
        }, 1620_000);

        // Dunning retry: process scheduled payment retries (every 6 hours)
        const DUNNING_RETRY_INTERVAL_MS = 6 * 60 * 60 * 1000;
        const runDunning = async () => {
          try { await runDunningRetryJob(); } catch (err) {
            logger.error('[dunningRetryJob] Failed', { error: err instanceof Error ? err.message : String(err) });
          }
        };
        setTimeout(() => {
          void runDunning();
          setInterval(() => void runDunning(), DUNNING_RETRY_INTERVAL_MS);
          logger.info("Dunning retry job started (every 6h, staggered 1680s)");
        }, 1680_000);

        // Stale reservation cleanup: release stuck credit reserves (every 15 min)
        const STALE_RESERVATION_INTERVAL_MS = 15 * 60 * 1000;
        const runStaleCleanup = async () => {
          try { await runStaleReservationCleanup(); } catch (err) {
            logger.error('[staleReservationCleanup] Failed', { error: err instanceof Error ? err.message : String(err) });
          }
        };
        setTimeout(() => {
          void runStaleCleanup();
          setInterval(() => void runStaleCleanup(), STALE_RESERVATION_INTERVAL_MS);
          logger.info("Stale reservation cleanup job started (every 15m, staggered 1740s)");
        }, 1740_000);

        // Monthly credit reset: reset free-tier credits when next_reset_at passes (daily)
        const CREDIT_RESET_INTERVAL_MS = 24 * 60 * 60 * 1000;
        const runCreditReset = async () => {
          try { await runMonthlyCreditResetJob(); } catch (err) {
            logger.error('[monthlyCreditResetJob] Failed', { error: err instanceof Error ? err.message : String(err) });
          }
        };
        setTimeout(() => {
          void runCreditReset();
          setInterval(() => void runCreditReset(), CREDIT_RESET_INTERVAL_MS);
          logger.info("Monthly credit reset job started (daily, staggered 1800s)");
        }, 1800_000);
      }

      if (!backgroundJobsEnabled) {
        logger.info("Background jobs DISABLED (ENABLE_BACKGROUND_JOBS=false)");
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
