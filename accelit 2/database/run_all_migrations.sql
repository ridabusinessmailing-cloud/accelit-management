-- ============================================================
-- run_all_migrations.sql
-- Run this file against a fresh database to build the full schema.
-- psql -U postgres -d accelit_db -f run_all_migrations.sql
-- ============================================================

\echo '--- 001: ENUM types ---'
\i migrations/001_create_enums.sql

\echo '--- 002: users ---'
\i migrations/002_create_users.sql

\echo '--- 003: products ---'
\i migrations/003_create_products.sql

\echo '--- 004: tasks ---'
\i migrations/004_create_tasks.sql

\echo '--- 005: media_assets ---'
\i migrations/005_create_media_assets.sql

\echo '--- 006: landing_pages ---'
\i migrations/006_create_landing_pages.sql

\echo '=== All migrations complete ==='
