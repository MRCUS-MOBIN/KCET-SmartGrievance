import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    // Allow any localhost origin (any port) or no origin (curl/Postman)
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
    const allowed = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim());
    if (allowed.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (local storage — switch to CDN in production)
const uploadsDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.join(__dirname, uploadsDir)));

// ── Routes ────────────────────────────────────────────────────────────────────
import authRouter          from './routes/auth.js';
import complaintsRouter    from './routes/complaints.js';
import categoriesRouter    from './routes/categories.js';
import analyticsRouter     from './routes/analytics.js';
import routingRouter       from './routes/routing.js';
import safetyRouter        from './routes/safety.js';
import notificationsRouter from './routes/notifications.js';

app.use('/api/auth',          authRouter);
app.use('/api/complaints',    complaintsRouter);
app.use('/api/categories',    categoriesRouter);
app.use('/api/analytics',     analyticsRouter);
app.use('/api/routing',       routingRouter);
app.use('/api/safety',        safetyRouter);
app.use('/api/notifications', notificationsRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ ok: true, service: 'KCET SmartGrievance API', version: '2.0.0' })
);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Route not found.' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error.' });
});

// ── MongoDB + Start ───────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kcet_360_smartgrievance';

async function connectAndStart() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB connected:', MONGO_URI);
  } catch (err) {
    console.warn('⚠️ MongoDB Atlas / Local connection failed:', err.message);
    console.log('🔄 Starting fallback MongoMemoryServer (In-Memory Database)...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      let mongoServer;
      try {
        mongoServer = await MongoMemoryServer.create({ instance: { port: 27017, dbName: 'kcet_360_smartgrievance' } });
      } catch {
        mongoServer = await MongoMemoryServer.create({ instance: { dbName: 'kcet_360_smartgrievance' } });
      }
      const memUri = mongoServer.getUri();
      await mongoose.connect(memUri);
      console.log('✅ In-Memory MongoDB connected:', memUri);
    } catch (memErr) {
      console.error('❌ Could not start MongoMemoryServer:', memErr.message);
      process.exit(1);
    }
  }

  try {
    const { seedCategories } = await import('./seed/categories.seed.js');
    if (seedCategories) await seedCategories();
    const { seedDepartments } = await import('./seed/departments.seed.js');
    if (seedDepartments) await seedDepartments();
  } catch (sErr) {
    console.warn('Auto-seed warning:', sErr.message);
  }

  app.listen(PORT, () =>
    console.log(`✅ KCET SmartGrievance API  →  http://localhost:${PORT}`)
  );
}

connectAndStart();

