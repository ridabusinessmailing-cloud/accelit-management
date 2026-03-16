// src/middleware/auth.ts
// JWT authentication + role-based permission guards.

import { FastifyRequest, FastifyReply } from 'fastify';

export interface JWTPayload {
  userId: string;
  role: 'admin' | 'team';
  name: string;
}

// Attach to every protected route: verifies JWT and sets request.user
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({ error: 'Unauthorized — valid token required' });
  }
}

// Attach to admin-only routes: must be authenticated AND role = admin
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await requireAuth(request, reply);

  const user = request.user as JWTPayload;
  if (user.role !== 'admin') {
    reply.code(403).send({ error: 'Forbidden — admin access required' });
  }
}

// Helper used inside route handlers to get typed current user
export function currentUser(request: FastifyRequest): JWTPayload {
  return request.user as JWTPayload;
}

// Visibility filter — applied to every tasks query for team users.
// Returns a Prisma WHERE fragment that respects the visibility rule:
//   admin → sees everything
//   team  → sees only visibility = 'team'
export function visibilityFilter(role: 'admin' | 'team') {
  if (role === 'admin') return {};
  return { visibility: 'team' as const };
}
