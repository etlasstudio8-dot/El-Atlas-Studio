require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

const app = express();

// Render terminates HTTPS at one reverse proxy. Trust that hop so
// express-rate-limit can safely use the real client IP from X-Forwarded-For.
app.set('trust proxy', 1);

// ─── Database ────────────────────────────────────────────────────────────────
connectDB();

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.DASHBOARD_URL,
  // Firebase hosting
  'https://elatlas-studio.web.app',
  'https://elatlas-studio.firebaseapp.com',
  // Render (your admin HTML is served from here too)
  'https://el-atlas-studio.onrender.com',
  // Common local dev ports
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5173',
  'http://localhost:5500',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5500',
]
  .filter(Boolean)
  .map(u => u.replace(/\/$/, ''));

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any onrender.com subdomain (covers all your deployed apps)
    if (/\.onrender\.com$/.test(origin)) return callback(null, true);
    // Allow any web.app / firebaseapp.com subdomain
    if (/\.(web\.app|firebaseapp\.com)$/.test(origin)) return callback(null, true);
    console.warn('CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ─── Helmet ──────────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ─── Body Parsers ────────────────────────────────────────────────────────────
// 25mb to handle base64 image uploads from the admin dashboard
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// ─── Request Logger (dev only) ───────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/users',     require('./routes/userRoutes'));
app.use('/api/content',   require('./routes/contentRoutes'));
app.use('/api/portfolio', require('./routes/portfolioRoutes'));
app.use('/api/blog',      require('./routes/blogRoutes'));
app.use('/api/services',  require('./routes/serviceRoutes'));
app.use('/api/team',      require('./routes/teamRoutes'));
app.use('/api/contacts',  require('./routes/contactRoutes'));
app.use('/api/subscribers',  require('./routes/subscriberRoutes'));
app.use('/api/approvals', require('./routes/approvalRoutes'));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'EL ATLAS Backend API is running',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ─── Root ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to EL ATLAS Backend API',
    version: '1.0.0',
    routes: [
      '/api/auth', '/api/users', '/api/content', '/api/portfolio',
      '/api/blog', '/api/services', '/api/team', '/api/contacts', '/api/approvals'
    ]
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Global error:', err.message);

  if (err.message === 'Not allowed by CORS')
    return res.status(403).json({ success: false, message: 'CORS policy blocked this request.' });

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message).join(', ');
    return res.status(400).json({ success: false, message: messages });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue?.[field] || '';
    return res.status(400).json({
      success: false,
      message: `${field} '${value}' already exists.`
    });
  }

  if (err.name === 'JsonWebTokenError')
    return res.status(401).json({ success: false, message: 'Invalid token.' });

  if (err.name === 'TokenExpiredError')
    return res.status(401).json({ success: false, message: 'Token expired, please sign in again.' });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 EL ATLAS Backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = app;
