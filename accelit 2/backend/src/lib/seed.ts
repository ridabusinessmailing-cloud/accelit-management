// backend/src/lib/seed.ts
// Run with: npm run db:seed
// Seeds the database with the four team members and three example products.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database…');

  // ── Users ───────────────────────────────────────────────────
  const password = await bcrypt.hash('accelit2024', 12);

  const [rida, oussama, saida, sana] = await Promise.all([
    prisma.user.upsert({
      where:  { email: 'rida@accelit.com' },
      update: {},
      create: {
        id: 'a0000000-0000-0000-0000-000000000001',
        name: 'Rida', email: 'rida@accelit.com', password, role: 'admin',
      },
    }),
    prisma.user.upsert({
      where:  { email: 'oussama@accelit.com' },
      update: {},
      create: {
        id: 'a0000000-0000-0000-0000-000000000002',
        name: 'Oussama', email: 'oussama@accelit.com', password, role: 'admin',
      },
    }),
    prisma.user.upsert({
      where:  { email: 'saida@accelit.com' },
      update: {},
      create: {
        id: 'a0000000-0000-0000-0000-000000000003',
        name: 'Saida', email: 'saida@accelit.com', password, role: 'team',
      },
    }),
    prisma.user.upsert({
      where:  { email: 'sana@accelit.com' },
      update: {},
      create: {
        id: 'a0000000-0000-0000-0000-000000000004',
        name: 'Sana', email: 'sana@accelit.com', password, role: 'team',
      },
    }),
  ]);

  console.log(`  ✓ Users: ${[rida, oussama, saida, sana].map(u => u.name).join(', ')}`);

  // ── Products ─────────────────────────────────────────────────
  const [brain, collagen, sleep] = await Promise.all([
    prisma.product.upsert({
      where:  { id: 'b0000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: 'b0000000-0000-0000-0000-000000000001',
        name: 'Brain Supplement',
        description: 'Nootropic formula for focus and cognitive performance.',
        adAccounts: 'Meta, TikTok',
        monthlyBudget: '$4,200/mo',
        createdBy: rida.id,
      },
    }),
    prisma.product.upsert({
      where:  { id: 'b0000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: 'b0000000-0000-0000-0000-000000000002',
        name: 'Collagen Powder',
        description: 'Beauty supplement for skin, hair and nails.',
        adAccounts: 'Meta, Pinterest',
        monthlyBudget: '$2,800/mo',
        createdBy: rida.id,
      },
    }),
    prisma.product.upsert({
      where:  { id: 'b0000000-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: 'b0000000-0000-0000-0000-000000000003',
        name: 'Sleep Supplement',
        description: 'Melatonin + Magnesium blend for deep, restful sleep.',
        adAccounts: 'Meta',
        monthlyBudget: '$3,100/mo',
        createdBy: rida.id,
      },
    }),
  ]);

  console.log(`  ✓ Products: ${[brain, collagen, sleep].map(p => p.name).join(', ')}`);

  // ── Tasks ─────────────────────────────────────────────────────
  const today     = new Date();
  const inTwoDays = new Date(today); inTwoDays.setDate(today.getDate() + 2);
  const inFiveDays = new Date(today); inFiveDays.setDate(today.getDate() + 5);
  const twoDaysAgo = new Date(today); twoDaysAgo.setDate(today.getDate() - 2);

  const tasks = await Promise.all([
    prisma.task.upsert({
      where:  { id: 'c0000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: 'c0000000-0000-0000-0000-000000000001',
        title: '10 UGC Videos — Brain Supplement',
        description: 'Create 10 UGC-style video creatives for Meta ads.',
        assignedTo: saida.id,
        createdBy: rida.id,
        productId: brain.id,
        type: 'creative_video',
        status: 'todo',
        visibility: 'team',
        dueDate: inTwoDays,
      },
    }),
    prisma.task.upsert({
      where:  { id: 'c0000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: 'c0000000-0000-0000-0000-000000000002',
        title: 'LP V2 — Collagen Powder',
        description: 'Redesign landing page with new testimonials section.',
        assignedTo: sana.id,
        createdBy: rida.id,
        productId: collagen.id,
        type: 'landing_page',
        status: 'in_progress',
        visibility: 'team',
        dueDate: inFiveDays,
      },
    }),
    prisma.task.upsert({
      where:  { id: 'c0000000-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: 'c0000000-0000-0000-0000-000000000003',
        title: 'Static Banners 5-pack — Sleep',
        description: 'Design 5 static banner variants (1080×1080 + 1080×1920).',
        assignedTo: saida.id,
        createdBy: rida.id,
        productId: sleep.id,
        type: 'creative_image',
        status: 'todo',
        visibility: 'team',
        dueDate: inFiveDays,
      },
    }),
    prisma.task.upsert({
      where:  { id: 'c0000000-0000-0000-0000-000000000004' },
      update: {},
      create: {
        id: 'c0000000-0000-0000-0000-000000000004',
        title: 'Competitor Research — Brain',
        description: 'Analyze top 5 competitor ads from last 30 days.',
        assignedTo: sana.id,
        createdBy: rida.id,
        productId: brain.id,
        type: 'research',
        status: 'todo',
        visibility: 'admin_only',   // hidden from team
        dueDate: twoDaysAgo,        // delayed
      },
    }),
    prisma.task.upsert({
      where:  { id: 'c0000000-0000-0000-0000-000000000005' },
      update: {},
      create: {
        id: 'c0000000-0000-0000-0000-000000000005',
        title: 'Hook Variations × 8 — Sleep',
        description: 'Test 8 different hook scripts as 15s videos.',
        assignedTo: oussama.id,
        createdBy: rida.id,
        productId: sleep.id,
        type: 'creative_video',
        status: 'todo',
        visibility: 'team',
        dueDate: twoDaysAgo,        // delayed
      },
    }),
    // One completed task that triggered asset auto-creation
    prisma.task.upsert({
      where:  { id: 'c0000000-0000-0000-0000-000000000006' },
      update: {},
      create: {
        id: 'c0000000-0000-0000-0000-000000000006',
        title: 'Brain UGC Pack',
        description: '10 UGC videos batch — completed.',
        assignedTo: saida.id,
        createdBy: rida.id,
        productId: brain.id,
        type: 'creative_video',
        status: 'done',
        assetLink: 'https://drive.google.com/example/brain-ugc-pack',
        visibility: 'team',
        dueDate: new Date(today.getTime() - 3 * 86400000),
      },
    }),
  ]);

  console.log(`  ✓ Tasks: ${tasks.length} seeded`);

  // ── Media Asset (from completed task) ────────────────────────
  await prisma.mediaAsset.upsert({
    where:  { sourceTaskId: 'c0000000-0000-0000-0000-000000000006' },
    update: {},
    create: {
      productId:    brain.id,
      name:         'Brain UGC Pack',
      type:         'creative_video',
      link:         'https://drive.google.com/example/brain-ugc-pack',
      createdBy:    saida.id,         // ← assigned_to, not created_by
      sourceTaskId: 'c0000000-0000-0000-0000-000000000006',
    },
  });

  console.log('  ✓ Media assets: 1 seeded (auto-created from completed task)');
  console.log('\n✅ Seed complete.');
  console.log('\nDefault login credentials (all users):');
  console.log('  rida@accelit.com     / accelit2024  (admin)');
  console.log('  oussama@accelit.com  / accelit2024  (admin)');
  console.log('  saida@accelit.com    / accelit2024  (team)');
  console.log('  sana@accelit.com     / accelit2024  (team)');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
