-- ============================================================
-- Migration 003: Create products table
-- ============================================================

BEGIN;

CREATE TABLE products (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(200)   NOT NULL,
  description      TEXT,
  ad_accounts      VARCHAR(200),
  monthly_budget   VARCHAR(50),
  status           product_status NOT NULL DEFAULT 'active',
  created_by       UUID           NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Index: fast lookup of products by creator
CREATE INDEX idx_products_created_by ON products(created_by);

-- Index: filter by status (active/paused/archived)
CREATE INDEX idx_products_status ON products(status);

-- Seed example products
INSERT INTO products (id, name, description, ad_accounts, monthly_budget, created_by) VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'Brain Supplement',
    'Nootropic formula for focus and cognitive performance.',
    'Meta, TikTok',
    '$4,200/mo',
    'a0000000-0000-0000-0000-000000000001'   -- created by Rida
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'Collagen Powder',
    'Beauty supplement for skin, hair and nails.',
    'Meta, Pinterest',
    '$2,800/mo',
    'a0000000-0000-0000-0000-000000000001'
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'Sleep Supplement',
    'Melatonin + Magnesium blend for deep, restful sleep.',
    'Meta',
    '$3,100/mo',
    'a0000000-0000-0000-0000-000000000001'
  );

COMMIT;
