import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { requestLogger } from './middleware/requestLogger';
import routes from './routes';
import { logger } from './utils/logger';
import { initializeRedis } from './config/redis';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = Number(process.env.PORT) || 5000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use(`/api/${API_VERSION}`, routes);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize services and start server
const startServer = async () => {
  try {
    // Initialize Redis connection (optional - continue even if it fails)
    try {
      await initializeRedis();
      logger.info('Redis connection established');
    } catch (redisError) {
      logger.warn('Redis connection failed, continuing without Redis:', redisError);
    }

    // Start server — bind to 0.0.0.0 so phones on same WiFi can reach it via your machine's IP
    const HOST = process.env.HOST || '0.0.0.0';
    const server = app.listen(PORT, HOST, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      logger.info(`📡 API available at http://localhost:${PORT}/api/${API_VERSION}`);
      logger.info(`💚 Health check at http://localhost:${PORT}/health`);
      if (HOST === '0.0.0.0') {
        logger.info(`📱 For Expo on device: set EXPO_PUBLIC_API_URL=http://YOUR_MAC_IP:${PORT}/api/${API_VERSION} in SmartCampusMobile/.env.local (find IP: ipconfig getifaddr en0)`);
      }
    });
    server.on('error', (err: any) => {
      if (err?.code === 'EADDRINUSE') {
        // Keep this actionable: devs can immediately free the port and restart.
        // eslint-disable-next-line no-console
        console.error(`❌ Port ${PORT} is already in use. Kill the process:`);
        // eslint-disable-next-line no-console
        console.error(`   lsof -ti:${PORT} | xargs kill -9`);
        process.exit(1);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();

export default app;

