import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import complaintRoutes from './routes/complaintRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Security & utility middleware
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Rate Limiter: 150 requests per minute
app.use('/api', rateLimiter(150, 60000));

// System Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'JanSahayak Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.post('/api/ai/chat', async (req, res) => {
  try {
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const response = await axios.post(`${aiUrl}/api/ai/chat`, req.body, { timeout: 8000 });
    return res.json(response.data);
  } catch (err) {
    return res.json({
      reply: "Namaste! I am currently processing your request. Please mention your issue details (e.g. road pothole, water leakage, power cut, garbage) and location.",
      detected_language: "en",
      grievance_draft: null
    });
  }
});

app.use('/api', authRoutes);
app.use('/api', departmentRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 JanSahayak Backend Running on http://localhost:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=================================================`);
});

export default app;
