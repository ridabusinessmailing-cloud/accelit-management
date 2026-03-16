// src/services/assetAutomation.ts
// =====================================================================
// Task → Asset Automation
//
// Called after a task is marked done. Evaluates three conditions and
// inserts a media_assets record if all pass.
//
// Conditions:
//   1. task.status  = 'done'
//   2. task.assetLink IS NOT NULL
//   3. task.productId IS NOT NULL
//
// Field mapping:
//   asset.name           = task.title
//   asset.type           = task.type
//   asset.link           = task.assetLink
//   asset.product_id     = task.productId
//   asset.created_by     = task.assignedTo  ← producer, not admin creator
//   asset.source_task_id = task.id
//
// Duplicate protection: UNIQUE(source_task_id) + skipDuplicates: true
// =====================================================================

import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

// Only these task types trigger auto-asset creation
const AUTOMATABLE_TYPES = ['creative_video', 'creative_image', 'landing_page'] as const;
type AutomatableType = typeof AUTOMATABLE_TYPES[number];

export type CompletedTask = {
  id:         string;
  title:      string;
  type:       string;
  status:     string;
  assetLink:  string | null;
  productId:  string | null;
  assignedTo: string;  // producer — mapped to asset.createdBy
};

// Explicit return shape — avoids depending on generated Prisma.XGetPayload generics
export type CreatedAsset = {
  id:            string;
  productId:     string;
  name:          string;
  type:          AutomatableType;
  link:          string;
  createdBy:     string;
  sourceTaskId:  string | null;
  createdAt:     Date;
  creator: {
    id:   string;
    name: string;
  };
};

export async function autoCreateAsset(
  task: CompletedTask,
  client: PrismaClient = prisma,
): Promise<CreatedAsset | null> {

  // Guard: all three conditions must pass
  if (task.status !== 'done')   return null;
  if (!task.assetLink)          return null;
  if (!task.productId)          return null;

  if (!AUTOMATABLE_TYPES.includes(task.type as AutomatableType)) return null;

  try {
    // ON CONFLICT (source_task_id) DO NOTHING via skipDuplicates
    await client.mediaAsset.createMany({
      data: [{
        productId:    task.productId,
        name:         task.title,
        type:         task.type as AutomatableType,
        link:         task.assetLink,
        createdBy:    task.assignedTo,  // ← assigned team member, not admin
        sourceTaskId: task.id,
      }],
      skipDuplicates: true,
    });

    // Fetch and return the asset (whether just created or already existed)
    const asset = await client.mediaAsset.findUnique({
      where:   { sourceTaskId: task.id },
      include: { creator: { select: { id: true, name: true } } },
    });

    return asset as CreatedAsset | null;

  } catch (error) {
    // Never let automation failure block the task completion response.
    // The asset can always be uploaded manually via POST /api/assets.
    console.error('[assetAutomation] Failed to auto-create asset:', error);
    return null;
  }
}
