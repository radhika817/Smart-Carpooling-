import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './utils/db.js';
import { initSocket } from './socket/index.js';
import authRoutes from './routes/authRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import rideRoutes from './routes/rideRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import groupRoutes from './routes/groupRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const normalized = origin.replace(/\/+$/, '');
  const allowed = [
    CLIENT_URL.replace(/\/+$/, ''),
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://smart-carpooling.vercel.app',
  ];
  if (allowed.includes(normalized)) return true;
  if (/^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/.test(normalized)) return true;
  return false;
};

// Security & Parsing Middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for development
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'SmartRide API',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl} not found.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    console.error('Unhandled Server Error:', err);
  } else {
    console.warn(`[Client Error ${statusCode}]: ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
  });
});

// Create HTTP server & bind Socket.IO
const httpServer = http.createServer(app);
initSocket(httpServer, CLIENT_URL);

// Connect DB and Start Server
export const startServer = async () => {
  await connectDB();
  return httpServer.listen(PORT, () => {
    console.log(`🚀 SmartRide backend server running on http://localhost:${PORT}`);
  });
};

const isDirectRun = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/.*[\/\\]/, ''));
if (isDirectRun && process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, httpServer };
