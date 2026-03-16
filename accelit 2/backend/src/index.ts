// src/index.ts

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';

import { authRoutes }      from './routes/auth';
import { userRoutes }      from './routes/users';
import { dashboardRoutes } from './routes/dashboard';
import { productRoutes }   from './routes/products';
import { taskRoutes }      from './routes/tasks';
import { assetRoutes }     from './routes/assets';

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  },
});

async function bootstrap() {

  // ── Plugins ─────────────────────────────────────────────────
  await app.register(cors, {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'dev_secret_change_in_production',
  });

  // ── Routes ──────────────────────────────────────────────────
  app.register(authRoutes,      { prefix: '/api/auth' });
  app.register(userRoutes,      { prefix: '/api/users' });
  app.register(dashboardRoutes, { prefix: '/api/dashboard' });
  app.register(productRoutes,   { prefix: '/api/products' });
  app.register(taskRoutes,      { prefix: '/api/tasks' });
  app.register(assetRoutes,     { prefix: '/api/assets' });

  // Health check
  app.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }));

  // ── Start ────────────────────────────────────────────────────
  const port = parseInt(process.env.PORT ?? '3001', 10);
  const host = process.env.HOST ?? '0.0.0.0';

  await app.listen({ port, host });
  app.log.info(`Accelit API running on http://${host}:${port}`);
}

bootstrap().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
