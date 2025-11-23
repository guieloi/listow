import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

import authRoutes from './routes/auth';
import listRoutes from './routes/lists';
import itemRoutes from './routes/items';
import pool from './config/database';

const app = express();
const PORT = process.env.PORT || 8085;

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
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} from ${req.ip} at ${new Date().toISOString()}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/items', itemRoutes);

// Health check with database connection test
app.get('/api/health', async (req, res) => {
  console.log('🏥 Health check request from:', req.ip, 'at', new Date().toISOString());

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
      console.log('✅ Database connection test successful');
      healthStatus.database = 'OK';
    } else {
      console.log('❌ Database connection test failed - unexpected result');
      healthStatus.database = 'ERROR';
      healthStatus.status = 'ERROR';
      httpStatus = 503;
    }
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    healthStatus.database = 'ERROR';
    healthStatus.status = 'ERROR';
    httpStatus = 503;
  }

  console.log('🏥 Health check result:', healthStatus);
  res.status(httpStatus).json(healthStatus);
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
