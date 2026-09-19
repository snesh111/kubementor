import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import corsOptions from './config/corsConfig.js';
import apiRouter from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

const app = express();

// Cross-Origin Resource Sharing (must be before routes & helmet)
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Security HTTP headers configured for cross-origin APIs
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: false,
    contentSecurityPolicy: false,
  })
);

// HTTP Request Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Base API route mounting
app.use('/api/v1', apiRouter);

// 404 Route Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
