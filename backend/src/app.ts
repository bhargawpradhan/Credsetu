import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config/env';
import authRoutes from './routes/auth.routes';
import loanRoutes from './routes/loan.routes';
import summaryRoutes from './routes/summary.routes';

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static files for uploaded receipt images
  app.use('/uploads', express.static(config.uploadDir));

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'MiniLedger API',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/loans', loanRoutes);
  app.use('/api/summary', summaryRoutes);

  // Serve compiled React Native Web App if available
  const mobileDistDir = path.resolve(__dirname, '../../mobile/dist');
  if (fs.existsSync(mobileDistDir)) {
    app.use(express.static(mobileDistDir));
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next();
      }
      res.sendFile(path.join(mobileDistDir, 'index.html'));
    });
  }

  // 404 Handler for unhandled API routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Resource not found',
    });
  });

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });

  return app;
}
