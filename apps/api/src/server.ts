import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { prisma, checkDatabaseConnection } from "./config/prisma.js";

const app = createApp();

const server = app.listen(env.PORT, async () => {
  logger.info(`=========================================`);
  logger.info(`🚀 VYRE API running on http://localhost:${env.PORT}`);
  logger.info(`🏷️  Environment: ${env.NODE_ENV}`);
  logger.info(`🏥 Health check: http://localhost:${env.PORT}/api/v1/health`);
  logger.info(`=========================================`);

  const dbConnected = await checkDatabaseConnection();
  if (dbConnected) {
    logger.info("✅ PostgreSQL Database connected successfully");
  } else {
    logger.warn("⚠️ PostgreSQL Database connection check failed or pending");
  }
});

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    logger.info("HTTP server closed.");
    await prisma.$disconnect();
    logger.info("Database connection closed.");
    process.exit(0);
  });

  // Force close after 10s if hanging
  setTimeout(() => {
    logger.error("Forcefully terminating process after timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default server;
