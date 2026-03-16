-- ============================================================
-- Migration 006: Create landing_pages table
-- ============================================================

BEGIN;

CREATE TABLE landing_pages (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID         NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  name             VARCHAR(255) NOT NULL,
  url              TEXT         NOT NULL,
  source_task_id   UUID         UNIQUE REFERENCES tasks(id) ON DELETE SET NULL,
  created_by       UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_landing_pages_product_id ON landing_pages(product_id);
CREATE INDEX idx_landing_pages_created_by ON landing_pages(created_by);

COMMIT;
