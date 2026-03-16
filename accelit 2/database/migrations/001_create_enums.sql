-- ============================================================
-- Migration 001: Create ENUM types
-- Accelit Management Platform
-- ============================================================

BEGIN;

CREATE TYPE user_role AS ENUM ('admin', 'team');

CREATE TYPE task_type AS ENUM (
  'creative_video',
  'creative_image',
  'landing_page',
  'research',
  'other'
);

CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');

CREATE TYPE task_visibility AS ENUM ('team', 'admin_only');

CREATE TYPE asset_type AS ENUM (
  'creative_video',
  'creative_image',
  'landing_page'
);

CREATE TYPE product_status AS ENUM ('active', 'paused', 'archived');

COMMIT;
