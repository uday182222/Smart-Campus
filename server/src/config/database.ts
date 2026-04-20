import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Prisma Client instance
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e: any) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });
}

// Log errors
prisma.$on('error', (e: any) => {
  logger.error('Database error:', e);
});

// Log warnings
prisma.$on('warn', (e: any) => {
  logger.warn('Database warning:', e);
});

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    logger.info('✅ Database connection established');
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    return false;
  }
};

// Disconnect from database
export const disconnect = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info('Database connection closed');
};

export default prisma;

