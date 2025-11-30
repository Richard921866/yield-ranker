
/**
 * Yield Ranker API Server (Railway Compatible)
 */

import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";

import config, { validateConfig } from "./config/index.js";
import { logger } from "./utils/index.js";

import tiingoRoutes from "./routes/tiingo.js";
import etfRoutes from "./routes/etfs.js";
import userRoutes from "./routes/user.js";

// ============================================================================
// Config Validation (No more crashing server)
// ============================================================================
try {
  validateConfig();
  logger.info("Config", "Configuration validated successfully");
} catch (error) {
  logger.warn(
    "Config",
    `Configuration warning: ${(error as Error).message}. Starting anyway...`
  );
}

const app: Express = express();

// ============================================================================
// Middleware
// ============================================================================
app.use(
  cors({
    origin: config.cors.origins || "*",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? "warn" : "info";
    logger[level]("HTTP", `${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ============================================================================
// Health Check Route
// ============================================================================
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

// ============================================================================
// API Routes
// ============================================================================
app.use("/api/tiingo", tiingoRoutes);
app.use("/api/etfs", etfRoutes);
app.use("/api/admin", etfRoutes); // Legacy
app.use("/api/user", userRoutes);

// ============================================================================
// 404 Handler
// ============================================================================
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

// ============================================================================
// Global Error Handler
// ============================================================================
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 500;
  logger.error("ERROR", err.message, err.stack);
  res.status(status).json({
    error: status === 500 ? "Internal Server Error" : err.message,
  });
});

// ============================================================================
// Start Server (Railway-required)
// ============================================================================
const PORT = Number(process.env.PORT) || config.port || 3000;

const server = app.listen(PORT, "0.0.0.0", () => {
  logger.info("Server", `🚀 Server running on 0.0.0.0:${PORT}`);
});

// ============================================================================
// Error Visibility (Log crashes instead of silent death)
// ============================================================================
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT", err.message, err.stack);
});

process.on("unhandledRejection", (reason: any) => {
  logger.error("UNHANDLED", reason?.message || reason);
});

// ============================================================================
// Graceful Shutdown
// ============================================================================
function gracefulShutdown(signal: string) {
  logger.info("Server", `${signal} received. Shutting down...`);
  server.close(() => process.exit(0));
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default app;
