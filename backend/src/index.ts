import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import listRoutes from './routes/lists';
import itemRoutes from './routes/items';
import pool from './config/database';

const app = express();
const PORT = process.env.PORT || 8085;

// Middleware
app.use(cors({
  origin: true, // Allow all origins for testing
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
