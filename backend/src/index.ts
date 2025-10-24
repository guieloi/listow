import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth';
import listRoutes from './routes/lists';
import itemRoutes from './routes/items';

dotenv.config();

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

// Health check
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check request from:', req.ip, 'at', new Date().toISOString());
  res.json({ status: 'OK', message: 'Listow API is running' });
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
