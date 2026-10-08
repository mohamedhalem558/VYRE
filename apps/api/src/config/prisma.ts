import { PrismaClient } from "@prisma/client";

// ─── Optimize Database URL for Cloud Hosting (Railway / Render / Supabase) ────
function getOptimizedDatabaseUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return undefined;

  try {
    const url = new URL(rawUrl);

    // Optimized pool & timeout parameters for cloud PostgreSQL
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", process.env.DB_CONNECTION_LIMIT || "10");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", process.env.DB_POOL_TIMEOUT || "20");
    }
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", process.env.DB_CONNECT_TIMEOUT || "15");
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

// ─── Connection Error Detector ────────────────────────────────────────────────
export function isConnectionClosedError(error: any): boolean {
  if (!error) return false;
  const msg = String(error.message || error).toLowerCase();
  const code = String(error.code || "").toUpperCase();

  return (
    msg.includes("kind: closed") ||
    msg.includes("error in postgresql connection") ||
    msg.includes("connection closed") ||
    msg.includes("server closed the connection") ||
    msg.includes("connection reset") ||
    msg.includes("econnreset") ||
    msg.includes("socket closed") ||
    msg.includes("can't reach database server") ||
    code === "P1001" || // Can't reach database server
    code === "P1002" || // Database server was reached but timed out
    code === "P1017"    // Server has closed the connection
  );
}

// ─── Prisma Client Singleton Instance ─────────────────────────────────────────
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  keepAliveTimer: NodeJS.Timeout | undefined;
};

const optimizedUrl = getOptimizedDatabaseUrl();

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: optimizedUrl
      ? {
          db: {
            url: optimizedUrl,
          },
        }
      : undefined,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

globalForPrisma.prisma = prisma;

// ─── Safe Reconnection Utility ────────────────────────────────────────────────
let isReconnecting = false;

export async function safeReconnect(retries = 3, delayMs = 1000): Promise<boolean> {
  if (isReconnecting) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return true;
  }

  isReconnecting = true;
  console.warn("⚠️ [Prisma] PostgreSQL connection dropped/closed. Initiating graceful reconnection...");

  try {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await prisma.$disconnect().catch(() => {});
        await prisma.$connect();
        console.log(`✅ [Prisma] Reconnected to PostgreSQL successfully (Attempt ${attempt}/${retries})`);
        return true;
      } catch (err: any) {
        console.warn(`[Prisma] Reconnect attempt ${attempt}/${retries} failed:`, err?.message || err);
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
        }
      }
    }
  } finally {
    isReconnecting = false;
  }

  console.error("❌ [Prisma] All reconnection attempts to PostgreSQL exhausted.");
  return false;
}

// ─── Database Health Check & Reconnection Ping ────────────────────────────────
export async function checkDatabaseConnection(forceReconnect = false): Promise<boolean> {
  if (forceReconnect) {
    return safeReconnect();
  }

  try {
    // Lightweight ping to verify active connection
    await prisma.$queryRawUnsafe("SELECT 1");
    return true;
  } catch (error: any) {
    console.warn("⚠️ [Prisma] Database connection ping failed:", error?.message || error);
    if (isConnectionClosedError(error)) {
      return safeReconnect();
    }
    return false;
  }
}

// ─── Query Wrapper with Auto-Retry on Closed Sockets ──────────────────────────
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 2
): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      if (isConnectionClosedError(error) && attempt < maxRetries) {
        console.warn(
          `[Prisma] Connection closed during query execution. Reconnecting and retrying (Attempt ${attempt}/${maxRetries})...`
        );
        await safeReconnect(2, 500);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// ─── Proactive Keep-Alive Heartbeat ───────────────────────────────────────────
// Cloud hosts (Railway / Render) drop idle connections after a few minutes of inactivity.
// Pinging the database every 3 minutes keeps TCP connections warm and prevents idle dropouts.
if (!process.env.VERCEL && !globalForPrisma.keepAliveTimer) {
  const HEARTBEAT_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

  const timer = setInterval(async () => {
    try {
      await prisma.$queryRawUnsafe("SELECT 1");
    } catch (err: any) {
      if (isConnectionClosedError(err)) {
        await safeReconnect(2, 500);
      }
    }
  }, HEARTBEAT_INTERVAL_MS);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  globalForPrisma.keepAliveTimer = timer;
}
