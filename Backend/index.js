

// server.js
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

// Load env variables early
dotenv.config();

// Import local modules / routes
import { connectDB } from './Database/db.js';
import artpostsRoute from './Routes/artpost.js';
import productsRoute from './Routes/products.js';
import paymentsRoute from './Routes/payments.js';
import paystackRouter from './Routes/paystackroute2.js';
import paypalRouter from './Routes/paypalroute.js';
import mpesaRouter from './Routes/mpesaroute.js';
import authRoute from './Routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ------------------------
// 1. CORS & Preflight (must be first)
// ------------------------
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*', // Loosened for dev; tighten in prod
  credentials: true
}));

// Global OPTIONS handler (Express 5 syntax)
app.options('/{*any}', (req, res) => res.sendStatus(200));

// ------------------------
// 2. Logging & Body Parsing
// ------------------------
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug log for every request
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.originalUrl}`);
  next();
});

// ------------------------
// 3. Static Files
// ------------------------
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ------------------------
// 4. Debug Logs (remove in production)
// ------------------------
console.log('PAYPAL_MODE=', process.env.PAYPAL_MODE || 'sandbox (default)');
console.log('PAYPAL_CLIENT_ID present=', !!process.env.PAYPAL_CLIENT_ID);
console.log('PAYPAL_CLIENT_SECRET present=', !!process.env.PAYPAL_CLIENT_SECRET);

// ------------------------
// 5. Auth Middleware (skips OPTIONS)
// ------------------------
function requireAuth(req, res, next) {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200); // Let preflight through
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

// ------------------------
// 6. Root Route
// ------------------------
app.get('/', (req, res) => {
  res.send('API is running 🚀');
});

// ------------------------
// 7. API Routes
// ------------------------

// Public routes
app.use('/api/artposts', artpostsRoute);
app.use('/api/products', productsRoute);
app.use('/api/auth', authRoute);

// Protected payment routes
app.use('/api/payments', requireAuth, paymentsRoute);
app.use('/api/payments/paystack', paystackRouter);
app.use('/api/payments/paypal', requireAuth, paypalRouter);
app.use('/api/payments/mpesa/debug', requireAuth, mpesaRouter);

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// ------------------------
// 8. 404 Handler
// ------------------------
app.all('/{*any}', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ------------------------
// 9. Error Handling
// ------------------------
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ------------------------
// 10. Start Server
// ------------------------
async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

export default app;

