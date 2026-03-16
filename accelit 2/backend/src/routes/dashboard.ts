// src/routes/dashboard.ts
// GET /api/dashboard — aggregated stats for the dashboard page

import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { requireAuth, currentUser, visibilityFilter } from '../middleware/auth';

export async function dashboardRoutes(app: FastifyInstance) {

  app.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const user = currentUser(request);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const vFilter = visibilityFilter(user.role);

    const [
      totalProducts,
      activeTasks,
      delayedTasks,
      recentAssets,
    ] = await Promise.all([

      // Total active products
      prisma.product.count({
        where: { status: 'active' },
      }),

      // Active tasks: not done AND due_date >= today
      prisma.task.count({
        where: {
          ...vFilter,
          status: { not: 'done' },
          dueDate: { gte: today },
        },
      }),

      // Delayed tasks: not done AND due_date < today
      prisma.task.count({
        where: {
          ...vFilter,
          status: { not: 'done' },
          dueDate: { lt: today },
        },
      }),

      // 5 most recently created assets
      prisma.mediaAsset.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
        },
      }),
    ]);

    return reply.send({
      totalProducts,
      activeTasks,
      delayedTasks,
      recentAssets,
    });
  });
}
