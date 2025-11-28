/**
 * Yield Ranker API Server
 * 
 * Production-grade Express server with TypeScript
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';

import config, { validateConfig } from './config/index.js';
import { logger } from './utils/index.js';
import tiingoRoutes from './routes/tiingo.js';
import etfRoutes from './routes/etfs.js';
import userRoutes from './routes/user.js';

// ============================================================================
// Configuration Validation
// ============================================================================

try {
  validateConfig();
  logger.info('Server', 'Configuration validated successfully');
} catch (error) {
  logger.error('Server', `Configuration error: ${(error as Error).message}`);
  process.exit(1);
}

// ============================================================================
// Express App Setup
// ============================================================================

const app: Express = express();

// ============================================================================
// Middleware
// ============================================================================

// CORS
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (production-grade)
app.use((req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now();
  
  _res.on('finish', () => {
    const duration = Date.now() - start;
    const level = _res.statusCode >= 400 ? 'warn' : 'info';
    logger[level]('HTTP', `${req.method} ${req.path} ${_res.statusCode} ${duration}ms`);
  });
  
  next();
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.env,
    version: process.env.npm_package_version ?? '1.0.0',
  });
});

// ============================================================================
// API Routes
// ============================================================================

app.use('/api/tiingo', tiingoRoutes);
app.use('/api/etfs', etfRoutes);
app.use('/api/admin', etfRoutes); // Legacy support for /api/admin/upload-static
app.use('/api/user', userRoutes);

// ============================================================================
// Error Handling
// ============================================================================

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
}

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
  });
});

// Global error handler
app.use((err: HttpError, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.status ?? err.statusCode ?? 500;
  
  logger.error('Server', `Error: ${err.message}`, err.stack);
  
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : err.message,
    ...(config.env === 'development' && { stack: err.stack }),
  });
});

// ============================================================================
// Server Startup
// ============================================================================

const server = app.listen(config.port, () => {
  logger.info('Server', `🚀 Server running on port ${config.port}`);
  logger.info('Server', `📊 Environment: ${config.env}`);
  logger.info('Server', `🔗 Health check: http://localhost:${config.port}/api/health`);
});

// ============================================================================
// Graceful Shutdown
// ============================================================================

function gracefulShutdown(signal: string): void {
  logger.info('Server', `${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('Server', 'HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    logger.warn('Server', 'Forcing shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
