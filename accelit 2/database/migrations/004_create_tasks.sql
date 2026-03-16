-- ============================================================
-- Migration 004: Create tasks table
-- ============================================================

BEGIN;

CREATE TABLE tasks (
  id            UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(255)     NOT NULL,
  description   TEXT,
  assigned_to   UUID             NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_by    UUID             NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  product_id    UUID             REFERENCES products(id) ON DELETE SET NULL,
  type          task_type        NOT NULL,
  status        task_status      NOT NULL DEFAULT 'todo',
  asset_link    TEXT,
  visibility    task_visibility  NOT NULL DEFAULT 'team',
  due_date      DATE             NOT NULL,
  created_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- Index: Kanban column — all tasks for a given assignee
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);

-- Index: all tasks for a product (product detail / tasks tab)
CREATE INDEX idx_tasks_product_id ON tasks(product_id);

-- Index: date-range queries — active tasks, delayed tasks, date filter
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Index: status filter (done vs active) — used by dashboard counts
CREATE INDEX idx_tasks_status ON tasks(status);

-- Index: visibility filter — enforced in every query for team users
CREATE INDEX idx_tasks_visibility ON tasks(visibility);

-- Composite: most common dashboard query pattern
CREATE INDEX idx_tasks_status_due ON tasks(status, due_date);

COMMIT;
