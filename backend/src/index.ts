import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';

dotenv.config();

import authRoutes from './routes/auth';
import listRoutes from './routes/lists';
import itemRoutes from './routes/items';
import pool from './config/database';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 8085;

// Trust proxy - required when behind reverse proxy (nginx, etc)
app.set('trust proxy', true);

// Security Middleware
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Middleware
app.use(cors({
  origin: true, // Allow all origins for testing (Consider restricting in production)
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Log all requests
app.use((req, res, next) => {
  logger.info('Incoming request', { method: req.method, path: req.path, ip: req.ip, action: 'INCOMING_REQUEST', entityType: 'SYSTEM' });
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/items', itemRoutes);

// Health check with database connection test
app.get('/api/health', async (req, res) => {
  logger.debug('Health check request', { ip: req.ip, action: 'HEALTH_CHECK', entityType: 'SYSTEM' });

  const timestamp = new Date().toISOString();
  const apiVersion = process.env.npm_package_version || '1.0.0';

  let healthStatus = {
    status: 'OK',
    api: 'OK',
    database: 'OK',
    timestamp,
    version: apiVersion
  };

  let httpStatus = 200;

  try {
    // Test database connection with a simple query
    const dbResult = await pool.query('SELECT 1 as test');

    if (dbResult.rows.length === 1 && dbResult.rows[0].test === 1) {
      logger.debug('Database connection test successful', { action: 'DB_CHECK_SUCCESS', entityType: 'SYSTEM' });
      healthStatus.database = 'OK';
    } else {
      logger.error('Database connection test failed - unexpected result', { action: 'DB_CHECK_FAILED', entityType: 'SYSTEM' });
      healthStatus.database = 'ERROR';
      healthStatus.status = 'ERROR';
      httpStatus = 503;
    }
  } catch (error) {
    logger.error('Database connection test failed', { error, action: 'DB_CHECK_ERROR', entityType: 'SYSTEM' });
    healthStatus.database = 'ERROR';
    healthStatus.status = 'ERROR';
    httpStatus = 503;
  }

  logger.info('Health check result', { ...healthStatus, action: 'HEALTH_CHECK_RESULT', entityType: 'SYSTEM' });
  res.status(httpStatus).json(healthStatus);
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.stack, action: 'UNHANDLED_ERROR', entityType: 'SYSTEM' });
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, { action: 'SERVER_START', entityType: 'SYSTEM' });
});

export default app;
