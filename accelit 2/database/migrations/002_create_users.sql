-- ============================================================
-- Migration 002: Create users table
-- ============================================================
-- NOTE: This migration creates the table structure only.
-- User records are inserted via the seed script:
--   cd backend && npm run db:seed
--
-- The seed script generates real bcrypt hashes at runtime.
-- Do NOT hardcode password hashes in migration files.
-- ============================================================

BEGIN;

CREATE TABLE users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(100)        NOT NULL,
  email        VARCHAR(255)        NOT NULL UNIQUE,
  password     TEXT                NOT NULL,
  role         user_role           NOT NULL DEFAULT 'team',
  created_at   TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

COMMIT;
