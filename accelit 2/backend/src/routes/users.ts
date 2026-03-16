// src/routes/users.ts
// GET /api/users — returns all users (id + name + role).
// Used by the frontend to populate the "Assign To" select with real UUIDs
// and to map Kanban column names back to user IDs on drag-and-drop.

import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

export async function userRoutes(app: FastifyInstance) {

  // GET /api/users
  app.get('/', { preHandler: requireAuth }, async (_request, reply) => {
    const users = await prisma.user.findMany({
      select: {
        id:   true,
        name: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });
    return reply.send(users);
  });
}
