-- ============================================================
-- Migration 005: Create media_assets table
-- ============================================================

BEGIN;

CREATE TABLE media_assets (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID         NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  name             VARCHAR(255) NOT NULL,
  type             asset_type   NOT NULL,
  link             TEXT         NOT NULL,
  created_by       UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  source_task_id   UUID         UNIQUE REFERENCES tasks(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- The UNIQUE constraint on source_task_id is the duplicate-protection
-- mechanism for the Task→Asset automation. Even if the completion
-- endpoint fires twice (retry / race), only one asset is ever created.

-- Index: product assets page — SELECT * WHERE product_id = ? ORDER BY created_at DESC
CREATE INDEX idx_assets_product_id ON media_assets(product_id);

-- Index: lookup by creator (team member attribution)
CREATE INDEX idx_assets_created_by ON media_assets(created_by);

-- Index: reverse-lookup — which asset came from which task
CREATE INDEX idx_assets_source_task ON media_assets(source_task_id);

COMMIT;
