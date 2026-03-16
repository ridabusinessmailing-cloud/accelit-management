// src/routes/auth.ts
// POST /api/auth/login  — returns a signed JWT

import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {

  // POST /api/auth/login
  app.post('/login', async (request, reply) => {
    const body = loginSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: 'Invalid request', details: body.error.flatten() });
    }

    const user = await prisma.user.findUnique({
      where: { email: body.data.email },
    });

    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(body.data.password, user.password);
    if (!passwordMatch) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    const token = app.jwt.sign(
      { userId: user.id, role: user.role, name: user.name },
      { expiresIn: '8h' }
    );

    return reply.send({
      token,
      user: {
        id:   user.id,
        name: user.name,
        role: user.role,
      },
    });
  });
}
