import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// Route imports
import authRoutes from './routes/auth.routes.js';
import listingsRoutes from './routes/listings.routes.js';
import marketplaceRoutes from './routes/marketplace.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import pricingRoutes from './routes/pricing.routes.js';
import forecastRoutes from './routes/forecast.routes.js';
import logisticsRoutes from './routes/logistics.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import provenanceRoutes from './routes/provenance.routes.js';
import voiceRoutes from './routes/voice.routes.js';


// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

export const app = express();

// Security and utility middleware
app.use(helmet({
  contentSecurityPolicy: false, // allow local inline scripts / images in dev
}));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Standard Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'AgriDirect Core API Gateway',
    version: '1.0.0-PROD',
  });
});

// Root API v1 Information Endpoint
app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    data: {
      name: 'AgriDirect API Gateway',
      version: 'v1',
      documentation: '/api/v1/docs',
      modules: [
        'auth',
        'users',
        'listings',
        'marketplace',
        'orders',
        'pricing',
        'logistics',
        'hubs',
        'ai',
        'admin'
      ]
    }
  });
});

// Core Route mounts
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/listings', listingsRoutes);
app.use('/api/v1/marketplace', marketplaceRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/pricing', pricingRoutes);
app.use('/api/v1/forecasts', forecastRoutes);
app.use('/api/v1/logistics', logisticsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/provenance', provenanceRoutes);
app.use('/api/v1/voice', voiceRoutes);


// Centralized 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    }
  });
});

// Centralized Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error]:', err);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected internal server error occurred',
      details: process.env.NODE_ENV === 'development' ? err.details || null : null,
    }
  });
});
