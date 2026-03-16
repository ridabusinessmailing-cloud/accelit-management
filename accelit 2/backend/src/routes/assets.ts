// src/routes/assets.ts
// GET  /api/assets     — all assets (optional ?productId= filter)
// POST /api/assets     — manual asset upload (any authenticated user)

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, currentUser } from '../middleware/auth';

const createAssetSchema = z.object({
  productId:    z.string().uuid(),
  name:         z.string().min(1).max(255),
  type:         z.enum(['creative_video', 'creative_image', 'landing_page']),
  link:         z.string().url(),
  sourceTaskId: z.string().uuid().optional(),
});

export async function assetRoutes(app: FastifyInstance) {

  // GET /api/assets — optionally filter by product
  app.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const { productId } = request.query as { productId?: string };

    const assets = await prisma.mediaAsset.findMany({
      where:   productId ? { productId } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
        sourceTask: { select: { id: true, title: true } },
      },
    });

    return reply.send(assets);
  });

  // POST /api/assets — manual upload
  app.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const body = createAssetSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Validation failed', details: body.error.flatten() });
    }

    const user = currentUser(request);

    const asset = await prisma.mediaAsset.create({
      data: {
        productId:    body.data.productId,
        name:         body.data.name,
        type:         body.data.type,
        link:         body.data.link,
        createdBy:    user.userId,
        sourceTaskId: body.data.sourceTaskId ?? null,
      },
      include: {
        product: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    return reply.code(201).send(asset);
  });
}
