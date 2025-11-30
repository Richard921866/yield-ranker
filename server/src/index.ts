
/**
 * Yield Ranker API Server
 * Production-grade Express server with TypeScript + Railway support
 */

import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import config, { validateConfig } from "./config/index.js";
import { logger } from "./utils/index.js";

import tiingoRoutes from "./routes/tiingo.js";
import etfRoutes from "./routes/etfs.js";
import userRoutes from "./routes/user.js";

// ============================================================================
// Configuration Validation
// ============================================================================
try {
  validateConfig();
  logger.info("Server", "Configuration validated successfully");
} catch (error) {
  logger.error("Server", `Configuration error: ${(error as Error).message}`);
  process.exit(1);
}

const app: Express = express();

// ============================================================================
// Middleware
// ============================================================================

// CORS: Allow production OR development requests
app.use(
  cors({
    origin: config.cors.origins || "*",
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request timing + logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? "warn" : "info";
    logger[level](
      "HTTP",
      `${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });
  next();
});

// ============================================================================
// Health Check
// ============================================================================
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: config.env,
    version: process.env.npm_package_version ?? "1.0.0",
  });
});

// ============================================================================
// Routes
// ============================================================================
app.use("/api/tiingo", tiingoRoutes);
app.use("/api/etfs", etfRoutes);
app.use("/api/admin", etfRoutes); // Legacy
app.use("/api/user", userRoutes);

// ============================================================================
// 404 Handler
// ============================================================================
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource does not exist",
  });
});

// ============================================================================
// Global Error Handler
// ============================================================================
interface HttpError extends Error {
  status?: number;
}

app.use((err: HttpError, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.status ?? 500;
  logger.error("Server", err.message, err.stack);

  res.status(statusCode).json({
    error: statusCode === 500 ? "Internal Server Error" : err.message,
    ...(config.env === "development" && { stack: err.stack }),
  });
});

// ============================================================================
// Server Startup (Railway Compatible)
// ============================================================================

const PORT = Number(process.env.PORT) || config.port || 3000;

const server = app.listen(PORT, "0.0.0.0", () => {
  logger.info("Server", `🚀 Running on port ${PORT}`);
  logger.info("Server", `📊 Environment: ${config.env}`);
});

// ============================================================================
// Graceful Shutdown
// ============================================================================
function gracefulShutdown(signal: string): void {
  logger.info("Server", `${signal} received. Shutting down gracefully...`);

  server.close(() => {
    logger.info("Server", "HTTP server closed");
    process.exit(0);
  });

  // Force shutdown after timeout
  setTimeout(() => {
    logger.warn("Server", "Forcing shutdown after timeout");
    process.exit(1);
  }, 30000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default app;
