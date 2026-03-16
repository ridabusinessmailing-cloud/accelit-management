// src/routes/tasks.ts
// GET   /api/tasks
// POST  /api/tasks              (admin only)
// PATCH /api/tasks/:id
// POST  /api/tasks/:id/complete  ← triggers Task→Asset automation

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, currentUser, visibilityFilter } from '../middleware/auth';
import { autoCreateAsset } from '../services/assetAutomation';

// Asset link is required for creative types when completing a task
const ASSET_REQUIRED_TYPES = ['creative_video', 'creative_image', 'landing_page'] as const;

const createTaskSchema = z.object({
  title:       z.string().min(1).max(255),
  description: z.string().optional(),
  assignedTo:  z.string().uuid(),
  productId:   z.string().uuid().optional(),
  type:        z.enum(['creative_video', 'creative_image', 'landing_page', 'research', 'other']),
  visibility:  z.enum(['team', 'admin_only']).default('team'),
  dueDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  assetLink:   z.string().url().optional(),
});

const updateTaskSchema = z.object({
  title:       z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  assignedTo:  z.string().uuid().optional(),
  productId:   z.string().uuid().nullable().optional(),
  status:      z.enum(['todo', 'in_progress', 'done']).optional(),
  assetLink:   z.string().url().nullable().optional(),
  visibility:  z.enum(['team', 'admin_only']).optional(),
  dueDate:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const completeTaskSchema = z.object({
  assetLink: z.string().url().optional(),
});

export async function taskRoutes(app: FastifyInstance) {

  // GET /api/tasks — Kanban board data, visibility-filtered
  // Optional query params: ?assignedTo=uuid  ?date=YYYY-MM-DD  ?productId=uuid
  app.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const user = currentUser(request);
    const query = request.query as {
      assignedTo?: string;
      date?:       string;
      productId?:  string;
    };

    const where: Record<string, unknown> = {
      ...visibilityFilter(user.role),
    };

    if (query.assignedTo) where.assignedTo = query.assignedTo;
    if (query.productId)  where.productId  = query.productId;
    if (query.date) {
      const d = new Date(query.date);
      where.dueDate = d;
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        assignee: { select: { id: true, name: true, role: true } },
        creator:  { select: { id: true, name: true } },
        product:  { select: { id: true, name: true } },
        asset:    { select: { id: true, name: true, link: true } },
      },
    });

    return reply.send(tasks);
  });

  // POST /api/tasks — admin only
  app.post('/', { preHandler: requireAdmin }, async (request, reply) => {
    const body = createTaskSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Validation failed', details: body.error.flatten() });
    }

    const user = currentUser(request);
    const task = await prisma.task.create({
      data: {
        title:       body.data.title,
        description: body.data.description,
        assignedTo:  body.data.assignedTo,
        createdBy:   user.userId,
        productId:   body.data.productId ?? null,
        type:        body.data.type,
        visibility:  body.data.visibility,
        dueDate:     new Date(body.data.dueDate),
        assetLink:   body.data.assetLink ?? null,
      },
      include: {
        assignee: { select: { id: true, name: true } },
        product:  { select: { id: true, name: true } },
      },
    });

    return reply.code(201).send(task);
  });

  // PATCH /api/tasks/:id — update fields (drag-and-drop column change, etc.)
  app.patch('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateTaskSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Validation failed', details: body.error.flatten() });
    }

    const user = currentUser(request);

    // Team users can only update tasks assigned to them
    if (user.role === 'team') {
      const task = await prisma.task.findUnique({ where: { id } });
      if (!task || task.assignedTo !== user.userId) {
        return reply.code(403).send({ error: 'You can only update your own tasks' });
      }
      // Team users cannot change visibility or assignee
      delete body.data.visibility;
      delete body.data.assignedTo;
    }

    const updateData: Record<string, unknown> = { ...body.data };
    if (body.data.dueDate) {
      updateData.dueDate = new Date(body.data.dueDate);
      delete updateData['dueDate'];
      updateData.dueDate = new Date(body.data.dueDate);
    }

    const updated = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true } },
        product:  { select: { id: true, name: true } },
      },
    });

    return reply.send(updated);
  });

  // POST /api/tasks/:id/complete — marks task done + triggers asset automation
  app.post('/:id/complete', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = completeTaskSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Validation failed', details: body.error.flatten() });
    }

    // 1. Fetch task
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return reply.code(404).send({ error: 'Task not found' });
    }

    // 2. Permission: team users can only complete their own tasks
    const user = currentUser(request);
    if (user.role === 'team' && task.assignedTo !== user.userId) {
      return reply.code(403).send({ error: 'You can only complete your own tasks' });
    }

    // 3. Determine final assetLink — body can supply/override, else use existing
    const assetLink = body.data.assetLink ?? task.assetLink ?? null;

    // 4. Enforce mandatory asset link for creative types
    if (
      ASSET_REQUIRED_TYPES.includes(task.type as typeof ASSET_REQUIRED_TYPES[number]) &&
      !assetLink
    ) {
      return reply.code(422).send({
        error: `Asset link is required to complete a "${task.type}" task`,
      });
    }

    // 5. Mark task as done
    const completedTask = await prisma.task.update({
      where: { id },
      data:  { status: 'done', assetLink },
      include: {
        assignee: { select: { id: true, name: true } },
        product:  { select: { id: true, name: true } },
      },
    });

    // 6. Trigger automation — may return null if conditions not met or already exists
    const createdAsset = await autoCreateAsset(completedTask);

    return reply.send({
      task: completedTask,
      assetCreated: createdAsset !== null,
      asset: createdAsset,
    });
  });
}
