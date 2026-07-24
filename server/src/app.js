require('dotenv').config();
require('express-async-errors');

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');

const logger = require('./config/logger');
const { initSentry, Sentry } = require('./config/sentry');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');

// ── Routes ────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const socialRoutes = require('./routes/socialRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// ── Sentry ────────────────────────────────────────────────
if (process.env.SENTRY_DSN) {
  try {
    initSentry(app);
    if (Sentry?.Handlers?.requestHandler) {
      app.use(Sentry.Handlers.requestHandler());
    }
  } catch (err) {
    logger.warn('Sentry request handler skipped');
  }
}

// ── Security ──────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Configured in Nginx
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ──────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Logging ───────────────────────────────────────────────
app.use(pinoHttp({
  logger,
  customLogLevel: (req, res) => (res.statusCode >= 400 ? 'warn' : 'info'),
  autoLogging: { ignore: (req) => req.url === '/health' },
}));

// ── Body Parsing ──────────────────────────────────────────
// Note: /api/payments/webhook uses raw body — must be before json middleware
app.use((req, res, next) => {
  if (req.path === '/api/payments/webhook') {
    express.raw({ type: 'application/json' })(req, res, (err) => {
      if (err) return next(err);
      req.rawBody = req.body;
      next();
    });
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Rate Limiting ─────────────────────────────────────────
app.use('/api', apiLimiter);

// ── Prometheus Metrics ────────────────────────────────────
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'staynest_' });

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    httpRequestDuration.observe(
      { method: req.method, route: req.route?.path || req.path, status: res.statusCode },
      Date.now() - start
    );
  });
  next();
});

// ── Health Checks ─────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/ready', async (req, res) => {
  try {
    const { redis } = require('./config/redis');
    await redis.ping();
    res.json({ status: 'ready', services: { redis: 'ok', app: 'ok' } });
  } catch (err) {
    res.status(503).json({ status: 'not ready', error: err.message });
  }
});
app.get('/live', (req, res) => res.json({ status: 'live' }));

// ── Prometheus Endpoint ───────────────────────────────────
app.get('/metrics', async (req, res) => {
  try {
    const promClient = require('prom-client');
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
  } catch (err) {
    res.status(200).send('# Metrics unavailable');
  }
});

// ── API Routes ────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings',   bookingRoutes);
app.use('/api/payments',   paymentRoutes);
app.use('/api',            socialRoutes);
app.use('/api',            dashboardRoutes);

// ── Sentry Error Handler ──────────────────────────────────
if (process.env.SENTRY_DSN && Sentry?.Handlers?.errorHandler) {
  app.use(Sentry.Handlers.errorHandler());
}

// ── 404 & Global Error ────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
