// src/routes/products.ts
// GET  /api/products
// POST /api/products          (admin only)
// GET  /api/products/:id
// GET  /api/products/:id/assets

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, currentUser } from '../middleware/auth';

const createProductSchema = z.object({
  name:          z.string().min(1).max(200),
  description:   z.string().optional(),
  adAccounts:    z.string().optional(),
  monthlyBudget: z.string().optional(),
});

export async function productRoutes(app: FastifyInstance) {

  // GET /api/products — list all active products with task/asset counts
  app.get('/', { preHandler: requireAuth }, async (_request, reply) => {
    const products = await prisma.product.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true } },
        _count: {
          select: {
            tasks:  true,
            assets: true,
          },
        },
      },
    });
    return reply.send(products);
  });

  // POST /api/products — admin only
  app.post('/', { preHandler: requireAdmin }, async (request, reply) => {
    const body = createProductSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Validation failed', details: body.error.flatten() });
    }

    const user = currentUser(request);
    const product = await prisma.product.create({
      data: {
        name:          body.data.name,
        description:   body.data.description,
        adAccounts:    body.data.adAccounts,
        monthlyBudget: body.data.monthlyBudget,
        createdBy:     user.userId,
      },
    });

    return reply.code(201).send(product);
  });

  // GET /api/products/:id — product detail + related stats
  app.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true } },
        _count: {
          select: { tasks: true, assets: true },
        },
      },
    });

    if (!product) {
      return reply.code(404).send({ error: 'Product not found' });
    }

    return reply.send(product);
  });

  // GET /api/products/:id/assets — all assets for a product, newest first
  app.get('/:id/assets', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const assets = await prisma.mediaAsset.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        creator:    { select: { id: true, name: true } },
        sourceTask: { select: { id: true, title: true } },
      },
    });

    return reply.send(assets);
  });
}
