// src/app.js
console.log(">>> DÉMARRAGE DU SCRIPT SERVER.JS <<<"); // Ligne cruciale pour tester
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';

const app = express();

/**
 * CORS setup
 * ALLOWED_ORIGINS should be a comma-separated list, e.g.:
 *   https://myfrontend.com,https://admin.myfrontend.com
 */
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || '';
const allowedOrigins = rawAllowedOrigins
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

console.log('CORS allowed origins:', allowedOrigins);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // Postman, curl, server-to-server

      if (allowedOrigins.length > 0) {
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        console.warn(`CORS blocked origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
      }

      // If no ALLOWED_ORIGINS configured, allow all
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Core middleware
app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));

/**
 * Health check route
 * Accessible at:
 *   GET /health
 *   GET /api/health
 */
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV,
    time: new Date(),
  });
});

// Mount all API routes
app.use('/api', routes);

// 404 handler (keep this LAST before error handler)
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not found', path: req.path });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

export default app;
